
import { OFFICIAL_RANKS, Rank } from '../types/index.ts';

/**
 * Validates whether a rank belongs to the
 * official BlackBird Studio rank system.
 *
 * Official ranks:
 * D, C, B, A, S, Immortal, Moderator,
 * Admin, Co-Founder, Owner
 */
export function isValidRank(rank: string): rank is Rank {
  return (OFFICIAL_RANKS as readonly string[]).includes(rank);
}

/* =========================================
   RANK WEIGHTS
========================================= */

/**
 * Higher number = higher rank.
 */
export const RANK_WEIGHTS: Record<Rank, number> = {
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
  Immortal: 6,
  Moderator: 7,
  Admin: 8,
  'Co-Founder': 9,
  Owner: 10
};

/* =========================================
   RANK BADGE STYLES
========================================= */

export function getRankBadgeStyle(rank: Rank): {
  label: string;
  bg: string;
  text: string;
  border: string;
  glow: string;
  description: string;
} {
  switch (rank) {
    case 'Owner':
      return {
        label: 'Owner',
        bg: 'bg-gradient-to-r from-amber-500/25 via-yellow-400/20 to-amber-600/30',
        text: 'text-yellow-300 font-bold',
        border: 'border-yellow-400/70',
        glow: 'shadow-[0_0_15px_rgba(234,179,8,0.35)]',
        description: 'Studio Founder & Executive Director'
      };

    case 'Co-Founder':
      return {
        label: 'Co-Founder',
        bg: 'bg-gradient-to-r from-orange-950/60 via-amber-950/50 to-yellow-950/40',
        text: 'text-orange-300 font-bold',
        border: 'border-orange-400/60',
        glow: 'shadow-[0_0_14px_rgba(251,146,60,0.3)]',
        description: 'Studio Co-Founder & Executive Leadership'
      };

    case 'Admin':
      return {
        label: 'Admin',
        bg: 'bg-red-950/40',
        text: 'text-rose-300 font-semibold',
        border: 'border-rose-500/50',
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.25)]',
        description: 'Lead Management & Production Overseer'
      };

    case 'Moderator':
      return {
        label: 'Moderator',
        bg: 'bg-purple-950/40',
        text: 'text-purple-300 font-semibold',
        border: 'border-purple-500/50',
        glow: 'shadow-[0_0_12px_rgba(168,85,247,0.25)]',
        description: 'Community & Quality Coordinator'
      };

    case 'Immortal':
      return {
        label: 'Immortal',
        bg: 'bg-gradient-to-r from-cyan-950/50 to-blue-950/50',
        text: 'text-cyan-300 font-semibold',
        border: 'border-cyan-400/60',
        glow: 'shadow-[0_0_14px_rgba(34,211,238,0.3)]',
        description: 'Legendary Veteran Voice Artist'
      };

    case 'S':
      return {
        label: 'Rank S',
        bg: 'bg-amber-950/40',
        text: 'text-amber-300 font-semibold',
        border: 'border-amber-400/50',
        glow: 'shadow-[0_0_10px_rgba(251,191,36,0.25)]',
        description: 'Elite Master Voice Artist'
      };

    case 'A':
      return {
        label: 'Rank A',
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-300 font-medium',
        border: 'border-emerald-500/40',
        glow: 'shadow-[0_0_8px_rgba(16,185,129,0.2)]',
        description: 'Senior Voice Artist'
      };

    case 'B':
      return {
        label: 'Rank B',
        bg: 'bg-blue-950/40',
        text: 'text-blue-300 font-medium',
        border: 'border-blue-500/40',
        glow: 'shadow-[0_0_8px_rgba(59,130,246,0.2)]',
        description: 'Established Voice Artist'
      };

    case 'C':
      return {
        label: 'Rank C',
        bg: 'bg-slate-900/60',
        text: 'text-slate-300 font-medium',
        border: 'border-slate-600/50',
        glow: '',
        description: 'Junior Voice Artist'
      };

    case 'D':
    default:
      return {
        label: 'Rank D',
        bg: 'bg-zinc-900/60',
        text: 'text-zinc-400',
        border: 'border-zinc-700/50',
        glow: '',
        description: 'Apprentice / Trainee'
      };
  }
}
