/**
 * Types for BlackBird Studio
 */

export const OFFICIAL_RANKS = [
  'D',
  'C',
  'B',
  'A',
  'S',
  'Immortal',
  'Moderator',
  'Admin',
  'Owner'
] as const;

export type Rank = typeof OFFICIAL_RANKS[number];

export interface Member {
  id: string;
  name: string;
  rank: Rank;
  avatarUrl: string;
  hobbies: string;
  bio: string;
  joiningDate: string; // YYYY-MM-DD
  isActive: boolean;
  displayOrder: number;
  sourceApplicationId?: string; // Internal idempotency link for approved applications
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Application {
  id: string; // e.g. BBS-APP-12345
  fullName: string;
  avatarUrl: string;
  desiredRank: Rank;
  hobbies: string;
  bio: string;
  motivation: string;
  dubbingExperience?: string;
  contactInfo: string; // Facebook profile link or email
  additionalInfo?: string;
  isConfirmed: boolean;
  status: ApplicationStatus;
  submittedAt: string; // ISO string
  adminNotes?: string;
}

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

export interface WebsiteCustomization {
  accentColor: string; // default #d4af37 (Gold)
  bgColor: string;     // default #08080a
  cardStyle: 'glass' | 'solid' | 'bordered';
  animationsEnabled: boolean;
  animationIntensity: 'subtle' | 'normal' | 'cinematic';
  hoverEffectsEnabled: boolean;
  pageTransitions: boolean;
  desktopBgImage: string;
  mobileBgImage: string;
  bgOverlayOpacity: number; // 0 to 1
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

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin';
  lastLogin?: string;
}
