
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';

import {
  Member,
  Application,
  Project,
  SocialLink,
  StudioSettings,
  WebsiteCustomization,
  OFFICIAL_RANKS,
  Rank
} from './src/types/index.ts';

import {
  validateApplication,
  generateApplicationId
} from './src/utils/applicationValidation.ts';

import {
  getNextDisplayOrder,
  sortMembersByOrder,
  reindexMembers
} from './src/utils/memberOrder.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================
   DATABASE TYPES
========================================= */

interface DatabaseSchema {
  adminUser: {
    email: string;
    passwordHash: string;
    role: string;
  };

  members: Member[];
  applications: Application[];
  projects: Project[];
  socialLinks: SocialLink[];
  settings: StudioSettings;
  customization: WebsiteCustomization;

  supabaseConfig?: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    isEnabled: boolean;
  };
}

/* =========================================
   DEFAULT SETTINGS
========================================= */

const DEFAULT_MEMBERS: Member[] = [];
const DEFAULT_APPLICATIONS: Application[] = [];
const DEFAULT_PROJECTS: Project[] = [];
const DEFAULT_SOCIAL_LINKS: SocialLink[] = [];

const DEFAULT_SETTINGS: StudioSettings = {
  studioName: 'BlackBird Studio',
  tagline: 'The Premier Bangla Anime Dubbing House',
  logoUrl: '',
  groupPictureUrl: '',
  contactEmail: '',
  announcementText: '',
  isAnnouncementVisible: false,
  foundedYear: '2022'
};

const DEFAULT_CUSTOMIZATION: WebsiteCustomization = {
  accentColor: '#d4af37',
  bgColor: '#08080a',
  cardStyle: 'glass',
  animationsEnabled: true,
  animationIntensity: 'cinematic',
  hoverEffectsEnabled: true,
  pageTransitions: true,
  desktopBgImage: '',
  mobileBgImage: '',
  bgOverlayOpacity: 0.85,

  heroHeading: 'WELCOME TO BLACKBIRD STUDIO',

  heroDescription:
    'A creative community of passionate voice artists and dubbing enthusiasts bringing the world of anime alive in Bangla.',

  visibleSections: {
    hero: true,
    story: true,
    members: true,
    projects: true,
    joinUs: true,
    social: true,
    contact: true
  }
};

/* =========================================
   NEON DATABASE
========================================= */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

const sql = neon(DATABASE_URL);

/* =========================================
   SUPABASE STORAGE
========================================= */

const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_SECRET =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SECRET_KEY are required.'
  );
}


const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'blackbird-studio-server'
      }
    }
  }
);

/* =========================================
   LOCAL MIGRATION PATH
========================================= */

const DATA_DIR = path.resolve(
  process.env.DATA_DIR || path.join(__dirname, 'data')
);

