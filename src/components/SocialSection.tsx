import React from 'react';
import { SocialLink, StudioSettings } from '../types/index.ts';
import { 
  Share2, 
  Youtube, 
  MessageSquare, 
  ExternalLink, 
  Mail, 
  Globe, 
  Facebook, 
  Instagram, 
  Video 
} from 'lucide-react';

interface SocialSectionProps {
  socialLinks: SocialLink[];
  settings: StudioSettings;
}

export const SocialSection: React.FC<SocialSectionProps> = ({ socialLinks, settings }) => {
  const visibleLinks = socialLinks.filter((link) => link.isVisible);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook_page':
      case 'facebook_group':
      case 'facebook_profile':
        return Facebook;
      case 'youtube':
        return Youtube;
      case 'discord':
        return MessageSquare;
      case 'instagram':
        return Instagram;
      case 'tiktok':
        return Video;
      default:
        return Globe;
    }
  };

  return (
    <section id="social" className="py-20 sm:py-28 bg-[#09090d] relative border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Connect & Follow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-wide uppercase mb-4">
            Official Channels & Community
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-6" />
          <p className="text-zinc-300 text-base sm:text-lg font-light leading-relaxed">
            Follow BlackBird Studio across official platforms for dubbing behind-the-scenes, casting calls, episode teasers, and community discussions.
          </p>
        </div>

        {/* Dynamic Social Links Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {visibleLinks.map((link) => {
            const Icon = getPlatformIcon(link.platform);
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900/80 transition-all duration-300 flex items-center justify-between hover:shadow-[0_0_25px_rgba(212,175,55,0.12)] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-black transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white text-base group-hover:text-amber-300 transition-colors">
                      {link.title}
                    </h3>
                    <span className="text-xs text-zinc-400 capitalize">
                      {link.platform.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              </a>
            );
          })}
        </div>

        {/* Contact Strip */}
        <div className="p-8 rounded-2xl bg-[#0d0d12] border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-heading font-bold text-white">
                Official Studio Inquiries
              </h4>
              <p className="text-xs text-zinc-400">
                For dubbing collaborations, business, or media inquiries
              </p>
            </div>
          </div>
          <a
            href={`mailto:${settings.contactEmail}`}
            className="px-6 py-3 rounded-lg bg-zinc-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black font-semibold text-xs uppercase tracking-wider transition-all"
          >
            {settings.contactEmail}
          </a>
        </div>

      </div>
    </section>
  );
};
