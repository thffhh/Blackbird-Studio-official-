import React from 'react';
import { Member } from '../types/index.ts';
import { getRankBadgeStyle } from '../utils/ranks.ts';
import { X, Calendar, Sparkles, Heart, BookOpen, Share2 } from 'lucide-react';

interface MemberModalProps {
  member: Member | null;
  onClose: () => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({ member, onClose }) => {
  if (!member) return null;

  const rankStyle = getRankBadgeStyle(member.rank);

  const formattedDate = (() => {
    try {
      const d = new Date(member.joiningDate);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return member.joiningDate;
    }
  })();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${member.name} - BlackBird Studio`,
        text: `Check out ${member.name} (${member.rank}) at BlackBird Studio Bangla Dubbing team!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0f0f14] border border-amber-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-black transition-colors cursor-pointer"
          aria-label="Close profile modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto">
          {/* Top Banner & Picture */}
          <div className="relative h-48 sm:h-56 bg-gradient-to-b from-amber-950/40 via-zinc-900 to-[#0f0f14] flex items-end p-6 border-b border-zinc-800">
            {/* Ambient gold glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/15 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5 w-full">
              {/* Larger Profile Picture */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-400 bg-zinc-900 shadow-[0_0_20px_rgba(212,175,55,0.3)] shrink-0">
                <img 
                  src={member.avatarUrl} 
                  alt={member.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Rank */}
              <div className="text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-md border text-xs uppercase tracking-wider mb-2 font-bold backdrop-blur-sm shadow-sm"
                     style={{}}
                >
                  <span className={`px-2 py-0.5 rounded ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}>
                    Rank {member.rank}
                  </span>
                  <span className="text-zinc-400 text-[11px] font-normal">
                    {rankStyle.description}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-wide">
                  {member.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Meta row: Joining Date */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 text-sm">
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Joined Studio:</span>
                <span className="text-zinc-200 font-medium">{formattedDate}</span>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700/80 hover:border-amber-500/50 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>

            {/* Hobbies / Interests */}
            <div>
              <div className="flex items-center gap-2 text-amber-300 text-xs uppercase tracking-wider font-bold mb-2">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Hobbies & Creative Interests</span>
              </div>
              <p className="text-sm text-zinc-300 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                {member.hobbies || 'Voice acting, audio engineering, storytelling.'}
              </p>
            </div>

            {/* Biography */}
            <div>
              <div className="flex items-center gap-2 text-amber-300 text-xs uppercase tracking-wider font-bold mb-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Artist Biography</span>
              </div>
              <div className="text-sm text-zinc-300 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80 leading-relaxed font-light whitespace-pre-line">
                {member.bio || 'Dedicated voice artist contributing to BlackBird Studio anime dub productions.'}
              </div>
            </div>

            {/* Studio Badge verification */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-zinc-900/50 to-amber-950/20 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-zinc-300">Official BlackBird Studio Verified Voice Artist</span>
              </div>
              <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">Active Cast</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
