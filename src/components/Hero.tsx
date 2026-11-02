import React from 'react';
import { WebsiteCustomization, StudioSettings } from '../types/index.ts';
import { Sparkles, Users, Film, UserPlus, Mic, Play, Award } from 'lucide-react';

interface HeroProps {
  customization: WebsiteCustomization;
  settings: StudioSettings;
  memberCount: number;
  projectCount: number;
  onNavigate: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  customization,
  settings,
  memberCount,
  projectCount,
  onNavigate
}) => {
  return (
    <section 
      id="hero" 
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-24 sm:py-32"
    >
      {/* Background Graphic / Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle radial gold aura */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{ backgroundColor: customization.accentColor || '#d4af37' }}
        />
        {/* Secondary dark vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#08080a]/80 to-[#08080a]" />

        {/* Custom background image if set by admin */}
        {customization.desktopBgImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-opacity"
            style={{ 
              backgroundImage: `url(${customization.desktopBgImage})`,
              opacity: 1 - (customization.bgOverlayOpacity ?? 0.85)
            }}
          />
        )}

        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtitle / Studio Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-medium mb-8 backdrop-blur-sm shadow-[0_0_20px_rgba(212,175,55,0.15)] animate-fadeIn">
          <Mic className="w-4 h-4 text-amber-400" />
          <span className="tracking-wide">Bangla Anime Voice Dubbing Studio</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span className="text-zinc-400">Est. {settings.foundedYear || '2022'}</span>
        </div>

        {/* Main Heading */}
        <h1 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-wider text-white leading-tight uppercase mb-6 drop-shadow-md">
          {customization.heroHeading || 'WELCOME TO BLACKBIRD STUDIO'}
        </h1>

        {/* Description */}
        <p className="text-base sm:text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto font-light leading-relaxed mb-10 text-balance">
          {customization.heroDescription || 'A creative community of passionate voice artists and dubbing enthusiasts.'}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => onNavigate('members')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-semibold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Users className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Explore Members</span>
          </button>

          <button
            onClick={() => onNavigate('projects')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-amber-500/40 bg-zinc-900/60 hover:bg-zinc-800/80 text-amber-200 font-semibold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-amber-400 hover:text-white"
          >
            <Film className="w-4 h-4 text-amber-400" />
            <span>Explore Our Works</span>
          </button>

          <button
            onClick={() => onNavigate('join-us')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-zinc-700/60 hover:border-amber-500/50 bg-black/40 hover:bg-amber-500/10 text-zinc-200 hover:text-amber-300 font-semibold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Join Our Team</span>
          </button>
        </div>

        {/* Studio Highlights & Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-zinc-800/80">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-heading font-black text-amber-400 mb-1">
              {memberCount}+
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Voice Members
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-heading font-black text-amber-400 mb-1">
              9
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Official Ranks
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-heading font-black text-amber-400 mb-1">
              {projectCount}+
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Dub Releases
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-heading font-black text-amber-400 mb-1">
              100%
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Bangla Voice Fidelity
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
