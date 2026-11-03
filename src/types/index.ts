
/**
 * Types for BlackBird Studio
 */

/* =========================================
   OFFICIAL RANK SYSTEM
========================================= */

export const OFFICIAL_RANKS = [
  'D',
  'C',
  'B',
  'A',
  'S',
  'Immortal',
  'Moderator',
  'Admin',
  'Co-Founder',
  'Owner'
] as const;

export type Rank = typeof OFFICIAL_RANKS[number];

/* =========================================
   PUBLIC MEMBER ROSTER
========================================= */

export interface Member {
  id: string;
  name: string;
  rank: Rank;
  avatarUrl: string;
  hobbies: string;
  bio: string;
  facebookLink?: string;
  joiningDate: string;
  isActive: boolean;
  displayOrder: number;

  // Existing application relationship
  sourceApplicationId?: string;

  // New member account relationship
  sourceMemberAccountId?: string;
}

/* =========================================
   APPLICATION SYSTEM
========================================= */

export type ApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

export interface Application {
  id: string;
  fullName: string;
  avatarUrl: string;
  desiredRank: Rank;
  hobbies: string;
  bio: string;
  motivation: string;
  dubbingExperience?: string;
  contactInfo: string;
  additionalInfo?: string;
  isConfirmed: boolean;
  status: ApplicationStatus;
  submittedAt: string;
  adminNotes?: string;
}

/* =========================================
   PROJECT / OUR WORKS SYSTEM
========================================= */

export interface Project {
  id: string;
  title: string;
  animeName: string;
  episodeNumber: string;
  description: string;
  releaseDate: string;
  category: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoType: 'upload' | 'youtube' | 'external';
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
}

/* =========================================
   SOCIAL LINKS
========================================= */

export type SocialPlatform =
  | 'facebook_page'
  | 'facebook_group'
  | 'facebook_profile'
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'discord'
  | 'custom';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  title: string;
  url: string;
  icon?: string;
  isVisible: boolean;
  displayOrder: number;
}

/* =========================================
   STUDIO SETTINGS
========================================= */

export interface StudioSettings {
  studioName: string;
  tagline: string;
  logoUrl: string;
  groupPictureUrl: string;
  contactEmail: string;
  announcementText: string;
  isAnnouncementVisible: boolean;
  foundedYear: string;
}

/* =========================================
   WEBSITE CUSTOMIZATION
========================================= */

export interface WebsiteCustomization {
  accentColor: string;
  bgColor: string;
  cardStyle: 'glass' | 'solid' | 'bordered';
  animationsEnabled: boolean;
  animationIntensity: 'subtle' | 'normal' | 'cinematic';
  hoverEffectsEnabled: boolean;
  pageTransitions: boolean;
  desktopBgImage: string;
  mobileBgImage: string;
  bgOverlayOpacity: number;
  heroHeading: string;
  heroDescription: string;
  visibleSections: {
    hero: boolean;
    story: boolean;
    members: boolean;
    projects: boolean;
    joinUs: boolean;
    social: boolean;
    contact: boolean;
  };
}

/* =========================================
   ADMIN USER
========================================= */

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin';
  lastLogin?: string;
}

/* =========================================
   MEMBER ACCOUNT SYSTEM
========================================= */

export type MemberAccountStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

/**
 * Member's editable profile information.
 *
 * Rank is visible to the member but controlled
 * exclusively by the Admin.
 */
export interface MemberAccountProfile {
  avatarUrl: string;
  bio: string;
  hobbies: string;
  facebookLink: string;
  rank: Rank;
}

/**
 * Member account stored in the database.
 */
export interface MemberAccount {
  id: string;
  full_name: string;
  email: string;
  status: MemberAccountStatus;
  profile: MemberAccountProfile;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

/* =========================================
   MEMBER REGISTRATION
========================================= */

export interface MemberRegistrationData {
  fullName: string;
  email: string;
  password: string;
}

/* =========================================
   MEMBER LOGIN
========================================= */

export interface MemberLoginData {
  email: string;
  password: string;
}

/* =========================================
   MEMBER AUTH RESPONSE
========================================= */

export interface MemberAuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  status?: MemberAccountStatus;
  account?: MemberAccount;
}

/* =========================================
   MEMBER PROFILE UPDATE
========================================= */

/**
 * Members can update their own profile fields.
 *
 * Rank is intentionally excluded.
 * Only Admin can change a member's rank.
 */
export interface MemberProfileUpdate {
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  hobbies?: string;
  facebookLink?: string;
}
