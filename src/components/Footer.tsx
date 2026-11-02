import React from 'react';
import { StudioSettings, SocialLink } from '../types/index.ts';
import { ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  settings: StudioSettings;
  socialLinks: SocialLink[];
  onNavigate: (sectionId: string) => void;
  onOpenAdminLogin: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  socialLinks,
  onNavigate,
  onOpenAdminLogin,
  onOpenLegal
}) => {
  const currentYear = new Date().getFullYear();
  const visibleLinks = socialLinks.filter((s) => s.isVisible);

  return (
    <footer className="bg-black border-t border-zinc-900 pt-16 pb-12 text-zinc-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-900">
          
          {/* Col 1: Studio Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-amber-500/40 bg-zinc-950 flex items-center justify-center p-1">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt={settings.studioName} className="w-full h-full object-cover rounded" />
                ) : (
                  <span className="font-heading font-black text-amber-400">BB</span>
                )}
              </div>
              <span className="font-heading font-extrabold text-white text-lg tracking-wider">
                {settings.studioName}
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed font-light">
              {settings.tagline || 'The Premier Bangla Anime Dubbing House.'} Bringing passionate voice acting and cinematic audio adaptation to Bengali fans worldwide.
            </p>
            <div className="text-[11px] text-zinc-400">
              Audition inquiries: <span className="text-amber-300">{settings.contactEmail}</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-white uppercase tracking-wider text-xs">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('hero')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('members')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Our Members
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('projects')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Our Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('join-us')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Join Us (Auditions)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Admin */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-white uppercase tracking-wider text-xs">
              Platform & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onOpenLegal('privacy')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('terms')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenAdminLogin} 
                  className="hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5 text-zinc-400"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin Access</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div>
            &copy; {currentYear} {settings.studioName}. All Rights Reserved. Fan-created anime dubbing project.
          </div>
          <div className="flex items-center gap-2">
            <span>Official Bangla Anime Voice Cast</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">9 Ranks System</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
