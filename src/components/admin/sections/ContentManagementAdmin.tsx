import React, { useState } from 'react';
import { WebsiteCustomization, StudioSettings } from '../../../types/index.ts';
import { 
  FileText, 
  Save, 
  Check, 
  Sparkles,
  Loader2
} from 'lucide-react';

interface ContentManagementAdminProps {
  customization: WebsiteCustomization;
  settings: StudioSettings;
  onUpdateCustomization: (customization: Partial<WebsiteCustomization>) => Promise<void>;
  onUpdateSettings: (settings: Partial<StudioSettings>) => Promise<void>;
}

export const ContentManagementAdmin: React.FC<ContentManagementAdminProps> = ({
  customization,
  settings,
  onUpdateCustomization,
  onUpdateSettings
}) => {
  const [heroHeading, setHeroHeading] = useState(customization.heroHeading || 'WELCOME TO BLACKBIRD STUDIO');
  const [heroDescription, setHeroDescription] = useState(customization.heroDescription || 'A creative community of passionate voice artists and dubbing enthusiasts.');
  const [studioTagline, setStudioTagline] = useState(settings.tagline || 'The Premier Bangla Anime Dubbing House');
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await Promise.all([
        onUpdateCustomization({
          heroHeading: heroHeading.trim(),
          heroDescription: heroDescription.trim()
        }),
        onUpdateSettings({
          tagline: studioTagline.trim()
        })
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update website content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-wider">
            Website Content & Headings Management
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Customize main homepage headings, descriptions, hero banners, and studio slogans.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.35)]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saveSuccess ? 'Content Saved!' : 'Save Website Content'}</span>
        </button>
      </div>

      {/* Hero Section Content */}
      <div className="p-6 rounded-2xl bg-[#101015] border border-zinc-800 space-y-4">
        <h3 className="text-sm font-heading font-bold text-amber-300 uppercase tracking-wider">
          Homepage Hero Banner Content
        </h3>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
            Main Hero Heading (H1)
          </label>
          <input
            type="text"
            value={heroHeading}
            onChange={(e) => setHeroHeading(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
            Hero Description Subtitle
          </label>
          <textarea
            rows={3}
            value={heroDescription}
            onChange={(e) => setHeroDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
            Studio Slogan / Official Tagline
          </label>
          <input
            type="text"
            value={studioTagline}
            onChange={(e) => setStudioTagline(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

    </form>
  );
};
