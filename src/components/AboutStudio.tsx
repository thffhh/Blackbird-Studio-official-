import React from 'react';
import { StudioSettings } from '../types/index.ts';
import { getRankBadgeStyle } from '../utils/ranks.ts';
import { OFFICIAL_RANKS } from '../types/index.ts';
import { Award, Mic2, Radio, HeartHandshake, Sparkles } from 'lucide-react';

interface AboutStudioProps {
  settings: StudioSettings;
  onJoinClick: () => void;
}

export const AboutStudio: React.FC<AboutStudioProps> = ({ settings, onJoinClick }) => {
  return (
    <section id="story" className="py-20 sm:py-28 bg-[#0a0a0e] relative border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Behind The Mic</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tracking-wide uppercase mb-4">
            The BlackBird Philosophy
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-6" />
          <p className="text-zinc-300 text-base sm:text-lg leading-relaxed font-light">
            Founded with an uncompromising passion for Japanese animation and the rich vocal expressions of the Bengali language, BlackBird Studio brings world-class anime storytelling directly to Bangladeshi fans.
          </p>
        </div>

        {/* Group Photo & Studio Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-24">
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-[0_0_35px_rgba(212,175,55,0.15)] group">
              {settings.groupPictureUrl ? (
                <img 
                  src={settings.groupPictureUrl} 
                  alt={`${settings.studioName} Team Cast`} 
                  className="w-full h-[380px] sm:h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-[400px] bg-zinc-900 flex items-center justify-center text-zinc-500 font-medium">
                  Studio Cast Photo
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <span className="text-amber-400 text-xs uppercase tracking-widest font-bold">
                  Official Studio Roster & Cast
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-bold text-white mt-1">
                  Voices that Echo Beyond the Screen
                </h3>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Mic2 className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-heading font-bold text-white">
                  Acoustic Authenticity
                </h4>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed font-light">
                Every battle shout, whispered secret, and comedic banter is tailored with exact lip sync synchronization and audio engineering to match the Japanese original’s emotional weight.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-heading font-bold text-white">
                  Merit & Growth Ranks
                </h4>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed font-light">
                Our strict 9-rank hierarchy fosters skill growth, transparent voice allocation, and production leadership for passionate artists across Bangladesh.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onJoinClick}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500 text-amber-300 hover:text-black font-semibold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Audition For The Studio &rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* 9 Ranks Showcase */}
        <div className="p-8 sm:p-10 rounded-2xl bg-zinc-950/70 border border-amber-500/20 backdrop-blur-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-white uppercase tracking-wider mb-2">
              The 9 Official Studio Ranks
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Each artist is recognized through their performance dedication, vocal versatility, and leadership.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
            {OFFICIAL_RANKS.map((rank) => {
              const style = getRankBadgeStyle(rank);
              return (
                <div 
                  key={rank}
                  className={`p-3 rounded-xl border text-center transition-all ${style.bg} ${style.border} ${style.glow}`}
                >
                  <div className={`text-sm sm:text-base font-bold ${style.text}`}>
                    {rank}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-tight">
                    {style.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
