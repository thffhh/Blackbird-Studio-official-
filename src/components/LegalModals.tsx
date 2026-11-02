import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0f0f14] border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.2)] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Close legal modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
          {isPrivacy ? (
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          ) : (
            <FileText className="w-5 h-5 text-amber-400" />
          )}
          <h3 className="text-xl font-heading font-black text-white uppercase tracking-wide">
            {isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'}
          </h3>
        </div>

        <div className="overflow-y-auto space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed font-light pr-2">
          {isPrivacy ? (
            <>
              <p>
                <strong>BlackBird Studio Privacy Policy</strong> (Updated 2026)
              </p>
              <p>
                BlackBird Studio is committed to protecting the privacy of our voice artists, community members, and audition applicants.
              </p>
              <h4 className="text-sm font-bold text-amber-300">1. Information Collection</h4>
              <p>
                When submitting an audition application, we collect your name, profile photograph, hobbies, biographical intro, dubbing background, and contact details (email or Facebook URL) solely to evaluate your fit for our voice cast.
              </p>
              <h4 className="text-sm font-bold text-amber-300">2. Data Security & Storage</h4>
              <p>
                Applicant information is kept strictly private within our administrative dashboard and is never shared with third parties, advertisers, or published publicly without explicit approval.
              </p>
              <h4 className="text-sm font-bold text-amber-300">3. Public Roster</h4>
              <p>
                Only approved and active team members are displayed in our public member gallery with their approved stage name, rank, profile picture, and bio.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>BlackBird Studio Terms of Service</strong>
              </p>
              <p>
                Welcome to the official online platform of BlackBird Studio, a fan-driven Bangla anime dubbing community.
              </p>
              <h4 className="text-sm font-bold text-amber-300">1. Non-Commercial & Fan Tribute</h4>
              <p>
                All dubbed video projects showcased by BlackBird Studio are creative fan localizations designed to promote appreciation for anime among Bengali-speaking audiences worldwide. All original Japanese rights, animation, score, and characters remain the property of their respective creators and production committees.
              </p>
              <h4 className="text-sm font-bold text-amber-300">2. Member Conduct & Auditions</h4>
              <p>
                By applying to BlackBird Studio, applicants confirm they will uphold respectful studio conduct, commit to assigned production timelines, and maintain artistic integrity in voice delivery.
              </p>
              <h4 className="text-sm font-bold text-amber-300">3. Official Ranks</h4>
              <p>
                Studio ranks (D through Owner) reflect artistic seniority and production responsibilities awarded solely at the discretion of studio administration.
              </p>
            </>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white uppercase tracking-wider font-semibold cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
