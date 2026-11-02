import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { 
  Member, 
  Application, 
  Project, 
  SocialLink, 
  StudioSettings, 
  WebsiteCustomization,
  AdminUser,
  OFFICIAL_RANKS,
  Rank
} from './src/types/index.ts';
import { validateApplication, generateApplicationId } from './src/utils/applicationValidation.ts';
import { getNextDisplayOrder, sortMembersByOrder, reindexMembers } from './src/utils/memberOrder.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Render persistent disk paths can be supplied through environment variables.
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, 'uploads'));
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Database schema
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

// Initial seed data
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@blackbirdstudio.com').trim().toLowerCase();
const configuredAdminPassword = process.env.ADMIN_PASSWORD || '';
let generatedInitialPassword = '';
let legacyPasswordMigrationChecked = false;
function createInitialAdminPassword(): string {
  if (configuredAdminPassword.length >= 12) return configuredAdminPassword;
  generatedInitialPassword = crypto.randomBytes(18).toString('base64url');
  return generatedInitialPassword;
}

const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'bbs-mem-1',
    name: 'Tanim Iqbal Sifat (BlackBird)',
    rank: 'Owner',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    hobbies: 'Voice Modulation, Audio Mixing, Anime Translation, Direction',
    bio: 'Founder and Executive Voice Director of BlackBird Studio. Spearheading the Bangla anime dubbing renaissance with cinematic audio fidelity and authentic character voice acting.',
    joiningDate: '2022-08-15',
    isActive: true,
    displayOrder: 1
  },
  {
    id: 'bbs-mem-2',
    name: 'Kazi Rafiul Islam',
    rank: 'Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    hobbies: 'Sound Engineering, Dialogue Mastering, Lead Voice Acting',
    bio: 'Head of Sound Engineering and Audio Post-Production. Oversees studio workflow, dialogue cleanup, and high-impact vocal mastering for all major anime releases.',
    joiningDate: '2022-11-01',
    isActive: true,
    displayOrder: 2
  },
  {
    id: 'bbs-mem-3',
    name: 'Sadia Chowdhury',
    rank: 'Moderator',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    hobbies: 'Script Localization, Voice Acting, Team Coordination',
    bio: 'Lead Script Adapter and Cast Moderator. Ensures Japanese cultural nuances and emotional weight are captured authentically in colloquial Bangla storytelling.',
    joiningDate: '2023-02-10',
    isActive: true,
    displayOrder: 3
  },
  {
    id: 'bbs-mem-4',
    name: 'Shahriar Nafis',
    rank: 'Immortal',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    hobbies: 'Baritone Voice Delivery, Villain Voices, Narration',
    bio: 'Veteran voice artist legendary for deep-register antagonist voices, commanding narrations, and high-intensity battle cries.',
    joiningDate: '2023-01-20',
    isActive: true,
    displayOrder: 4
  },
  {
    id: 'bbs-mem-5',
    name: 'Fahim Muntakim',
    rank: 'S',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
    hobbies: 'Shonen Protagonist Acting, Dynamic Pitch Control, Singing',
    bio: 'Elite S-Rank voice actor known for heartfelt emotion, youthful shonen energy, and iconic protagonist roles in Jujutsu Kaisen and Demon Slayer dubs.',
    joiningDate: '2023-05-12',
    isActive: true,
    displayOrder: 5
  },
  {
    id: 'bbs-mem-6',
    name: 'Tasnim Jahan',
    rank: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
    hobbies: 'Female Lead Voice Acting, Audio Editing, Cosplay',
    bio: 'Senior Voice Artist specializing in emotional female leads, Tsundere characters, and crisp voice performance.',
    joiningDate: '2023-08-04',
    isActive: true,
    displayOrder: 6
  },
  {
    id: 'bbs-mem-7',
    name: 'Mahir Faisal',
    rank: 'B',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
    hobbies: 'Voice Modulation, Comedy Voices, Foley SFX',
    bio: 'Established voice actor bringing energetic side characters, comedic relief, and atmospheric crowd vocals to life.',
    joiningDate: '2023-10-18',
    isActive: true,
    displayOrder: 7
  },
  {
    id: 'bbs-mem-8',
    name: 'Nabil Rahman',
    rank: 'C',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    hobbies: 'Dialogue Delivery, Acting, Podcast Host',
    bio: 'Junior voice talent making steady strides in episodic side roles and studio project collabs.',
    joiningDate: '2024-02-14',
    isActive: true,
    displayOrder: 8
  },
  {
    id: 'bbs-mem-9',
    name: 'Arif Hossain',
    rank: 'D',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80',
    hobbies: 'Voice Training, Anime Dubbing Student',
    bio: 'Dubbing apprentice undergoing studio voice training and vocal range exercises.',
    joiningDate: '2024-06-01',
    isActive: true,
    displayOrder: 9
  }
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'bbs-proj-1',
    title: 'Jujutsu Kaisen Season 2 - Shibuya Incident (Ep 01 Bangla Dub)',
    animeName: 'Jujutsu Kaisen',
    episodeNumber: 'Episode 01',
    description: 'The prelude to the catastrophic Shibuya Incident. Featuring full Bangla localized dialogues, customized Japanese sound mix retainment, and Gojo Satoru iconic lines.',
    releaseDate: '2024-03-15',
    category: 'Supernatural / Action',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoType: 'upload',
    isFeatured: true,
    isPublished: true,
    displayOrder: 1
  },
  {
    id: 'bbs-proj-2',
    title: 'Attack on Titan: The Final Chapters (Special Showcase Bangla Dub)',
    animeName: 'Shingeki no Kyojin',
    episodeNumber: 'Final Special',
    description: 'The monumental final struggle. Intense voice deliveries for Eren Yeager, Armin Arlert, and Mikasa Ackerman translated with emotional gravity into Bangla.',
    releaseDate: '2024-01-20',
    category: 'Dark Fantasy / Drama',
    thumbnailUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    videoType: 'upload',
    isFeatured: true,
    isPublished: true,
    displayOrder: 2
  },
  {
    id: 'bbs-proj-3',
    title: 'Demon Slayer: Swordsmith Village Arc - Muichiro Tokito Awakening',
    animeName: 'Kimetsu no Yaiba',
    episodeNumber: 'Episode 08',
    description: 'Muichiro recalls his past and releases the Mist Breathing Seventh Form. Full cast Bangla voice acting with crisp battle breath effects.',
    releaseDate: '2023-11-10',
    category: 'Action / Fantasy',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoType: 'upload',
    isFeatured: false,
    isPublished: true,
    displayOrder: 3
  },
  {
    id: 'bbs-proj-4',
    title: 'Your Name (Kimi no Na wa) - Iconic Twilight Meeting Bangla Dub Scene',
    animeName: 'Kimi no Na wa',
    episodeNumber: 'Climax Scene',
    description: 'Taki and Mitsuha cross paths on the crater rim at Kataware-doki. A soul-stirring romance voice dub praised by Bangladeshi anime fans.',
    releaseDate: '2023-07-05',
    category: 'Romance / Sci-Fi',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    videoType: 'upload',
    isFeatured: true,
    isPublished: true,
    displayOrder: 4
  }
];

