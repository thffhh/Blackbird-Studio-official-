import React, { useState } from 'react';
import { StudioSettings } from '../../../types/index.ts';
import { uploadMedia } from '../../../services/api.ts';
import { 
  Building2, 
  Upload, 
  Trash2, 
  Save, 
  Check, 
  Sparkles, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface StudioSettingsAdminProps {
  settings: StudioSettings;
  onUpdateSettings: (settings: Partial<StudioSettings>) => Promise<void>;
}

export const StudioSettingsAdmin: React.FC<StudioSettingsAdminProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [studioName, setStudioName] = useState(settings.studioName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [groupPictureUrl, setGroupPictureUrl] = useState(settings.groupPictureUrl);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [announcementText, setAnnouncementText] = useState(settings.announcementText);
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(settings.isAnnouncementVisible);
  const [foundedYear, setFoundedYear] = useState(settings.foundedYear);

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingGroup, setUploadingGroup] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const res = await uploadMedia(file);
      setLogoUrl(res.url);
    } catch (err: any) {
      alert(err.message || 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadGroupPic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingGroup(true);
      const res = await uploadMedia(file);
      setGroupPictureUrl(res.url);
    } catch (err: any) {
      alert(err.message || 'Group photo upload failed');
    } finally {
      setUploadingGroup(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onUpdateSettings({
        studioName: studioName.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim(),
        groupPictureUrl: groupPictureUrl.trim(),
        contactEmail: contactEmail.trim(),
        announcementText: announcementText.trim(),
        isAnnouncementVisible,
        foundedYear: foundedYear.trim()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update studio settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-wider">
            Studio Identity & Visual Assets
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure official studio branding, crest logo, cast group picture, and audition announcement bar.
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
          <span>{saveSuccess ? 'Changes Saved!' : 'Save Studio Settings'}</span>
        </button>
      </div>

      {/* Visual Assets: Logo & Group Photo Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Studio Logo Upload / Replace / Remove */}
        <div className="p-6 rounded-2xl bg-[#101015] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider font-bold text-amber-300 block">
              Official Studio Logo
            </label>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-zinc-950 flex items-center justify-center p-2 shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Studio Logo Preview" className="w-full h-full object-contain" />
              ) : (
                <span className="font-heading font-black text-amber-500 text-2xl">BB</span>
              )}

              {uploadingLogo && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-amber-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 font-semibold cursor-pointer border border-zinc-700">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo (PNG/SVG/JPG)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadLogo}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Or paste image URL"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Group Cast Photo Upload / Replace / Remove */}
        <div className="p-6 rounded-2xl bg-[#101015] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider font-bold text-amber-300 block">
              Official Group / Cast Photo
            </label>
            {groupPictureUrl && (
              <button
                type="button"
                onClick={() => setGroupPictureUrl('')}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-36 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-zinc-950 flex items-center justify-center shrink-0">
              {groupPictureUrl ? (
                <img src={groupPictureUrl} alt="Group Picture Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-zinc-600 text-xs">No Photo</span>
              )}

              {uploadingGroup && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-amber-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 font-semibold cursor-pointer border border-zinc-700">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Cast Banner</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadGroupPic}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                value={groupPictureUrl}
                onChange={(e) => setGroupPictureUrl(e.target.value)}
                placeholder="Or paste image URL"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Basic Studio Info Fields */}
      <div className="p-6 rounded-2xl bg-[#101015] border border-zinc-800 space-y-5">
        <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider mb-2">
          Studio Details & Contact
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
              Studio Official Name
            </label>
            <input
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
              Studio Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
              Official Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
              Founded Year
            </label>
            <input
              type="text"
              value={foundedYear}
              onChange={(e) => setFoundedYear(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Announcement Bar Toggle & Text */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
              Live Announcement Ticker Bar (Top of Website)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncementVisible}
                onChange={(e) => setIsAnnouncementVisible(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/40"
              />
              <span className="text-xs text-amber-300 font-semibold">Enable Bar</span>
            </label>
          </div>

          <input
            type="text"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="e.g. Auditions for Spring 2026 Season are now officially open!"
            className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

    </form>
  );
};
