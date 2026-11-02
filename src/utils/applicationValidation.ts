import { randomInt } from 'node:crypto';
import { Application, Rank, OFFICIAL_RANKS } from '../types/index.ts';

export interface ApplicationInput {
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
}

/**
 * Generates unique application ID, e.g. BBS-2026-8942
 */
export function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const rand = randomInt(10_000_000, 100_000_000);
  return `BBS-${year}-${rand}`;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates the 10 application fields according to studio requirements:
 * 1. Full Name (min 2 chars)
 * 2. Profile Picture Upload (must have avatarUrl)
 * 3. Desired Rank / Current Rank (must be one of the 9 official ranks)
 * 4. Hobbies (required)
 * 5. Short Introduction / Bio (required, min 10 chars)
 * 6. Why do you want to join BlackBird Studio? (required, min 15 chars)
 * 7. Dubbing Experience (optional)
 * 8. Contact Information (required: Facebook link or valid email)
 * 9. Additional Information (optional)
 * 10. Confirmation that the submitted information is accurate (must be true)
 */
export function validateApplication(input: Partial<ApplicationInput>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'Full Name is required (at least 2 characters).';
  }

  if (!input.avatarUrl || input.avatarUrl.trim().length === 0) {
    errors.avatarUrl = 'A profile picture is required for identification.';
  }

  if (!input.desiredRank || !(OFFICIAL_RANKS as readonly string[]).includes(input.desiredRank)) {
    errors.desiredRank = 'Please select a valid official rank (D through Owner).';
  }

  if (!input.hobbies || input.hobbies.trim().length < 2) {
    errors.hobbies = 'Please list at least one hobby or creative interest.';
  }

  if (!input.bio || input.bio.trim().length < 10) {
    errors.bio = 'Please provide a short introduction / bio (at least 10 characters).';
  }

  if (!input.motivation || input.motivation.trim().length < 15) {
    errors.motivation = 'Please tell us why you want to join BlackBird Studio (at least 15 characters).';
  }

  if (!input.contactInfo || input.contactInfo.trim().length < 4) {
    errors.contactInfo = 'Please provide your Facebook profile URL or an active email address.';
  } else {
    const contact = input.contactInfo.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    let isFacebook = false;
    try {
      const normalized = /^https?:\/\//i.test(contact) ? contact : `https://${contact}`;
      const parsed = new URL(normalized);
      isFacebook = ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com', 'www.fb.com'].includes(parsed.hostname.toLowerCase()) && parsed.pathname.length > 1;
    } catch { isFacebook = false; }
    if (!isEmail && !isFacebook) {
      errors.contactInfo = 'Must be a valid email or Facebook profile link (e.g. facebook.com/username).';
    }
  }

  if (!input.isConfirmed) {
    errors.isConfirmed = 'You must confirm that all submitted details are accurate.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
