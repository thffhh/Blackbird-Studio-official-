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

    console.log(
      '[BlackBird] Existing database loaded successfully.'
    );

    return;
  }

  throw new Error(
    '[BlackBird] No existing database found in Neon. Existing data was not overwritten.'
  );
}

/* =========================================
   AUTHENTICATION CONFIGURATION
========================================= */

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const MEMBER_SESSION_TTL_MS =
  30 * 24 * 60 * 60 * 1000;

const MEMBER_COOKIE_NAME = 'bbs_member_session';

const activeSessions = new Map<string, number>();

const rateBuckets = new Map<
  string,
  { count: number; resetAt: number }
>();

/* =========================================
   MEMBER AUTHENTICATION HELPERS
========================================= */

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

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/* =========================================
   RATE LIMITING
========================================= */

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
     MEMBER AUTHENTICATION MIDDLEWARE
  ========================================= */

  async function requireMemberAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = getMemberCookie(req);

      if (!token) {
        return res.status(401).json({
          error: 'Please log in to continue.'
        });
      }

      const tokenHash = hashMemberToken(token);

      const rows = await sql`
        SELECT
          a.id,
          a.full_name,
          a.email,
          a.status,
          a.profile
        FROM blackbird_member_sessions s
        JOIN blackbird_member_accounts a
          ON a.id = s.account_id
        WHERE s.token_hash = ${tokenHash}
          AND s.expires_at > NOW()
        LIMIT 1
      `;

      if (!rows.length) {
        clearMemberCookie(res);

        return res.status(401).json({
          error: 'Your session has expired. Please log in again.'
        });
      }

      if (rows[0].status !== 'approved') {
        await sql`
          DELETE FROM blackbird_member_sessions
          WHERE token_hash = ${tokenHash}
        `;

        clearMemberCookie(res);

        return res.status(403).json({
          error: 'Your member account is not approved.'
        });
      }

      res.locals.memberAccount = rows[0];

      next();
    } catch (error) {
      console.error('[BlackBird] Member auth error:', error);

      return res.status(500).json({
        error: 'Could not verify member session.'
      });
    }
  }

  
  /* =========================================
     MEMBER REGISTRATION
  ========================================= */

  app.post(
    '/api/members/register',
    rateLimit('member-register', 5, 60 * 60 * 1000),
    async (req, res) => {
      try {
        const { fullName, email, password } = req.body || {};

        if (
          typeof fullName !== 'string' ||
          typeof email !== 'string' ||
          typeof password !== 'string'
        ) {
          return res.status(400).json({
            error: 'Name, email and password are required.'
          });
        }

        const name = fullName.trim();
        const normalizedEmail = normalizeMemberEmail(email);

        if (name.length < 2 || name.length > 120) {
          return res.status(400).json({
            error: 'Name must be between 2 and 120 characters.'
          });
        }

        if (!isValidMemberEmail(normalizedEmail)) {
          return res.status(400).json({
            error: 'Please enter a valid email address.'
          });
        }

        if (password.length < 12 || password.length > 128) {
          return res.status(400).json({
            error: 'Password must be between 12 and 128 characters.'
          });
        }

        const existing = await sql`
          SELECT id
          FROM blackbird_member_accounts
          WHERE LOWER(email) = ${normalizedEmail}
          LIMIT 1
        `;

        if (existing.length) {
          return res.status(409).json({
            error: 'An account with this email already exists.'
          });
        }

        const passwordHash = bcrypt.hashSync(password, 12);

        const profile = {
          avatarUrl: '',
          bio: '',
          hobbies: '',
          facebookLink: '',
          rank: 'D'
        };

        const created = await sql`
          INSERT INTO blackbird_member_accounts
            (full_name, email, password_hash, status, profile)
          VALUES
            (
              ${name},
              ${normalizedEmail},
              ${passwordHash},
              'pending',
              ${JSON.stringify(profile)}::jsonb
            )
          RETURNING id, full_name, email, status, created_at
        `;

        return res.status(201).json({
          success: true,
          message: 'Registration submitted. Please wait for admin approval.',
          account: created[0]
        });

      } catch (error: any) {
        if (error?.code === '23505') {
          return res.status(409).json({
            error: 'An account with this email already exists.'
          });
        }

        console.error('[BlackBird] Registration error:', error);

        return res.status(500).json({
          error: 'Registration failed. Please try again.'
        });
      }
    }
  );

  /* =========================================
     MEMBER LOGIN
  ========================================= */

  app.post(
    '/api/members/login',
    rateLimit('member-login', 5, 15 * 60 * 1000),
    async (req, res) => {
      try {
        const { email, password } = req.body || {};

        if (
          typeof email !== 'string' ||
          typeof password !== 'string'
        ) {
          return res.status(400).json({
            error: 'Email and password are required.'
          });
        }

        const normalizedEmail = normalizeMemberEmail(email);

        const rows = await sql`
          SELECT id, full_name, email, password_hash, status, profile
          FROM blackbird_member_accounts
          WHERE LOWER(email) = ${normalizedEmail}
          LIMIT 1
        `;

        if (
          !rows.length ||
          !bcrypt.compareSync(password, rows[0].password_hash)
        ) {
          return res.status(401).json({
            error: 'Invalid email or password.'
          });
        }

        const account = rows[0];

        if (account.status === 'pending') {
          return res.status(403).json({
            error: 'Your account is waiting for admin approval.'
          });
        }

        if (account.status === 'rejected') {
          return res.status(403).json({
            error: 'Your registration was not approved.'
          });
        }

        if (account.status === 'suspended') {
          return res.status(403).json({
            error: 'Your account has been suspended.'
          });
        }

        const token = generateToken();
        const tokenHash = hashMemberToken(token);

        await sql`
          DELETE FROM blackbird_member_sessions
          WHERE expires_at <= NOW()
        `;

        await sql`
          INSERT INTO blackbird_member_sessions
            (token_hash, account_id, expires_at)
          VALUES
            (
              ${tokenHash},
              ${account.id},
              NOW() + INTERVAL '30 days'
            )
        `;

        setMemberCookie(res, token);

        return res.json({
          success: true,
          message: 'Login successful.',
          user: {
            id: account.id,
            fullName: account.full_name,
            email: account.email,
            profile: account.profile
          }
        });

      } catch (error) {
        console.error('[BlackBird] Member login error:', error);

        return res.status(500).json({
          error: 'Login failed. Please try again.'
        });
      }
    }
  );

  /* =========================================
     MEMBER SESSION / PROFILE
  ========================================= */

  app.get(
    '/api/members/me',
    requireMemberAuth,
    (_req, res) => {
      const account = res.locals.memberAccount;

      res.setHeader('Cache-Control', 'no-store');

      return res.json({
        authenticated: true,
        user: {
          id: account.id,
          fullName: account.full_name,
          email: account.email,
          status: account.status,
          profile: account.profile
        }
      });
    }
  );

  /* =========================================
     MEMBER PROFILE UPDATE
     Members cannot change their own rank.
  ========================================= */

  app.patch(
    '/api/members/me',
    requireMemberAuth,
    async (req, res) => {
      try {
        const account = res.locals.memberAccount;
        const update = req.body || {};

        const allowed = [
          'fullName',
          'avatarUrl',
          'bio',
          'hobbies',
          'facebookLink'
        ];

        const profile = {
          ...(account.profile || {})
        };

        let newFullName = account.full_name;

        if (update.fullName !== undefined) {
          if (
            typeof update.fullName !== 'string' ||
            update.fullName.trim().length < 2 ||
            update.fullName.trim().length > 120
          ) {
            return res.status(400).json({
              error: 'Name must be between 2 and 120 characters.'
            });
          }

          newFullName = update.fullName.trim();
        }

        for (const key of allowed) {
          if (key === 'fullName' || update[key] === undefined) {
            continue;
          }

          if (
            typeof update[key] !== 'string' ||
            update[key].length > 5000
          ) {
            return res.status(400).json({
              error: `Invalid profile field: ${key}`
            });
          }

          const value = update[key].trim();

          if (
            key === 'facebookLink' &&
            value &&
            !/^https:\/\/(www\.)?facebook\.com\/[^\s]+$/i.test(value)
          ) {
            return res.status(400).json({
              error: 'Please provide a valid Facebook profile URL.'
            });
          }

          if (
            key === 'avatarUrl' &&
            value &&
            !/^https:\/\/[^\s]+$/i.test(value)
          ) {
            return res.status(400).json({
              error: 'Profile picture URL must use HTTPS.'
            });
          }

          profile[key] = value;
        }

        // Preserve the Admin-controlled rank.
        profile.rank =
          (OFFICIAL_RANKS as readonly string[]).includes(profile.rank)
            ? profile.rank
            : 'D';

        const updated = await sql`
          UPDATE blackbird_member_accounts
          SET
            full_name = ${newFullName},
            profile = ${JSON.stringify(profile)}::jsonb,
            updated_at = NOW()
          WHERE id = ${account.id}
          RETURNING id
        `;

        if (!updated.length) {
          return res.status(404).json({
            error: 'Member account not found.'
          });
        }

        const db = readDatabase();

        const rosterIndex = db.members.findIndex(
          (member) => member.sourceMemberAccountId === account.id
        );

        if (rosterIndex >= 0) {
          db.members[rosterIndex] = {
            ...db.members[rosterIndex],
            name: newFullName,
            avatarUrl: profile.avatarUrl || '',
            bio: profile.bio || '',
            hobbies: profile.hobbies || '',
            facebookLink: profile.facebookLink || ''
          };

          saveDatabase(db);
        }

        return res.json({
          success: true,
          message: 'Profile updated successfully.',
          profile,
          fullName: newFullName
        });

      } catch (error) {
        console.error('[BlackBird] Profile update error:', error);

        return res.status(500).json({
          error: 'Could not update profile.'
        });
      }
    }
  );

  /* =========================================
     MEMBER LOGOUT
  ========================================= */

  app.post(
    '/api/members/logout',
    async (req, res) => {
      try {
        const token = getMemberCookie(req);

        if (token) {
          const tokenHash = hashMemberToken(token);

          await sql`
            DELETE FROM blackbird_member_sessions
            WHERE token_hash = ${tokenHash}
          `;
        }

        clearMemberCookie(res);

        return res.json({
          success: true,
          message: 'Logged out successfully.'
        });

      } catch (error) {
        console.error('[BlackBird] Member logout error:', error);

        clearMemberCookie(res);

        return res.status(500).json({
          error: 'Logout could not be completed.'
        });
      }
    }
  );

  /* =========================================
     MEMBER ROSTER SYNC
  ========================================= */

  function syncMemberAccountToRoster(
    account: any,
    activate: boolean
  ): Member {
    const db = readDatabase();

    const profile = account.profile || {};

    const validRank = (
      OFFICIAL_RANKS as readonly string[]
    ).includes(profile.rank)
      ? profile.rank as Rank
      : 'D';

    const existingIndex = db.members.findIndex(
      (member) =>
        member.sourceMemberAccountId === account.id
    );

    if (existingIndex >= 0) {
      const existing = db.members[existingIndex];

      const updated: Member = {
        ...existing,
        name: account.full_name,
        rank: validRank,
        avatarUrl: profile.avatarUrl || '',
        bio: profile.bio || '',
        hobbies: profile.hobbies || '',
        facebookLink: profile.facebookLink || '',
        isActive: activate
      };

      db.members[existingIndex] = updated;

      saveDatabase(db);

      return updated;
    }

    const member: Member = {
      id: 'bbs-mem-' + crypto.randomUUID(),
      sourceMemberAccountId: account.id,
      name: account.full_name,
      rank: validRank,
      avatarUrl: profile.avatarUrl || '',
      bio: profile.bio || '',
      hobbies: profile.hobbies || '',
      facebookLink: profile.facebookLink || '',
      joiningDate: new Date().toISOString().slice(0, 10),
      isActive: activate,
      displayOrder: getNextDisplayOrder(db.members)
    };

    db.members.push(member);

    saveDatabase(db);

    return member;
  }

  /* =========================================
     ADMIN: MEMBER ACCOUNT LIST
  ========================================= */

  app.get(
    '/api/admin/member-accounts',
    requireAdminAuth,
    async (_req, res) => {
      try {
        const rows = await sql`
          SELECT
            id,
            full_name,
            email,
            status,
            profile,
            rejection_reason,
            created_at,
            updated_at,
            approved_at
          FROM blackbird_member_accounts
          ORDER BY created_at DESC
        `;

        return res.json({
          success: true,
          accounts: rows
        });

      } catch (error) {
        console.error(
          '[BlackBird] Member account list error:',
          error
        );

        return res.status(500).json({
          error: 'Could not load member accounts.'
        });
      }
    }
  );

  /* =========================================
     ADMIN: UPDATE MEMBER ACCOUNT STATUS
  ========================================= */

  app.patch(
    '/api/admin/member-accounts/:id/status',
    requireAdminAuth,
    async (req, res) => {
      try {
        const { status, reason } = req.body || {};

        const allowedStatuses = [
          'approved',
          'rejected',
          'suspended'
        ];

        if (
          typeof status !== 'string' ||
          !allowedStatuses.includes(status)
        ) {
          return res.status(400).json({
            error: 'Invalid account status.'
          });
        }

        if (
          reason !== undefined &&
          (
            typeof reason !== 'string' ||
            reason.length > 1000
          )
        ) {
          return res.status(400).json({
            error: 'Invalid rejection or suspension reason.'
          });
        }

        const accountId = req.params.id;

        const updated = await sql`
          UPDATE blackbird_member_accounts
          SET
            status = ${status},
            rejection_reason = ${
              status === 'rejected' || status === 'suspended'
                ? (reason || '').trim()
                : ''
            },
            approved_at = CASE
              WHEN ${status} = 'approved' THEN NOW()
              ELSE NULL
            END,
            updated_at = NOW()
          WHERE id = ${accountId}::uuid
          RETURNING
            id,
            full_name,
            email,
            status,
            profile,
            rejection_reason,
            created_at,
            updated_at,
            approved_at
        `;

        if (!updated.length) {
          return res.status(404).json({
            error: 'Member account not found.'
          });
        }

        const account = updated[0];

        if (status === 'approved') {
          syncMemberAccountToRoster(account, true);
        } else {
          await sql`
            DELETE FROM blackbird_member_sessions
            WHERE account_id = ${accountId}::uuid
          `;

          syncMemberAccountToRoster(account, false);
        }

        return res.json({
          success: true,
          message:
            status === 'approved'
              ? 'Member account approved and synced to public roster.'
              : status === 'rejected'
                ? 'Member registration rejected.'
                : 'Member account suspended.',
          account
        });

      } catch (error) {
        console.error(
          '[BlackBird] Account status update error:',
          error
        );

        return res.status(500).json({
          error: 'Could not update member account status.'
        });
      }
    }
  );

  /* =========================================
     ADMIN: UPDATE MEMBER ACCOUNT PROFILE
  ========================================= */

  app.patch(
    '/api/admin/member-accounts/:id/profile',
    requireAdminAuth,
    async (req, res) => {
      try {
        const accountId = req.params.id;
        const update = req.body || {};

        const allowed = [
          'fullName',
          'avatarUrl',
          'bio',
          'hobbies',
          'facebookLink'
        ];

        const currentRows = await sql`
          SELECT id, full_name, profile, status
          FROM blackbird_member_accounts
          WHERE id = ${accountId}::uuid
          LIMIT 1
        `;

        if (!currentRows.length) {
          return res.status(404).json({
            error: 'Member account not found.'
          });
        }

        const current = currentRows[0];

        const profile = {
          ...(current.profile || {})
        };

        let fullName = current.full_name;

        if (update.fullName !== undefined) {
          if (
            typeof update.fullName !== 'string' ||
            update.fullName.trim().length < 2 ||
            update.fullName.trim().length > 120
          ) {
            return res.status(400).json({
              error: 'Invalid member name.'
            });
          }

          fullName = update.fullName.trim();
        }

        for (const key of allowed) {
          if (key === 'fullName' || update[key] === undefined) {
            continue;
          }

          if (
            typeof update[key] !== 'string' ||
            update[key].length > 5000
          ) {
            return res.status(400).json({
              error: `Invalid profile field: ${key}`
            });
          }

          const value = update[key].trim();

          if (
            key === 'facebookLink' &&
            value &&
            !/^https:\/\/(www\.)?facebook\.com\/[^\s]+$/i.test(value)
          ) {
            return res.status(400).json({
              error: 'Invalid Facebook profile URL.'
            });
          }

          if (
            key === 'avatarUrl' &&
            value &&
            !/^https:\/\/[^\s]+$/i.test(value)
          ) {
            return res.status(400).json({
              error: 'Profile picture URL must use HTTPS.'
            });
          }

          profile[key] = value;
        }

        const updated = await sql`
          UPDATE blackbird_member_accounts
          SET
            full_name = ${fullName},
            profile = ${JSON.stringify(profile)}::jsonb,
            updated_at = NOW()
          WHERE id = ${accountId}::uuid
          RETURNING
            id,
            full_name,
            email,
            status,
            profile,
            rejection_reason,
            created_at,
            updated_at,
            approved_at
        `;

        const account = updated[0];

        if (account.status === 'approved') {
          syncMemberAccountToRoster(account, true);
        }

        return res.json({
          success: true,
          message: 'Member profile updated successfully.',
          account
        });

      } catch (error) {
        console.error(
          '[BlackBird] Admin profile update error:',
          error
        );

        return res.status(500).json({
          error: 'Could not update member profile.'
        });
      }
    }
  );

  /* =========================================
     ADMIN: UPDATE MEMBER ACCOUNT RANK
  ========================================= */

  app.patch(
    '/api/admin/member-accounts/:id/rank',
    requireAdminAuth,
    async (req, res) => {
      try {
        const { rank } = req.body || {};
        const accountId = req.params.id;

        if (
          typeof rank !== 'string' ||
          !(OFFICIAL_RANKS as readonly string[]).includes(rank)
        ) {
          return res.status(400).json({
            error: 'Rank must be one of the official ranks.'
          });
        }

        const currentRows = await sql`
          SELECT id, profile, status
          FROM blackbird_member_accounts
          WHERE id = ${accountId}::uuid
          LIMIT 1
        `;

        if (!currentRows.length) {
          return res.status(404).json({
            error: 'Member account not found.'
          });
        }

        const profile = {
          ...(currentRows[0].profile || {}),
          rank
        };

        const updated = await sql`
          UPDATE blackbird_member_accounts
          SET
            profile = ${JSON.stringify(profile)}::jsonb,
            updated_at = NOW()
          WHERE id = ${accountId}::uuid
          RETURNING
            id,
            full_name,
            email,
            status,
            profile,
            rejection_reason,
            created_at,
            updated_at,
            approved_at
        `;

        const account = updated[0];

        if (account.status === 'approved') {
          syncMemberAccountToRoster(account, true);
        }

        return res.json({
          success: true,
          message: `Member rank updated to ${rank}.`,
          account
        });

      } catch (error) {
        console.error(
          '[BlackBird] Rank update error:',
          error
        );

        return res.status(500).json({
          error: 'Could not update member rank.'
        });
      }
    }
  );

  /* =========================================
     ADMIN: DELETE MEMBER ACCOUNT
  ========================================= */

  app.delete(
    '/api/admin/member-accounts/:id',
    requireAdminAuth,
    async (req, res) => {
      try {
        const accountId = req.params.id;

        const deleted = await sql`
          DELETE FROM blackbird_member_accounts
          WHERE id = ${accountId}::uuid
          RETURNING id, full_name, email
        `;

        if (!deleted.length) {
          return res.status(404).json({
            error: 'Member account not found.'
          });
        }

        // Session rows are deleted automatically through ON DELETE CASCADE.
        // The public roster record is intentionally preserved.
        return res.json({
          success: true,
          message: 'Member account deleted.',
          account: deleted[0]
        });

      } catch (error) {
        console.error(
          '[BlackBird] Account deletion error:',
          error
        );

        return res.status(500).json({
          error: 'Could not delete member account.'
        });
      }
    }
  );



  // ============================================
  // PART 3/3 — EXISTING API + ADMIN + SERVER
  // ============================================

  // Public website data
  app.get('/api/public-data', (_req: Request, res: Response) => {
    try {
      const db = readDatabase();

      const members = sortMembersByOrder(
        db.members.filter((member) => member.isActive)
      ).map((member) => {
        const {
          sourceApplicationId: _sourceApplicationId,
          sourceMemberAccountId: _sourceMemberAccountId,
          ...publicMember
        } = member;

        return publicMember;
      });

      res.json({
        members,
        projects: [...db.projects]
          .filter((project) => project.isPublished)
          .sort((a, b) => a.displayOrder - b.displayOrder),
        socialLinks: [...db.socialLinks]
          .filter((link) => link.isVisible)
          .sort((a, b) => a.displayOrder - b.displayOrder),
        settings: db.settings,
        customization: db.customization,
      });
    } catch (error) {
      console.error('Public data error:', error);
      res.status(500).json({ error: 'Failed to load public data.' });
    }
  });

  // Application tracking
  app.get('/api/applications/track/:id', (req: Request, res: Response) => {
    const db = readDatabase();
    const application = db.applications.find(
      (item) => item.id === req.params.id
    );

    if (!application) {
      return res.status(404).json({
        error: 'Application not found.',
      });
    }

    const messages: Record<string, string> = {
      pending: 'Your application is currently under review.',
      approved: 'Congratulations! Your application has been approved.',
      rejected: 'Your application was not approved.',
    };

    res.json({
      id: application.id,
      status: application.status,
      message: messages[application.status] || 'Application status updated.',
    });
  });

  // Submit application
  app.post('/api/applications', async (req: Request, res: Response) => {
    try {
      const validation = validateApplication(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error || 'Invalid application data.',
        });
      }

      const db = readDatabase();
      const data = req.body;

      const application: Application = {
        ...data,
        id: generateApplicationId(),
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      db.applications.push(application);
      await saveDatabase(db);

      res.status(201).json({
        success: true,
        applicationId: application.id,
        message: 'Application submitted successfully.',
      });
    } catch (error) {
      console.error('Application submission error:', error);
      res.status(500).json({
        error: 'Failed to submit application.',
      });
    }
  });

  // Supabase media upload
  app.post(
    '/api/upload',
    uploadRateLimit,
    upload.single('file'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            error: 'No file was provided.',
          });
        }

        const file = req.file;

        if (file.size > 100 * 1024 * 1024) {
          return res.status(413).json({
            error: 'File size exceeds the 100MB limit.',
          });
        }

        const detectedMime = validateMediaSignature(
          file.buffer,
          file.mimetype
        );

        if (!detectedMime) {
          return res.status(400).json({
            error: 'Unsupported or invalid media file.',
          });
        }

        if (!supabase) {
          return res.status(503).json({
            error: 'Media storage is not configured.',
          });
        }

        const safeName = file.originalname
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .slice(-100);

        const filePath = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

        const { error } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(filePath, file.buffer, {
            contentType: detectedMime,
            upsert: false,
          });

        if (error) {
          console.error('Supabase upload error:', error);
          return res.status(500).json({
            error: 'Failed to upload file.',
          });
        }

        const { data } = supabase.storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl(filePath);

        res.status(201).json({
          success: true,
          url: data.publicUrl,
          path: filePath,
          mimeType: detectedMime,
        });
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
          error: 'Upload failed.',
        });
      }
    }
  );

  // Admin login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body || {};

      if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !username.trim() ||
        !password
      ) {
        return res.status(400).json({
          error: 'Username and password are required.',
        });
      }

      const db = readDatabase();

      if (username.trim() !== db.adminUser.username) {
        return res.status(401).json({
          error: 'Invalid username or password.',
        });
      }

      const passwordMatches = await bcrypt.compare(
        password,
        db.adminUser.passwordHash
      );

      if (!passwordMatches) {
        return res.status(401).json({
          error: 'Invalid username or password.',
        });
      }

      const token = crypto.randomBytes(48).toString('hex');

      activeSessions.set(token, {
        username: db.adminUser.username,
        expiresAt: Date.now() + SESSION_TTL,
      });

      res.json({
        success: true,
        token,
        expiresIn: SESSION_TTL,
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        error: 'Login failed.',
      });
    }
  });

  // Admin logout
  app.post('/api/auth/logout', requireAdminAuth, (req: Request, res: Response) => {
    const token = getBearerToken(req);

    if (token) {
      activeSessions.delete(token);
    }

    res.json({ success: true });
  });

  // Admin session validation
  app.get('/api/auth/session', requireAdminAuth, (req: Request, res: Response) => {
    const token = getBearerToken(req);
    const session = token ? activeSessions.get(token) : undefined;

    res.json({
      authenticated: true,
      username: session?.username || '',
    });
  });

  // Change admin password
  app.post(
    '/api/auth/change-password',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { currentPassword, newPassword } = req.body || {};
        const db = readDatabase();

        if (
          typeof currentPassword !== 'string' ||
          typeof newPassword !== 'string'
        ) {
          return res.status(400).json({
            error: 'Current and new passwords are required.',
          });
        }

        if (newPassword.length < 12) {
          return res.status(400).json({
            error: 'New password must contain at least 12 characters.',
          });
        }

        const valid = await bcrypt.compare(
          currentPassword,
          db.adminUser.passwordHash
        );

        if (!valid) {
          return res.status(401).json({
            error: 'Current password is incorrect.',
          });
        }

        db.adminUser.passwordHash = await bcrypt.hash(newPassword, 12);
        await saveDatabase(db);

        // Invalidate existing admin sessions
        activeSessions.clear();

        res.json({
          success: true,
          message: 'Password changed. Please log in again.',
        });
      } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
          error: 'Failed to change password.',
        });
      }
    }
  );

  // All admin data
  app.get('/api/admin/all-data', requireAdminAuth, (_req: Request, res: Response) => {
    const db = readDatabase();

    res.json({
      members: sortMembersByOrder(db.members),
      applications: db.applications,
      projects: db.projects,
      socialLinks: db.socialLinks,
      settings: db.settings,
      customization: db.customization,
      supabaseConfig: db.supabaseConfig,
      stats: {
        totalMembers: db.members.length,
        activeMembers: db.members.filter((member) => member.isActive).length,
        totalApplications: db.applications.length,
        pendingApplications: db.applications.filter(
          (application) => application.status === 'pending'
        ).length,
        totalProjects: db.projects.length,
        publishedProjects: db.projects.filter(
          (project) => project.isPublished
        ).length,
      },
    });
  });

  // Create roster member
  app.post(
    '/api/admin/members',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        const {
          name,
          rank,
          avatarUrl,
          hobbies,
          bio,
          joiningDate,
          isActive,
        } = req.body || {};

        if (
          typeof name !== 'string' ||
          !name.trim() ||
          !OFFICIAL_RANKS.includes(rank)
        ) {
          return res.status(400).json({
            error: 'A valid member name and rank are required.',
          });
        }

        const member: Member = {
          id: crypto.randomUUID(),
          name: name.trim().slice(0, 120),
          rank,
          avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : '',
          hobbies: typeof hobbies === 'string' ? hobbies : '',
          bio: typeof bio === 'string' ? bio : '',
          joiningDate:
            typeof joiningDate === 'string'
              ? joiningDate
              : new Date().toISOString().slice(0, 10),
          isActive: typeof isActive === 'boolean' ? isActive : true,
          displayOrder: getNextDisplayOrder(db.members),
        };

        db.members.push(member);
        await saveDatabase(db);

        res.status(201).json({
          success: true,
          member,
        });
      } catch (error) {
        console.error('Create member error:', error);
        res.status(500).json({
          error: 'Failed to create member.',
        });
      }
    }
  );

  // Reorder roster members
  app.put(
    '/api/admin/members/reorder',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { memberIds } = req.body || {};

        if (
          !Array.isArray(memberIds) ||
          !memberIds.every((id) => typeof id === 'string')
        ) {
          return res.status(400).json({
            error: 'A valid memberIds array is required.',
          });
        }

        const db = readDatabase();
        db.members = reindexMembers(db.members, memberIds);

        await saveDatabase(db);

        res.json({
          success: true,
          members: sortMembersByOrder(db.members),
        });
      } catch (error) {
        console.error('Member reorder error:', error);
        res.status(500).json({
          error: 'Failed to reorder members.',
        });
      }
    }
  );

  // Update roster member
  app.put(
    '/api/admin/members/:id',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        const member = db.members.find(
          (item) => item.id === req.params.id
        );

        if (!member) {
          return res.status(404).json({
            error: 'Member not found.',
          });
        }

        const updates = req.body || {};

        if (updates.name !== undefined) {
          if (typeof updates.name !== 'string' || !updates.name.trim()) {
            return res.status(400).json({
              error: 'Member name cannot be empty.',
            });
          }
          member.name = updates.name.trim().slice(0, 120);
        }

        if (updates.rank !== undefined) {
          if (!OFFICIAL_RANKS.includes(updates.rank)) {
            return res.status(400).json({
              error: 'Invalid member rank.',
            });
          }
          member.rank = updates.rank;
        }

        if (updates.avatarUrl !== undefined) {
          member.avatarUrl = String(updates.avatarUrl).slice(0, 2000);
        }

        if (updates.hobbies !== undefined) {
          member.hobbies = String(updates.hobbies).slice(0, 2000);
        }

        if (updates.bio !== undefined) {
          member.bio = String(updates.bio).slice(0, 5000);
        }

        if (updates.facebookLink !== undefined) {
          member.facebookLink = String(updates.facebookLink).slice(0, 2000);
        }

        if (updates.joiningDate !== undefined) {
          member.joiningDate = String(updates.joiningDate).slice(0, 40);
        }

        if (updates.isActive !== undefined) {
          member.isActive = Boolean(updates.isActive);
        }

        await saveDatabase(db);

        res.json({
          success: true,
          member,
        });
      } catch (error) {
        console.error('Update member error:', error);
        res.status(500).json({
          error: 'Failed to update member.',
        });
      }
    }
  );

  // Delete roster member
  app.delete(
    '/api/admin/members/:id',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        const index = db.members.findIndex(
          (member) => member.id === req.params.id
        );

        if (index === -1) {
          return res.status(404).json({
            error: 'Member not found.',
          });
        }

        db.members.splice(index, 1);
        await saveDatabase(db);

        res.json({ success: true });
      } catch (error) {
        console.error('Delete member error:', error);
        res.status(500).json({
          error: 'Failed to delete member.',
        });
      }
    }
  );

  // Update application
  app.put(
    '/api/admin/applications/:id',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        const application = db.applications.find(
          (item) => item.id === req.params.id
        );

        if (!application) {
          return res.status(404).json({
            error: 'Application not found.',
          });
        }

        Object.assign(application, req.body || {});
        await saveDatabase(db);

        res.json({
          success: true,
          application,
        });
      } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({
          error: 'Failed to update application.',
        });
      }
    }
  );

  // Approve application
  app.post(
    '/api/admin/applications/:id/approve',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        const application = db.applications.find(
          (item) => item.id === req.params.id
        );

        if (!application) {
          return res.status(404).json({
            error: 'Application not found.',
          });
        }

        if (application.status === 'approved') {
          return res.json({
            success: true,
            message: 'Application is already approved.',
          });
        }

        application.status = 'approved';

        const existingMember = db.members.find(
          (member) => member.sourceApplicationId === application.id
        );

        if (existingMember) {
          existingMember.isActive = true;
        } else {
          const member: Member = {
            id: crypto.randomUUID(),
            name: application.name,
            rank: 'D',
            avatarUrl: application.avatarUrl || '',
            hobbies: application.hobbies || '',
            bio: application.bio || '',
            joiningDate: new Date().toISOString().slice(0, 10),
            isActive: true,
            displayOrder: getNextDisplayOrder(db.members),
            sourceApplicationId: application.id,
          };

          db.members.push(member);
        }

        await saveDatabase(db);

        res.json({
          success: true,
          message: 'Application approved.',
        });
      } catch (error) {
        console.error('Approve application error:', error);
        res.status(500).json({
          error: 'Failed to approve application.',
        });
      }
    }
  );

  // Reject application
  app.post(
    '/api/admin/applications/:id/reject',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        const application = db.applications.find(
          (item) => item.id === req.params.id
        );

        if (!application) {
          return res.status(404).json({
            error: 'Application not found.',
          });
        }

        application.status = 'rejected';
        await saveDatabase(db);

        res.json({
          success: true,
          message: 'Application rejected.',
        });
      } catch (error) {
        console.error('Reject application error:', error);
        res.status(500).json({
          error: 'Failed to reject application.',
        });
      }
    }
  );

  // Create project
  app.post(
    '/api/admin/projects',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        const project = {
          ...req.body,
          id: crypto.randomUUID(),
          displayOrder: getNextDisplayOrder(db.projects),
        } as Project;

        if (
          typeof project.title !== 'string' ||
          !project.title.trim()
        ) {
          return res.status(400).json({
            error: 'Project title is required.',
          });
        }

        db.projects.push(project);
        await saveDatabase(db);

        res.status(201).json({
          success: true,
          project,
        });
      } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
          error: 'Failed to create project.',
        });
      }
    }
  );

  // Reorder projects
  app.put(
    '/api/admin/projects/reorder',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { projectIds } = req.body || {};

        if (
          !Array.isArray(projectIds) ||
          !projectIds.every((id) => typeof id === 'string')
        ) {
          return res.status(400).json({
            error: 'A valid projectIds array is required.',
          });
        }

        const db = readDatabase();
        db.projects = reindexMembers(db.projects as any, projectIds) as any;

        await saveDatabase(db);

        res.json({
          success: true,
          projects: db.projects,
        });
      } catch (error) {
        console.error('Project reorder error:', error);
        res.status(500).json({
          error: 'Failed to reorder projects.',
        });
      }
    }
  );

  // Update project
  app.put(
    '/api/admin/projects/:id',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        const project = db.projects.find(
          (item) => item.id === req.params.id
        );

        if (!project) {
          return res.status(404).json({
            error: 'Project not found.',
          });
        }

        Object.assign(project, req.body || {});
        await saveDatabase(db);

        res.json({
          success: true,
          project,
        });
      } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
          error: 'Failed to update project.',
        });
      }
    }
  );

  // Delete project
  app.delete(
    '/api/admin/projects/:id',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        const index = db.projects.findIndex(
          (project) => project.id === req.params.id
        );

        if (index === -1) {
          return res.status(404).json({
            error: 'Project not found.',
          });
        }

        db.projects.splice(index, 1);
        await saveDatabase(db);

        res.json({ success: true });
      } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
          error: 'Failed to delete project.',
        });
      }
    }
  );

  // Update studio settings
  app.put(
    '/api/admin/settings',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        db.settings = {
          ...db.settings,
          ...(req.body || {}),
        };

        await saveDatabase(db);

        res.json({
          success: true,
          settings: db.settings,
        });
      } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({
          error: 'Failed to update settings.',
        });
      }
    }
  );

  // Update website customization
  app.put(
    '/api/admin/customization',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        db.customization = {
          ...db.customization,
          ...(req.body || {}),
        };

        await saveDatabase(db);

        res.json({
          success: true,
          customization: db.customization,
        });
      } catch (error) {
        console.error('Customization update error:', error);
        res.status(500).json({
          error: 'Failed to update customization.',
        });
      }
    }
  );

  // Update social links
  app.put(
    '/api/admin/social-links',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();
        const { socialLinks } = req.body || {};

        if (!Array.isArray(socialLinks)) {
          return res.status(400).json({
            error: 'socialLinks must be an array.',
          });
        }

        db.socialLinks = socialLinks;
        await saveDatabase(db);

        res.json({
          success: true,
          socialLinks: db.socialLinks,
        });
      } catch (error) {
        console.error('Social links update error:', error);
        res.status(500).json({
          error: 'Failed to update social links.',
        });
      }
    }
  );

  // Update Supabase configuration
  app.put(
    '/api/admin/supabase-config',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = readDatabase();

        db.supabaseConfig = {
          ...db.supabaseConfig,
          ...(req.body || {}),
        };

        await saveDatabase(db);

        res.json({
          success: true,
          supabaseConfig: db.supabaseConfig,
        });
      } catch (error) {
        console.error('Supabase config update error:', error);
        res.status(500).json({
          error: 'Failed to update Supabase configuration.',
        });
      }
    }
  );

  // Reset website defaults
  // This is an existing admin-only action. It should only run when
  // an administrator explicitly requests it from the website.
  app.post(
    '/api/admin/reset-defaults',
    requireAdminAuth,
    async (_req: Request, res: Response) => {
      try {
        const db = readDatabase();

        db.members = [...DEFAULT_MEMBERS];
        db.applications = [...DEFAULT_APPLICATIONS];
        db.projects = [...DEFAULT_PROJECTS];
        db.socialLinks = [...DEFAULT_SOCIAL_LINKS];
        db.settings = { ...DEFAULT_SETTINGS };
        db.customization = { ...DEFAULT_CUSTOMIZATION };

        await saveDatabase(db);

        res.json({
          success: true,
          message: 'Website defaults restored.',
        });
      } catch (error) {
        console.error('Reset defaults error:', error);
        res.status(500).json({
          error: 'Failed to reset website defaults.',
        });
      }
    }
  );

  // Error handler
  app.use(
    (
      error: any,
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      console.error('Request error:', error);

      if (error instanceof multer.MulterError) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

        return res.status(status).json({
          error:
            error.code === 'LIMIT_FILE_SIZE'
              ? 'File size exceeds the allowed limit.'
              : error.message,
        });
      }

      if (error?.type === 'entity.too.large') {
        return res.status(413).json({
          error: 'Request body is too large.',
        });
      }

      res.status(500).json({
        error: 'Internal server error.',
      });
    }
  );

  // Frontend serving
  const production = process.env.NODE_ENV === 'production';

  if (!production) {
    const { createServer: createViteServer } = await import('vite');

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');

    app.use(express.static(distPath));

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 4000;

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`BlackBird Studio API running on port ${PORT}`);
  });

  const shutdown = async () => {
    console.log('Shutting down BlackBird Studio server...');

    server.close(async () => {
      try {
        await flushWrites();
      } catch (error) {
        console.error('Final database flush failed:', error);
      }

      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start server
createServer().catch((error) => {
  console.error('Failed to start BlackBird Studio server:', error);
  process.exit(1);
});