const DB_FILE = path.join(DATA_DIR, 'database.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

let database: DatabaseSchema | null = null;

let writeQueue: Promise<void> = Promise.resolve();

/* =========================================
   DATABASE VALIDATION
========================================= */

function validateDatabase(
  value: any
): value is DatabaseSchema {
  return (
    !!value &&
    typeof value === 'object' &&
    !!value.adminUser &&
    typeof value.adminUser.email === 'string' &&
    typeof value.adminUser.passwordHash === 'string' &&
    Array.isArray(value.members) &&
    Array.isArray(value.applications) &&
    Array.isArray(value.projects) &&
    Array.isArray(value.socialLinks) &&
    !!value.settings &&
    !!value.customization
  );
}

function readDatabase(): DatabaseSchema {
  if (!database) {
    throw new Error(
      'Database has not finished initializing.'
    );
  }

  return database;
}

/* =========================================
   DATABASE SAVE
========================================= */

function saveDatabase(db: DatabaseSchema): void {
  database = db;

  const snapshot = JSON.stringify(db);

  writeQueue = writeQueue
    .catch((error) => {
      console.error(
        '[BlackBird] Previous database write failed:',
        error
      );
    })
    .then(async () => {
      await sql`
        INSERT INTO blackbird_studio_data
          (id, payload, updated_at)
        VALUES
          ('main', ${snapshot}::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_at = NOW()
      `;
    });
}

async function flushWrites(): Promise<void> {
  await writeQueue;
}

/* =========================================
   DATABASE INITIALIZATION
========================================= */

async function initializeDatabase(): Promise<void> {
  console.log('[BlackBird] Loading database from Neon...');

  const rows = await sql`
    SELECT payload
    FROM blackbird_studio_data
    WHERE id = 'main'
    LIMIT 1
  `;

  if (rows.length > 0) {
    const payload = rows[0].payload;

    const parsed =
      typeof payload === 'string'
        ? JSON.parse(payload)
        : payload;

    if (!validateDatabase(parsed)) {
      throw new Error(
        '[BlackBird] Existing Neon database has an invalid structure. Data was not overwritten.'
      );
    }

    database = parsed as DatabaseSchema;

    console.log('[BlackBird] Existing database loaded successfully.');
    return;
  }

  throw new Error(
    '[BlackBird] No existing database found in Neon. Existing data was not overwritten.'
  );
}

/* =========================================
   AUTHENTICATION AND RATE LIMITING
========================================= */

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/* =========================================
   MEMBER AUTHENTICATION CONFIGURATION
========================================= */

const MEMBER_SESSION_TTL_MS =
  30 * 24 * 60 * 60 * 1000;

const MEMBER_COOKIE_NAME = 'bbs_member_session';

function hashMemberToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

function normalizeMemberEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidMemberEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getMemberCookie(req: Request): string | null {
  const cookieHeader = req.headers.cookie || '';

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const separator = cookie.indexOf('=');

    if (separator < 0) continue;

    const name = cookie.slice(0, separator).trim();

    if (name !== MEMBER_COOKIE_NAME) continue;

    return decodeURIComponent(
      cookie.slice(separator + 1).trim()
    );
  }

  return null;
}

function setMemberCookie(
  res: Response,
  token: string
): void {
  const secure =
    process.env.NODE_ENV === 'production'
      ? '; Secure'
      : '';

  res.setHeader(
    'Set-Cookie',
    `${MEMBER_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(MEMBER_SESSION_TTL_MS / 1000)}${secure}`
  );
}