const DEFAULT_APPLICATIONS: Application[] = [
  {
    id: 'BBS-2026-1042',
    fullName: 'Zubair Al Mahmud',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80',
    desiredRank: 'C',
    hobbies: 'Character Mimicry, Anime Dubbing, Theater Acting',
    bio: 'Passionate about giving voice to relatable side characters and comedic anime sidekicks.',
    motivation: 'I have been following BlackBird Studio since 2022. Your passion for quality Bangla voice acting inspired me to start vocal training. I want to contribute to the official dubbing projects.',
    dubbingExperience: '2 years of community fandub on YouTube and university drama club voice performances.',
    contactInfo: 'facebook.com/zubair.dubber.bd',
    additionalInfo: 'Available 15 hours a week for recording sessions.',
    isConfirmed: true,
    status: 'pending',
    submittedAt: '2026-10-28T14:32:00.000Z',
    adminNotes: 'Strong vocal potential for comedic support roles. Reviewing microphone setup.'
  },
  {
    id: 'BBS-2026-9811',
    fullName: 'Anika Tabassum',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
    desiredRank: 'B',
    hobbies: 'Vocal range training, Singing, Audio engineering',
    bio: 'Vocal artist with experience voicing energetic anime heroines and emotional monologues.',
    motivation: 'BlackBird Studio has set the gold standard for Bangla dubbing in Bangladesh. I want to lend my voice to lead female roles and bring more authentic anime experiences to our audience.',
    dubbingExperience: 'Voiced in 4 indie web animations and university short films.',
    contactInfo: 'anika.voiceart@gmail.com',
    additionalInfo: 'Has a treated home studio with Rode NT1-A microphone.',
    isConfirmed: true,
    status: 'pending',
    submittedAt: '2026-10-30T09:15:00.000Z',
    adminNotes: 'Impressive vocal clarity. Great candidate for upcoming Romance dub.'
  }
];

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'bbs-soc-1',
    platform: 'facebook_page',
    title: 'Facebook Official Page',
    url: 'https://facebook.com/blackbirdstudio.bd',
    isVisible: true,
    displayOrder: 1
  },
  {
    id: 'bbs-soc-2',
    platform: 'facebook_group',
    title: 'Facebook Fan & Voice Community',
    url: 'https://facebook.com/groups/blackbirdstudio.community',
    isVisible: true,
    displayOrder: 2
  },
  {
    id: 'bbs-soc-3',
    platform: 'youtube',
    title: 'YouTube Official Channel',
    url: 'https://youtube.com/@blackbirdstudiobd',
    isVisible: true,
    displayOrder: 3
  },
  {
    id: 'bbs-soc-4',
    platform: 'discord',
    title: 'Discord Voice HQ',
    url: 'https://discord.gg/blackbirdstudio',
    isVisible: true,
    displayOrder: 4
  },
  {
    id: 'bbs-soc-5',
    platform: 'tiktok',
    title: 'TikTok Dub Clips',
    url: 'https://tiktok.com/@blackbirdstudio',
    isVisible: true,
    displayOrder: 5
  }
];

