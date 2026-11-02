import React, { useState } from 'react';
import { WebsiteCustomization } from '../../../types/index.ts';
import { uploadMedia } from '../../../services/api.ts';
import { 
  Palette, 
  Upload, 
  Trash2, 
  Save, 
  Check, 
  Sparkles, 
  Eye, 
  Layout, 
  Zap, 
  Sliders,
  RotateCcw,
  Loader2
} from 'lucide-react';

interface WebsiteCustomizationAdminProps {
  customization: WebsiteCustomization;
  onUpdateCustomization: (customization: Partial<WebsiteCustomization>) => Promise<void>;
}

export const WebsiteCustomizationAdmin: React.FC<WebsiteCustomizationAdminProps> = ({
  customization,
  onUpdateCustomization
}) => {
  const [accentColor, setAccentColor] = useState(customization.accentColor || '#d4af37');
  const [bgColor, setBgColor] = useState(customization.bgColor || '#08080a');
  const [cardStyle, setCardStyle] = useState<'glass' | 'solid' | 'bordered'>(customization.cardStyle || 'glass');
  
  // Animations
  const [animationsEnabled, setAnimationsEnabled] = useState(customization.animationsEnabled ?? true);
  const [animationIntensity, setAnimationIntensity] = useState<'subtle' | 'normal' | 'cinematic'>(customization.animationIntensity || 'cinematic');
  const [hoverEffectsEnabled, setHoverEffectsEnabled] = useState(customization.hoverEffectsEnabled ?? true);
  const [pageTransitions, setPageTransitions] = useState(customization.pageTransitions ?? true);

  // Background Customization
  const [desktopBgImage, setDesktopBgImage] = useState(customization.desktopBgImage || '');
  const [mobileBgImage, setMobileBgImage] = useState(customization.mobileBgImage || '');
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState(customization.bgOverlayOpacity ?? 0.85);

  // Content Customization
  const [heroHeading, setHeroHeading] = useState(customization.heroHeading || 'WELCOME TO BLACKBIRD STUDIO');
  const [heroDescription, setHeroDescription] = useState(customization.heroDescription || 'A creative community of passionate voice artists and dubbing enthusiasts.');

  // Section Visibility
  const [visibleSections, setVisibleSections] = useState(customization.visibleSections || {
    hero: true,
    story: true,
    members: true,
    projects: true,
    joinUs: true,
    social: true,
    contact: true
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const handleUploadDesktopBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDesktop(true);
      const res = await uploadMedia(file);
      setDesktopBgImage(res.url);
    } catch (err: any) {
      alert(err.message || 'Desktop background upload failed');
    } finally {
      setUploadingDesktop(false);
    }
  };

  const handleUploadMobileBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMobile(true);
      const res = await uploadMedia(file);
      setMobileBgImage(res.url);
    } catch (err: any) {
      alert(err.message || 'Mobile background upload failed');
    } finally {
      setUploadingMobile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onUpdateCustomization({
        accentColor,
        bgColor,
        cardStyle,
        animationsEnabled,
        animationIntensity,
        hoverEffectsEnabled,
        pageTransitions,
        desktopBgImage,
        mobileBgImage,
        bgOverlayOpacity,
        heroHeading: heroHeading.trim(),
        heroDescription: heroDescription.trim(),
        visibleSections
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update customization');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key: keyof typeof visibleSections) => {
    setVisibleSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-wider">
            Website Design & Customization
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure gold color tones, upload background images, toggle animation intensity, and control section visibility.
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
          <span>{saveSuccess ? 'Customization Saved!' : 'Save & Publish Changes'}</span>
        </button>
      </div>

      {/* Design & Palette Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Accent Color */}
        <div className="p-5 rounded-2xl bg-[#101015] border border-zinc-800 space-y-3">
          <label className="text-xs uppercase tracking-wider font-bold text-amber-300 block">
            Studio Accent Color (Gold)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-10 h-10 rounded-xl border border-zinc-700 bg-transparent cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-mono"
            />
          </div>
          <div className="flex gap-2 pt-1">
            {['#d4af37', '#f59e0b', '#eab308', '#f3ba2f'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAccentColor(preset)}
                className="w-6 h-6 rounded-full border border-white/20 cursor-pointer"
                style={{ backgroundColor: preset }}
                title={`Preset ${preset}`}
              />
            ))}
          </div>
        </div>

        {/* Card Style */}
        <div className="p-5 rounded-2xl bg-[#101015] border border-zinc-800 space-y-3">
          <label className="text-xs uppercase tracking-wider font-bold text-amber-300 block">
            UI Card Aesthetics
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['glass', 'solid', 'bordered'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setCardStyle(style)}
                className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  cardStyle === style
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-zinc-500 block">
            Glass applies backdrop blur and subtle golden sheen.
          </span>
        </div>

        {/* Animation Intensity */}
        <div className="p-5 rounded-2xl bg-[#101015] border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider font-bold text-amber-300">
              Animation Dynamics
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={animationsEnabled}
                onChange={(e) => setAnimationsEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-zinc-900 text-amber-500"
              />
              <span className="text-[11px] text-zinc-300">Enable</span>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['subtle', 'normal', 'cinematic'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                disabled={!animationsEnabled}
                onClick={() => setAnimationIntensity(lvl)}
                className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer disabled:opacity-40 ${
                  animationIntensity === lvl
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-zinc-500 block">
            Controls hero particle speed, card hovers, and reveal durations.
          </span>
        </div>

      </div>

      {/* Background Images Customization (Desktop & Mobile) */}
      <div className="p-6 rounded-2xl bg-[#101015] border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
              Custom Background Backdrops (Desktop & Mobile)
            </h3>
            <p className="text-xs text-zinc-400">
              Upload custom anime studio artwork or wallpapers. Opacity slider controls the dark overlay.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Desktop Background */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                Desktop Background Image
              </label>
              {desktopBgImage && (
                <button
                  type="button"
                  onClick={() => setDesktopBgImage('')}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <div className="relative h-28 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center">
              {desktopBgImage ? (
                <img src={desktopBgImage} alt="Desktop BG" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-zinc-600">No desktop background set (using dark theme)</span>
              )}

              {uploadingDesktop && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-amber-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 font-semibold cursor-pointer border border-zinc-700 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Desktop Wallpaper</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadDesktopBg}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                value={desktopBgImage}
                onChange={(e) => setDesktopBgImage(e.target.value)}
                placeholder="Or paste image URL"
                className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>

          {/* Mobile Background */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                Mobile Background Image
              </label>
              {mobileBgImage && (
                <button
                  type="button"
                  onClick={() => setMobileBgImage('')}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <div className="relative h-28 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center">
              {mobileBgImage ? (
                <img src={mobileBgImage} alt="Mobile BG" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-zinc-600">No mobile background set</span>
              )}

              {uploadingMobile && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-amber-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 font-semibold cursor-pointer border border-zinc-700 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Mobile Wallpaper</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadMobileBg}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                value={mobileBgImage}
                onChange={(e) => setMobileBgImage(e.target.value)}
                placeholder="Or paste image URL"
                className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>

        </div>

        {/* Background Overlay Opacity Slider */}
        <div className="pt-3 border-t border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-semibold uppercase tracking-wider">
              Background Dark Overlay Opacity
            </span>
            <span className="text-amber-400 font-mono font-bold">
              {Math.round(bgOverlayOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="0.95"
            step="0.05"
            value={bgOverlayOpacity}
            onChange={(e) => setBgOverlayOpacity(parseFloat(e.target.value))}
            className="w-full h-2 bg-zinc-800 accent-amber-500 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Section Visibility Manager */}
      <div className="p-6 rounded-2xl bg-[#101015] border border-zinc-800 space-y-4">
        <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
          Section Visibility & Toggles
        </h3>
        <p className="text-xs text-zinc-400">
          Enable or disable specific sections from appearing on the public homepage.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {Object.entries(visibleSections).map(([key, val]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSection(key as any)}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                val
                  ? 'border-amber-500/40 bg-amber-950/20 text-white'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-500'
              }`}
            >
              <span className="text-xs font-semibold capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                val ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {val ? 'Visible' : 'Hidden'}
              </span>
            </button>
          ))}
        </div>
      </div>

    </form>
  );
};