function clearMemberCookie(res: Response): void {
  const secure =
    process.env.NODE_ENV === 'production'
      ? '; Secure'
      : '';

  res.setHeader(
    'Set-Cookie',
    `${MEMBER_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  );
}


const activeSessions = new Map<string, number>();

const rateBuckets = new Map<
  string,
  { count: number; resetAt: number }
>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function rateLimit(
  prefix: string,
  limit: number,
  windowMs: number
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const key =
      `${prefix}:` +
      (req.ip || req.socket.remoteAddress || 'unknown');

    const now = Date.now();

    let bucket = rateBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + windowMs
      };
    }

    bucket.count++;

    rateBuckets.set(key, bucket);

    res.setHeader('RateLimit-Limit', String(limit));

    res.setHeader(
      'RateLimit-Remaining',
      String(Math.max(0, limit - bucket.count))
    );

    if (bucket.count > limit) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.'
      });
    }

    next();
  };
}

/* =========================================
   MEDIA UPLOAD CONFIGURATION
========================================= */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 100 * 1024 * 1024
  },

  fileFilter: (_req, file, cb) => {
    const ext = path
      .extname(file.originalname)
      .toLowerCase();

    const imageExt = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.gif'
    ];

    const videoExt = [
      '.mp4',
      '.webm',
      '.mov',
      '.m4v',
      '.mkv'
    ];

    const allowedMime = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-matroska',
      'video/x-m4v'
    ];

    if (
      [...imageExt, ...videoExt].includes(ext) &&
      allowedMime.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Unsupported file format. Upload an image or video.'
        )
      );
    }
  }
});

/* =========================================
   MEDIA SIGNATURE VALIDATION
========================================= */

function hasValidMediaSignature(
  buffer: Buffer,
  ext: string
): boolean {
  if (['.jpg', '.jpeg'].includes(ext)) {
    return (
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (ext === '.png') {
    return buffer
      .subarray(0, 8)
      .equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      );
  }

  if (ext === '.gif') {
    return buffer
      .subarray(0, 6)
      .toString('ascii')
      .startsWith('GIF8');
  }

  if (ext === '.webp') {
    return (
      buffer.subarray(0, 4).toString() === 'RIFF' &&
      buffer.subarray(8, 12).toString() === 'WEBP'
    );
  }

  if (['.mp4', '.mov', '.m4v'].includes(ext)) {
    return buffer.subarray(4, 8).toString() === 'ftyp';
  }

  if (['.webm', '.mkv'].includes(ext)) {
    return buffer
      .subarray(0, 4)
      .equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  }

  return false;
}

/* =========================================
   CREATE SERVER
========================================= */

export async function createServer() {
  await initializeDatabase();

  const app = express();

  const PORT = Number(process.env.PORT || 3000);

  app.disable('x-powered-by');

  app.use(
    (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      res.setHeader(
        'X-Content-Type-Options',
        'nosniff'
      );

      res.setHeader(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      );

      res.setHeader('X-Frame-Options', 'DENY');

      if (process.env.NODE_ENV === 'production') {
        res.setHeader(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains'
        );
      }

      /*
       * Wait for queued database writes before sending JSON.
       */

      const originalJson = res.json.bind(res);

      res.json = ((body: any) => {
        return flushWrites()
          .then(() => originalJson(body))
          .catch((error) => {
            console.error(
              '[BlackBird] Neon write failed:',
              error
            );

            if (!res.headersSent) {
              return res.status(503).send({
                error: 'Could not save data. Please retry.'
              });
            }

            return res;
          });
      }) as any;

      next();
    }
  );

  app.use(express.json({ limit: '2mb' }));

  app.use(
    express.urlencoded({
      extended: true,
      limit: '2mb'
    })
  );

  /* =========================================
     ADMIN AUTH MIDDLEWARE
  ========================================= */

  function requireAdminAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: Admin session required.'
      });
    }

    const token = header.slice(7);

    const expires = activeSessions.get(token);

    if (!expires || expires <= Date.now()) {
      activeSessions.delete(token);

      return res.status(401).json({
        error: 'Session expired or invalid. Please log in again.'
      });
    }

    next();
  }

  /* =========================================
     PUBLIC WEBSITE DATA
  ========================================= */

  app.get('/api/public-data', (_req, res) => {
    const db = readDatabase();

    res.json({
      members: sortMembersByOrder(
        db.members.filter((m) => m.isActive)
      ).map(({ sourceApplicationId: _source, ...member }) => member),

      projects: [...db.projects]
        .filter((p) => p.isPublished)
        .sort((a, b) => a.displayOrder - b.displayOrder),

      socialLinks: [...db.socialLinks]
        .filter((s) => s.isVisible)
        .sort((a, b) => a.displayOrder - b.displayOrder),

      settings: db.settings,
      customization: db.customization
    });
  });

  /* =========================================
     APPLICATION TRACKING
  ========================================= */

  app.get(
    '/api/applications/track/:id',
    rateLimit('track', 20, 15 * 60 * 1000),
    (req, res) => {
      res.setHeader('Cache-Control', 'no-store');

      const item = readDatabase().applications.find(
        (a) =>
          a.id.toLowerCase() ===
          req.params.id.trim().toLowerCase()
      );

      if (!item) {
        return res.status(404).json({
          error: 'No application found with this ID.'
        });
      }

      res.json({
        id: item.id,
        fullName: item.fullName,
        desiredRank: item.desiredRank,
        status: item.status,
        submittedAt: item.submittedAt,

        statusMessage:
          item.status === 'approved'
            ? 'Congratulations! Your application has been approved. You are now an official voice member of BlackBird Studio!'
            : item.status === 'rejected'
              ? 'Thank you for your interest. At this time, we are unable to accept your application. You are welcome to re-apply in the next season.'
              : 'Your application is currently under review by BlackBird Studio administration. We appreciate your patience!'
      });
    }
  );

  /* =========================================
     SUBMIT APPLICATION
  ========================================= */

  app.post(
    '/api/applications',
    rateLimit('application-submit', 5, 60 * 60 * 1000),
    (req, res) => {
      const validation = validateApplication(req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validation.errors
        });
      }

      const db = readDatabase();

      let id = generateApplicationId();

      while (db.applications.some((a) => a.id === id)) {
        id = generateApplicationId();
      }

      const item: Application = {
        id,
        fullName: req.body.fullName.trim(),
        avatarUrl: req.body.avatarUrl.trim(),
        desiredRank: req.body.desiredRank as Rank,
        hobbies: req.body.hobbies.trim(),
        bio: req.body.bio.trim(),
        motivation: req.body.motivation.trim(),
        dubbingExperience:
          req.body.dubbingExperience?.trim() || '',
        contactInfo: req.body.contactInfo.trim(),
        additionalInfo:
          req.body.additionalInfo?.trim() || '',
        isConfirmed: Boolean(req.body.isConfirmed),
        status: 'pending',
        submittedAt: new Date().toISOString(),
        adminNotes: ''
      };

      db.applications.unshift(item);

      saveDatabase(db);

      res.status(201).json({
        success: true,
        applicationId: id,
        message:
          'Your application has been received successfully and is set to Pending status.'
      });
    }
  );

  /* =========================================
     SUPABASE STORAGE UPLOAD
  ========================================= */

  
app.post(
  '/api/upload',
  rateLimit('upload', 15, 60 * 60 * 1000),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded.'
        });
      }

      const ext = path
        .extname(req.file.originalname)
        .toLowerCase();

      if (!hasValidMediaSignature(req.file.buffer, ext)) {
        return res.status(400).json({
          error: 'Invalid image or video file format.'
        });
      }

      const safeBase = path
        .basename(req.file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 80) || 'media';

      const filename =
        `${safeBase}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

      const storagePath =
        `${new Date().toISOString().slice(0, 10)}/${filename}`;

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from(BUCKET)
          .upload(storagePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
            cacheControl: '31536000'
          });

      if (uploadError) {
        console.error('[BlackBird] Supabase upload error:', {
          message: uploadError.message,
          name: uploadError.name
        });

        return res.status(502).json({
          error: 'Supabase upload failed.',
          details: uploadError.message
        });
      }

      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(uploadData.path);

      if (!publicData?.publicUrl) {
        return res.status(502).json({
          error: 'Upload completed, but public URL could not be generated.'
        });
      }

      return res.json({
        success: true,
        url: publicData.publicUrl,
        filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

    } catch (error) {
      console.error('[BlackBird] Upload route exception:', error);

      return res.status(500).json({
        error: 'Unexpected upload error.'
      });
    }
  }
);

  /* =========================================
     ADMIN LOGIN
  ========================================= */

  app.post(
    '/api/auth/login',
    rateLimit('admin-login', 5, 15 * 60 * 1000),
    (req, res) => {
      const { email, password } = req.body || {};

      if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        !password
      ) {
        return res.status(400).json({
          error: 'Email and password are required.'
        });
      }

      const db = readDatabase();

      if (
        db.adminUser.email.toLowerCase() !==
          email.trim().toLowerCase() ||
        !bcrypt.compareSync(
          password,
          db.adminUser.passwordHash
        )
      ) {
        return res.status(401).json({
          error: 'Invalid admin credentials.'
        });
      }

      const token = generateToken();

      activeSessions.set(
        token,
        Date.now() + SESSION_TTL_MS
      );

      res.json({
        success: true,
        token,
        user: {
          email: db.adminUser.email,
          role: db.adminUser.role
        }
      });
    }
  );

  /* =========================================
     LOGOUT AND SESSION
  ========================================= */

  app.post('/api/auth/logout', (req, res) => {
    const header = req.headers.authorization;

    if (header?.startsWith('Bearer ')) {
      activeSessions.delete(header.slice(7));
    }

    res.json({ success: true });
  });

  app.get('/api/auth/session', (req, res) => {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return res.json({ authenticated: false });
    }

    const token = header.slice(7);

    const expires = activeSessions.get(token);

    if (!expires || expires <= Date.now()) {
      activeSessions.delete(token);

      return res.json({ authenticated: false });
    }

    const db = readDatabase();

    res.json({
      authenticated: true,
      user: {
        email: db.adminUser.email,
        role: db.adminUser.role
      }
    });
  });

  /* =========================================
     CHANGE ADMIN PASSWORD
  ========================================= */

  app.post(
    '/api/auth/change-password',
    requireAdminAuth,
    (req, res) => {
      const { currentPassword, newPassword } =
        req.body || {};

      if (
        typeof currentPassword !== 'string' ||
        typeof newPassword !== 'string' ||
        newPassword.length < 12
      ) {
        return res.status(400).json({
          error:
            'Current password is required and the new password must be at least 12 characters long.'
        });
      }

      const db = readDatabase();

      if (
        !bcrypt.compareSync(
          currentPassword,
          db.adminUser.passwordHash
        )
      ) {
        return res.status(400).json({
          error: 'Incorrect current password.'
        });
      }

      db.adminUser.passwordHash =
        bcrypt.hashSync(newPassword, 12);

      saveDatabase(db);

      activeSessions.clear();

      res.json({
        success: true,
        message:
          'Admin password updated successfully. Please log in again.'
      });
    }
  );

  /* =========================================
     ADMIN ALL DATA
  ========================================= */

  app.get(
    '/api/admin/all-data',
    requireAdminAuth,
    (_req, res) => {
      const db = readDatabase();

      res.json({
        members: sortMembersByOrder(db.members),

        applications: db.applications,

        projects: [...db.projects].sort(
          (a, b) => a.displayOrder - b.displayOrder
        ),

        socialLinks: [...db.socialLinks].sort(
          (a, b) => a.displayOrder - b.displayOrder
        ),

        settings: db.settings,

        customization: db.customization,

        supabaseConfig:
          db.supabaseConfig || {
            supabaseUrl: '',
            supabaseAnonKey: '',
            isEnabled: false
          },

        stats: {
          totalMembers: db.members.length,

          activeMembers:
            db.members.filter((m) => m.isActive).length,

          pendingApplications:
            db.applications.filter(
              (a) => a.status === 'pending'
            ).length,

          approvedApplications:
            db.applications.filter(
              (a) => a.status === 'approved'
            ).length,

          rejectedApplications:
            db.applications.filter(
              (a) => a.status === 'rejected'
            ).length,

          totalProjects: db.projects.length,

          publishedProjects:
            db.projects.filter((p) => p.isPublished).length
        }
      });
    }
  );

  /* =========================================
     ADD MEMBER
  ========================================= */

  app.post(
    '/api/admin/members',
    requireAdminAuth,
    (req, res) => {
      const {
        name,
        rank,
        avatarUrl,
        hobbies,
        bio,
        joiningDate,
        isActive
      } = req.body;

      if (
        !name ||
        !rank ||
        !(OFFICIAL_RANKS as readonly string[]).includes(rank)
      ) {
        return res.status(400).json({
          error: 'Valid Name and official Rank are required.'
        });
      }

      const db = readDatabase();

      const member: Member = {
        id: 'bbs-mem-' + Date.now(),
        name: name.trim(),
        rank: rank as Rank,
        avatarUrl: avatarUrl?.trim() || '',
        hobbies: hobbies?.trim() || '',
        bio: bio?.trim() || '',
        joiningDate:
          joiningDate || new Date().toISOString().slice(0, 10),
        isActive:
          isActive !== undefined ? Boolean(isActive) : true,
        displayOrder: getNextDisplayOrder(db.members)
      };

      db.members.push(member);

      saveDatabase(db);

      res.status(201).json({
        success: true,
        member
      });
    }
  );

  /* =========================================
     REORDER MEMBERS
  ========================================= */

  app.put(
    '/api/admin/members/reorder',
    requireAdminAuth,
    (req, res) => {
      const { orderedIds } = req.body;

      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({
          error: 'orderedIds array is required.'
        });
      }

      const db = readDatabase();

      const map = new Map(
        db.members.map((member) => [member.id, member])
      );

      const ordered: Member[] = [];

      orderedIds.forEach((id: string) => {
        const member = map.get(id);

        if (member) {
          ordered.push({
            ...member,
            displayOrder: ordered.length + 1
          });

          map.delete(id);
        }
      });

      map.forEach((member) => {
        ordered.push({
          ...member,
          displayOrder: ordered.length + 1
        });
      });

      db.members = ordered;

      saveDatabase(db);

      res.json({
        success: true,
        members: sortMembersByOrder(db.members)
      });
    }
  );

  /* =========================================
     UPDATE MEMBER
  ========================================= */

  app.put(
    '/api/admin/members/:id',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      const index = db.members.findIndex(
        (member) => member.id === req.params.id
      );

      if (index < 0) {
        return res.status(404).json({
          error: 'Member not found.'
        });
      }

      const update = req.body || {};

      if (
        update.rank !== undefined &&
        !(OFFICIAL_RANKS as readonly string[]).includes(
          update.rank
        )
      ) {
        return res.status(400).json({
          error: 'Rank must be one of the official ranks.'
        });
      }

      const allowed = [
        'name',
        'rank',
        'avatarUrl',
        'hobbies',
        'bio',
        'joiningDate',
        'isActive'
      ];

      const safe = Object.fromEntries(
        allowed
          .filter((key) => update[key] !== undefined)
          .map((key) => [key, update[key]])
      );

      if (
        safe.name !== undefined &&
        (
          typeof safe.name !== 'string' ||
          !safe.name.trim()
        )
      ) {
        return res.status(400).json({
          error: 'Member name is required.'
        });
      }

      db.members[index] = {
        ...db.members[index],
        ...safe,
        id: db.members[index].id
      };

      saveDatabase(db);

      res.json({
        success: true,
        member: db.members[index]
      });
    }
  );

  /* =========================================
     DELETE MEMBER
  ========================================= */

  app.delete(
    '/api/admin/members/:id',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      const filtered = db.members.filter(
        (member) => member.id !== req.params.id
      );

      if (filtered.length === db.members.length) {
        return res.status(404).json({
          error: 'Member not found.'
        });
      }

      db.members = reindexMembers(filtered);

      saveDatabase(db);

      res.json({
        success: true,
        message: 'Member removed permanently.'
      });
    }
  );

  /* =========================================
     UPDATE APPLICATION
  ========================================= */

  app.put(
    '/api/admin/applications/:id',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      const index = db.applications.findIndex(
        (application) => application.id === req.params.id
      );

      if (index < 0) {
        return res.status(404).json({
          error: 'Application not found.'
        });
      }

      const update = req.body || {};

      if (
        update.status !== undefined &&
        !['pending', 'approved', 'rejected'].includes(
          update.status
        )
      ) {
        return res.status(400).json({
          error: 'Invalid application status.'
        });
      }

      const allowed = ['adminNotes', 'status'];

      const safe = Object.fromEntries(
        allowed
          .filter((key) => update[key] !== undefined)
          .map((key) => [key, update[key]])
      );

      db.applications[index] = {
        ...db.applications[index],
        ...safe,
        id: db.applications[index].id
      };

      saveDatabase(db);

      res.json({
        success: true,
        application: db.applications[index]
      });
    }
  );

  /* =========================================
     APPROVE APPLICATION
  ========================================= */

  app.post(
    '/api/admin/applications/:id/approve',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      const index = db.applications.findIndex(
        (application) => application.id === req.params.id
      );

      if (index < 0) {
        return res.status(404).json({
          error: 'Application not found.'
        });
      }

      const application = db.applications[index];

      if (application.status === 'approved') {
        return res.json({
          success: true,
          message: 'This application has already been approved.',
          application,
          member:
            db.members.find(
              (member) =>
                member.sourceApplicationId === application.id
            ) || null
        });
      }

      application.status = 'approved';

      if (req.body?.adminNotes) {
        application.adminNotes = req.body.adminNotes;
      }

      const member: Member = {
        id: 'bbs-mem-' + Date.now(),
        sourceApplicationId: application.id,
        name: application.fullName,
        rank: application.desiredRank,
        avatarUrl: application.avatarUrl,
        hobbies: application.hobbies,
        bio: application.bio,
        joiningDate: new Date().toISOString().slice(0, 10),
        isActive: true,
        displayOrder: getNextDisplayOrder(db.members)
      };

      db.members.push(member);

      saveDatabase(db);

      res.json({
        success: true,
        message:
          `${application.fullName} has been approved and added to the official member roster!`,
        application,
        member
      });
    }
  );

  /* =========================================
     REJECT APPLICATION
  ========================================= */

  app.post(
    '/api/admin/applications/:id/reject',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      const index = db.applications.findIndex(
        (application) => application.id === req.params.id
      );

      if (index < 0) {
        return res.status(404).json({
          error: 'Application not found.'
        });
      }

      db.applications[index].status = 'rejected';

      if (req.body?.adminNotes) {
        db.applications[index].adminNotes =
          req.body.adminNotes;
      }

      saveDatabase(db);

      res.json({
        success: true,
        application: db.applications[index]
      });
    }
  );

  /* =========================================
     ADD PROJECT
  ========================================= */

  app.post(
    '/api/admin/projects',
    requireAdminAuth,
    (req, res) => {
      const body = req.body || {};

      if (!body.title || !body.animeName) {
        return res.status(400).json({
          error: 'Project Title and Anime Name are required.'
        });
      }

      const db = readDatabase();

      const max = db.projects.length
        ? Math.max(
            ...db.projects.map(
              (project) => project.displayOrder || 0
            )
          )
        : 0;

      const project: Project = {
        id: 'bbs-proj-' + Date.now(),
        title: body.title.trim(),
        animeName: body.animeName.trim(),
        episodeNumber: body.episodeNumber?.trim() || '',
        description: body.description?.trim() || '',
        releaseDate:
          body.releaseDate ||
          new Date().toISOString().slice(0, 10),
        category: body.category?.trim() || 'Anime Dub',
        thumbnailUrl: body.thumbnailUrl?.trim() || '',
        videoUrl: body.videoUrl?.trim() || '',
        videoType: body.videoType || 'upload',
        isFeatured: Boolean(body.isFeatured),
        isPublished:
          body.isPublished !== undefined
            ? Boolean(body.isPublished)
            : true,
        displayOrder: max + 1
      };

      db.projects.push(project);

      saveDatabase(db);

      res.status(201).json({
        success: true,
        project
      });
    }
  );

  /* =========================================
     REORDER PROJECTS
  ========================================= */

  app.put(
    '/api/admin/projects/reorder',
    requireAdminAuth,
    (req, res) => {
      const { orderedIds } = req.body;

      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({
          error: 'orderedIds array required.'
        });
      }

      const db = readDatabase();

      const map = new Map(
        db.projects.map((project) => [
          project.id,
          project
        ])
      );

      const ordered: Project[] = [];

      orderedIds.forEach((id: string) => {
        const project = map.get(id);

        if (project) {
          ordered.push({
            ...project,
            displayOrder: ordered.length + 1
          });

          map.delete(id);
        }
      });

      map.forEach((project) => {
        ordered.push({
          ...project,
          displayOrder: ordered.length + 1
        });
      });

      db.projects = ordered;

      saveDatabase(db);

      res.json({
        success: true,
        projects: db.projects
      });
    }
  );

  /* =========================================
     UPDATE PROJECT
  ========================================= */

  app.put(
    '/api/admin/projects/:id',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      const index = db.projects.findIndex(
        (project) => project.id === req.params.id
      );

      if (index < 0) {
        return res.status(404).json({
          error: 'Project not found.'
        });
      }

      const update = req.body || {};

      const allowed = [
        'title',
        'animeName',
        'episodeNumber',
        'description',
        'releaseDate',
        'category',
        'thumbnailUrl',
        'videoUrl',
        'videoType',
        'isFeatured',
        'isPublished'
      ];

      const safe = Object.fromEntries(
        allowed
          .filter((key) => update[key] !== undefined)
          .map((key) => [key, update[key]])
      );

      db.projects[index] = {
        ...db.projects[index],
        ...safe,
        id: db.projects[index].id
      };

      saveDatabase(db);

      res.json({
        success: true,
        project: db.projects[index]
      });
    }
  );

  /* =========================================
     DELETE PROJECT
  ========================================= */

  app.delete(
    '/api/admin/projects/:id',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      const filtered = db.projects.filter(
        (project) => project.id !== req.params.id
      );

      if (filtered.length === db.projects.length) {
        return res.status(404).json({
          error: 'Project not found.'
        });
      }

      db.projects = filtered.map((project, index) => ({
        ...project,
        displayOrder: index + 1
      }));

      saveDatabase(db);

      res.json({ success: true });
    }
  );

  /* =========================================
     UPDATE SETTINGS
  ========================================= */

  app.put(
    '/api/admin/settings',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      db.settings = {
        ...db.settings,
        ...req.body
      };

      saveDatabase(db);

      res.json({
        success: true,
        settings: db.settings
      });
    }
  );

  /* =========================================
     UPDATE CUSTOMIZATION
  ========================================= */

  app.put(
    '/api/admin/customization',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      db.customization = {
        ...db.customization,
        ...req.body
      };

      saveDatabase(db);

      res.json({
        success: true,
        customization: db.customization
      });
    }
  );

  /* =========================================
     UPDATE SOCIAL LINKS
  ========================================= */

  app.put(
    '/api/admin/social-links',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      if (Array.isArray(req.body?.socialLinks)) {
        db.socialLinks = req.body.socialLinks;
        saveDatabase(db);
      }

      res.json({
        success: true,
        socialLinks: db.socialLinks
      });
    }
  );

  /* =========================================
     UPDATE SUPABASE CONFIG
  ========================================= */

  app.put(
    '/api/admin/supabase-config',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      db.supabaseConfig = req.body;

      saveDatabase(db);

      res.json({
        success: true,
        supabaseConfig: db.supabaseConfig
      });
    }
  );

  /* =========================================
     RESET WEBSITE DEFAULTS
  ========================================= */

  app.post(
    '/api/admin/reset-defaults',
    requireAdminAuth,
    (req, res) => {
      const db = readDatabase();

      const reset: DatabaseSchema = {
        adminUser: db.adminUser,
        members: DEFAULT_MEMBERS,
        applications: DEFAULT_APPLICATIONS,
        projects: DEFAULT_PROJECTS,
        socialLinks: DEFAULT_SOCIAL_LINKS,
        settings: DEFAULT_SETTINGS,
        customization: DEFAULT_CUSTOMIZATION
      };

      saveDatabase(reset);

      res.json({
        success: true,
        message: 'Website and studio data reset to defaults.'
      });
    }
  );

  /* =========================================
     ERROR HANDLER
  ========================================= */

  app.use(
    (
      err: any,
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      if (err instanceof multer.MulterError) {
        const status =
          err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

        return res.status(status).json({
          error:
            status === 413
              ? 'File is too large. Maximum upload size is 100MB.'
              : 'Upload could not be processed.'
        });
      }

      console.error(
        '[BlackBird] Request error:',
        err?.message || err
      );

      return res
        .status(err?.type === 'entity.too.large' ? 413 : 400)
        .json({
          error:
            err?.type === 'entity.too.large'
              ? 'Request payload is too large.'
              : 'Request could not be processed.'
        });
    }
  );

  /* =========================================
     FRONTEND
  ========================================= */

  const production =
    process.env.NODE_ENV === 'production';

  if (!production) {
    const {
      createServer: createViteServer
    } = await import('vite');

    const vite = await createViteServer({
      server: {
        middlewareMode: true
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    const dist = path.resolve(__dirname, 'dist');

    app.use(express.static(dist));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  /* =========================================
     START SERVER
  ========================================= */

  const server = app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `[BlackBird Studio] Running on port ${PORT}`
      );
    }
  );

  const shutdown = async () => {
    server.close();

    await flushWrites();

    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

/* =========================================
   START APPLICATION
========================================= */

createServer().catch((error) => {
  console.error(
    '[BlackBird] Startup failed:',
    error
  );

  process.exit(1);
});