const DEFAULT_SETTINGS: StudioSettings = {
  studioName: 'BlackBird Studio',
  tagline: 'The Premier Bangla Anime Dubbing House',
  logoUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80',
  groupPictureUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
  contactEmail: 'contact@blackbirdstudio.com',
  announcementText: 'Auditions for Spring 2026 Season are now officially open! Submit your application in the Join Us section.',
  isAnnouncementVisible: true,
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
  heroDescription: 'A creative community of passionate voice artists and dubbing enthusiasts bringing the world of anime alive in Bangla.',
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

function readDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as DatabaseSchema;
      // Migrate installations that still contain the publicly-known demo password once.
      if (!legacyPasswordMigrationChecked) {
        legacyPasswordMigrationChecked = true;
        if (bcrypt.compareSync('blackbirdadmin2026', db.adminUser.passwordHash)) {
          const replacementPassword = createInitialAdminPassword();
          db.adminUser.passwordHash = bcrypt.hashSync(replacementPassword, 12);
          saveDatabase(db);
        }
      }
      return db;
    }
  } catch (err) {
    console.error('Failed to read database, falling back to defaults:', err);
  }

  const initialDb: DatabaseSchema = {
    adminUser: {
      email: ADMIN_EMAIL,
      passwordHash: bcrypt.hashSync(createInitialAdminPassword(), 12),
      role: 'super_admin'
    },
    members: DEFAULT_MEMBERS,
    applications: DEFAULT_APPLICATIONS,
    projects: DEFAULT_PROJECTS,
    socialLinks: DEFAULT_SOCIAL_LINKS,
    settings: DEFAULT_SETTINGS,
    customization: DEFAULT_CUSTOMIZATION
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  const tempFile = `${DB_FILE}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), { encoding: 'utf-8', mode: 0o600 });
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch { /* best effort cleanup */ }
    console.error('Failed to save database:', err);
    throw new Error('Database write failed');
  }
}

// Short-lived, cryptographically random admin sessions.
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const activeSessions = new Map<string, number>();
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function rateLimit(keyPrefix: string, limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    res.setHeader('RateLimit-Limit', String(limit));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
    if (bucket.count > limit) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
  };
}

function hasValidMediaSignature(filePath: string, extension: string): boolean {
  const fd = fs.openSync(filePath, 'r');
  const header = Buffer.alloc(16);
  try { fs.readSync(fd, header, 0, header.length, 0); } finally { fs.closeSync(fd); }
  if (['.jpg', '.jpeg'].includes(extension)) return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (extension === '.png') return header.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (extension === '.gif') return header.subarray(0, 6).toString('ascii').startsWith('GIF8');
  if (extension === '.webp') return header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
  if (['.mp4', '.mov', '.m4v'].includes(extension)) return header.subarray(4, 8).toString('ascii') === 'ftyp';
  if (['.webm', '.mkv'].includes(extension)) return header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}

// Multer storage for uploaded avatars, logos, backgrounds and videos
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${cleanBase}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for media
  },
  fileFilter: (_req, file, cb) => {
    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const allowedVideoExts = ['.mp4', '.webm', '.mov', '.m4v', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/x-m4v'];
    if ([...allowedImageExts, ...allowedVideoExts].includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload an image or video file.'));
    }
  }
});

export async function createServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Static files for uploads
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Initialize DB. Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars) before first production start.
  const initialDatabase = readDatabase();
  if (generatedInitialPassword) {
    console.warn(`[SECURITY] Initial admin email: ${initialDatabase.adminUser.email}`);
    console.warn(`[SECURITY] One-time initial admin password: ${generatedInitialPassword}`);
    console.warn('[SECURITY] Save this password now, then change it in Admin Account Settings.');
  }

  // Authentication Middleware for /api/admin/*
  function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
    }
    const token = authHeader.split(' ')[1];
    const expiresAt = activeSessions.get(token);
    if (!expiresAt || expiresAt <= Date.now()) {
      activeSessions.delete(token);
      return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    }
    next();
  }

  // -------------------------------------------------------------
  // Public APIs
  // -------------------------------------------------------------

  // Get all public studio data (members only active, projects only published)
  app.get('/api/public-data', (_req: Request, res: Response) => {
    const db = readDatabase();
    // Only approved and active members appear publicly, sorted strictly by displayOrder
    const publicMembers = sortMembersByOrder(db.members.filter((m) => m.isActive)).map(({ sourceApplicationId: _sourceApplicationId, ...member }) => member);
    // Only published projects appear publicly, sorted by displayOrder
    const publicProjects = [...db.projects]
      .filter((p) => p.isPublished)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    // Visible social links
    const visibleSocialLinks = [...db.socialLinks]
      .filter((s) => s.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    res.json({
      members: publicMembers,
      projects: publicProjects,
      socialLinks: visibleSocialLinks,
      settings: db.settings,
      customization: db.customization
    });
  });

  // Track an application by ID
  app.get('/api/applications/track/:id', rateLimit('track', 20, 15 * 60 * 1000), (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const id = req.params.id.trim();
    const db = readDatabase();
    const appRecord = db.applications.find((a) => a.id.toLowerCase() === id.toLowerCase());

    if (!appRecord) {
      return res.status(404).json({ error: 'No application found with this ID.' });
    }

    res.json({
      id: appRecord.id,
      fullName: appRecord.fullName,
      desiredRank: appRecord.desiredRank,
      status: appRecord.status,
      submittedAt: appRecord.submittedAt,
      // Public friendly status message
      statusMessage: 
        appRecord.status === 'approved' 
          ? 'Congratulations! Your application has been approved. You are now an official voice member of BlackBird Studio!' 
          : appRecord.status === 'rejected'
          ? 'Thank you for your interest. At this time, we are unable to accept your application. You are welcome to re-apply in the next season.'
          : 'Your application is currently under review by BlackBird Studio administration. We appreciate your patience!'
    });
  });

  // Submit Join Us application
  app.post('/api/applications', rateLimit('application-submit', 5, 60 * 60 * 1000), (req: Request, res: Response) => {
    const validation = validateApplication(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const db = readDatabase();
    let applicationId = generateApplicationId();
    while (db.applications.some((item) => item.id === applicationId)) applicationId = generateApplicationId();

    const newApplication: Application = {
      id: applicationId,
      fullName: req.body.fullName.trim(),
      avatarUrl: req.body.avatarUrl.trim(),
      desiredRank: req.body.desiredRank as Rank,
      hobbies: req.body.hobbies.trim(),
      bio: req.body.bio.trim(),
      motivation: req.body.motivation.trim(),
      dubbingExperience: req.body.dubbingExperience?.trim() || '',
      contactInfo: req.body.contactInfo.trim(),
      additionalInfo: req.body.additionalInfo?.trim() || '',
      isConfirmed: Boolean(req.body.isConfirmed),
      status: 'pending',
      submittedAt: new Date().toISOString(),
      adminNotes: ''
    };

    db.applications.unshift(newApplication);
    saveDatabase(db);

    res.status(201).json({
      success: true,
      applicationId,
      message: 'Your application has been received successfully and is set to Pending status.'
    });
  });

  // Upload file (images or videos)
  app.post('/api/upload', rateLimit('upload', 15, 60 * 60 * 1000), upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const extension = path.extname(req.file.originalname).toLowerCase();
    if (!hasValidMediaSignature(req.file.path, extension)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'The uploaded file content does not match an allowed image or video format.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });

  // -------------------------------------------------------------
  // Authentication APIs
  // -------------------------------------------------------------

  app.post('/api/auth/login', rateLimit('admin-login', 5, 15 * 60 * 1000), (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = readDatabase();
    const isEmailMatch = db.adminUser.email.toLowerCase() === email.trim().toLowerCase();
    const isPasswordMatch = isEmailMatch && bcrypt.compareSync(password, db.adminUser.passwordHash);

    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = generateToken();
    activeSessions.set(token, Date.now() + SESSION_TTL_MS);

    res.json({
      success: true,
      token,
      user: {
        email: db.adminUser.email,
        role: db.adminUser.role
      }
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      activeSessions.delete(token);
    }
    res.json({ success: true });
  });

  app.get('/api/auth/session', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ authenticated: false });
    }
    const token = authHeader.split(' ')[1];
    const expiresAt = activeSessions.get(token);
    if (!expiresAt || expiresAt <= Date.now()) {
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

  app.post('/api/auth/change-password', requireAdminAuth, (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 12) {
      return res.status(400).json({ error: 'Current password is required and the new password must be at least 12 characters long.' });
    }

    const db = readDatabase();
    if (!bcrypt.compareSync(currentPassword, db.adminUser.passwordHash)) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    if (newPassword.length < 12) return res.status(400).json({ error: 'New password must be at least 12 characters long.' });
    db.adminUser.passwordHash = bcrypt.hashSync(newPassword, 12);
    saveDatabase(db);
    activeSessions.clear();

    res.json({ success: true, message: 'Admin password updated successfully. Please log in again.' });
  });

  // -------------------------------------------------------------
  // Protected Admin APIs
  // -------------------------------------------------------------

  // Get full admin dataset
  app.get('/api/admin/all-data', requireAdminAuth, (_req: Request, res: Response) => {
    const db = readDatabase();
    res.json({
      members: sortMembersByOrder(db.members),
      applications: db.applications,
      projects: [...db.projects].sort((a, b) => a.displayOrder - b.displayOrder),
      socialLinks: [...db.socialLinks].sort((a, b) => a.displayOrder - b.displayOrder),
      settings: db.settings,
      customization: db.customization,
      supabaseConfig: db.supabaseConfig || {
        supabaseUrl: '',
        supabaseAnonKey: '',
        isEnabled: false
      },
      stats: {
        totalMembers: db.members.length,
        activeMembers: db.members.filter((m) => m.isActive).length,
        pendingApplications: db.applications.filter((a) => a.status === 'pending').length,
        approvedApplications: db.applications.filter((a) => a.status === 'approved').length,
        rejectedApplications: db.applications.filter((a) => a.status === 'rejected').length,
        totalProjects: db.projects.length,
        publishedProjects: db.projects.filter((p) => p.isPublished).length
      }
    });
  });

  // --- Member Management ---

  app.post('/api/admin/members', requireAdminAuth, (req: Request, res: Response) => {
    const { name, rank, avatarUrl, hobbies, bio, joiningDate, isActive } = req.body;
    if (!name || !rank || !(OFFICIAL_RANKS as readonly string[]).includes(rank)) {
      return res.status(400).json({ error: 'Valid Name and official Rank are required.' });
    }

    const db = readDatabase();
    const newMember: Member = {
      id: 'bbs-mem-' + Date.now(),
      name: name.trim(),
      rank: rank as Rank,
      avatarUrl: avatarUrl?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      hobbies: hobbies?.trim() || '',
      bio: bio?.trim() || '',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      displayOrder: getNextDisplayOrder(db.members) // Append at bottom
    };

    db.members.push(newMember);
    saveDatabase(db);

    res.status(201).json({ success: true, member: newMember });
  });

  app.put('/api/admin/members/:id', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    const index = db.members.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const updates = req.body || {};
    if (updates.rank !== undefined && !(OFFICIAL_RANKS as readonly string[]).includes(updates.rank)) {
      return res.status(400).json({ error: 'Rank must be one of the 9 official ranks.' });
    }
    const allowedFields = ['name', 'rank', 'avatarUrl', 'hobbies', 'bio', 'joiningDate', 'isActive'];
    const safeUpdates = Object.fromEntries(allowedFields.filter((key) => updates[key] !== undefined).map((key) => [key, updates[key]]));
    if (safeUpdates.name !== undefined && (typeof safeUpdates.name !== 'string' || !safeUpdates.name.trim())) return res.status(400).json({ error: 'Member name is required.' });
    db.members[index] = { ...db.members[index], ...safeUpdates, id: db.members[index].id };

    saveDatabase(db);
    res.json({ success: true, member: db.members[index] });
  });

  app.delete('/api/admin/members/:id', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    const filtered = db.members.filter((m) => m.id !== req.params.id);
    if (filtered.length === db.members.length) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    db.members = reindexMembers(filtered);
    saveDatabase(db);
    res.json({ success: true, message: 'Member removed permanently.' });
  });

  // Reorder members
  app.put('/api/admin/members/reorder', requireAdminAuth, (req: Request, res: Response) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds array is required.' });
    }

    const db = readDatabase();
    const memberMap = new Map(db.members.map((m) => [m.id, m]));
    const reordered: Member[] = [];

    orderedIds.forEach((id: string, index: number) => {
      const mem = memberMap.get(id);
      if (mem) {
        reordered.push({ ...mem, displayOrder: index + 1 });
        memberMap.delete(id);
      }
    });

    // Append any remaining members at the bottom
    memberMap.forEach((mem) => {
      reordered.push({ ...mem, displayOrder: reordered.length + 1 });
    });

    db.members = reordered;
    saveDatabase(db);

    res.json({ success: true, members: sortMembersByOrder(db.members) });
  });

  // --- Application Management ---

  app.put('/api/admin/applications/:id', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    const index = db.applications.findIndex((a) => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const updates = req.body || {};
    const allowedFields = ['adminNotes', 'status'];
    if (updates.status !== undefined && !['pending', 'approved', 'rejected'].includes(updates.status)) return res.status(400).json({ error: 'Invalid application status.' });
    const safeUpdates = Object.fromEntries(allowedFields.filter((key) => updates[key] !== undefined).map((key) => [key, updates[key]]));
    db.applications[index] = { ...db.applications[index], ...safeUpdates, id: db.applications[index].id };

    saveDatabase(db);
    res.json({ success: true, application: db.applications[index] });
  });

  // Approve application -> auto-creates member profile at bottom
  app.post('/api/admin/applications/:id/approve', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    const index = db.applications.findIndex((a) => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const appRecord = db.applications[index];
    if (appRecord.status === 'approved') {
      const existingMember = db.members.find((member) => member.sourceApplicationId === appRecord.id);
      return res.json({ success: true, message: 'This application has already been approved.', application: appRecord, member: existingMember || null });
    }
    appRecord.status = 'approved';
    if (req.body.adminNotes) {
      appRecord.adminNotes = req.body.adminNotes;
    }

    // Automatically create a member profile and place at the bottom
    const newMember: Member = {
      id: 'bbs-mem-' + Date.now(),
      sourceApplicationId: appRecord.id,
      name: appRecord.fullName,
      rank: appRecord.desiredRank,
      avatarUrl: appRecord.avatarUrl,
      hobbies: appRecord.hobbies,
      bio: appRecord.bio,
      joiningDate: new Date().toISOString().split('T')[0],
      isActive: true,
      displayOrder: getNextDisplayOrder(db.members)
    };

    db.members.push(newMember);
    saveDatabase(db);

    res.json({
      success: true,
      message: `${appRecord.fullName} has been approved and added to the official member roster!`,
      application: appRecord,
      member: newMember
    });
  });

  // Reject application
  app.post('/api/admin/applications/:id/reject', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    const index = db.applications.findIndex((a) => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    db.applications[index].status = 'rejected';
    if (req.body.adminNotes) {
      db.applications[index].adminNotes = req.body.adminNotes;
    }

    saveDatabase(db);
    res.json({ success: true, application: db.applications[index] });
  });

  // --- Project Management ---

  app.post('/api/admin/projects', requireAdminAuth, (req: Request, res: Response) => {
    const { title, animeName, episodeNumber, description, releaseDate, category, thumbnailUrl, videoUrl, videoType, isFeatured, isPublished } = req.body;
    if (!title || !animeName) {
      return res.status(400).json({ error: 'Project Title and Anime Name are required.' });
    }

    const db = readDatabase();
    const maxOrder = db.projects.length > 0 ? Math.max(...db.projects.map((p) => p.displayOrder || 0)) : 0;

    const newProject: Project = {
      id: 'bbs-proj-' + Date.now(),
      title: title.trim(),
      animeName: animeName.trim(),
      episodeNumber: episodeNumber?.trim() || '',
      description: description?.trim() || '',
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      category: category?.trim() || 'Anime Dub',
      thumbnailUrl: thumbnailUrl?.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      videoUrl: videoUrl?.trim() || '',
      videoType: videoType || 'upload',
      isFeatured: Boolean(isFeatured),
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      displayOrder: maxOrder + 1
    };

    db.projects.push(newProject);
    saveDatabase(db);

    res.status(201).json({ success: true, project: newProject });
  });

  app.put('/api/admin/projects/:id', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    const index = db.projects.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const updates = req.body || {};
    const allowedFields = ['title', 'animeName', 'episodeNumber', 'description', 'releaseDate', 'category', 'thumbnailUrl', 'videoUrl', 'videoType', 'isFeatured', 'isPublished'];
    const safeUpdates = Object.fromEntries(allowedFields.filter((key) => updates[key] !== undefined).map((key) => [key, updates[key]]));
    db.projects[index] = { ...db.projects[index], ...safeUpdates, id: db.projects[index].id };

    saveDatabase(db);
    res.json({ success: true, project: db.projects[index] });
  });

  app.delete('/api/admin/projects/:id', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    const filtered = db.projects.filter((p) => p.id !== req.params.id);
    if (filtered.length === db.projects.length) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    db.projects = filtered.map((p, idx) => ({ ...p, displayOrder: idx + 1 }));
    saveDatabase(db);
    res.json({ success: true });
  });

  app.put('/api/admin/projects/reorder', requireAdminAuth, (req: Request, res: Response) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds array required.' });
    }

    const db = readDatabase();
    const projMap = new Map(db.projects.map((p) => [p.id, p]));
    const reordered: Project[] = [];

    orderedIds.forEach((id: string, index: number) => {
      const proj = projMap.get(id);
      if (proj) {
        reordered.push({ ...proj, displayOrder: index + 1 });
        projMap.delete(id);
      }
    });

    projMap.forEach((proj) => {
      reordered.push({ ...proj, displayOrder: reordered.length + 1 });
    });

    db.projects = reordered;
    saveDatabase(db);
    res.json({ success: true, projects: db.projects });
  });

  // --- Settings & Customization ---

  app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    db.settings = { ...db.settings, ...req.body };
    saveDatabase(db);
    res.json({ success: true, settings: db.settings });
  });

  app.put('/api/admin/customization', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    db.customization = { ...db.customization, ...req.body };
    saveDatabase(db);
    res.json({ success: true, customization: db.customization });
  });

  app.put('/api/admin/social-links', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    if (Array.isArray(req.body.socialLinks)) {
      db.socialLinks = req.body.socialLinks;
      saveDatabase(db);
    }
    res.json({ success: true, socialLinks: db.socialLinks });
  });

  app.put('/api/admin/supabase-config', requireAdminAuth, (req: Request, res: Response) => {
    const db = readDatabase();
    db.supabaseConfig = req.body;
    saveDatabase(db);
    res.json({ success: true, supabaseConfig: db.supabaseConfig });
  });

  app.post('/api/admin/reset-defaults', requireAdminAuth, (_req: Request, res: Response) => {
    const initialDb: DatabaseSchema = {
      adminUser: readDatabase().adminUser,
      members: DEFAULT_MEMBERS,
      applications: DEFAULT_APPLICATIONS,
      projects: DEFAULT_PROJECTS,
      socialLinks: DEFAULT_SOCIAL_LINKS,
      settings: DEFAULT_SETTINGS,
      customization: DEFAULT_CUSTOMIZATION
    };

    saveDatabase(initialDb);
    res.json({ success: true, message: 'Website and studio data reset to defaults.' });
  });

  // Normalize upload/parser errors without leaking stack traces to visitors.
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum upload size is 100MB.' : 'Upload could not be processed.' });
    }
    if (err) {
      console.error('[BlackBird Studio] Request error:', err.message || err);
      return res.status(400).json({ error: err.type === 'entity.too.large' ? 'Request payload is too large.' : 'Request could not be processed.' });
    }
    return res.status(500).json({ error: 'Internal server error.' });
  });

  // -------------------------------------------------------------
  // Frontend Serving (Vite middleware in dev, dist in production)
  // -------------------------------------------------------------
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BlackBird Studio Server] Running on http://0.0.0.0:${PORT}`);
  });
}

// Start server
createServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
