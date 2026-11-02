import React, { useState } from 'react';
import { SocialLink, SocialPlatform } from '../../../types/index.ts';
import { 
  Share2, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Check, 
  X, 
  ExternalLink,
  Facebook,
  Youtube,
  MessageSquare,
  Instagram,
  Video,
  Globe
} from 'lucide-react';

interface SocialLinksAdminProps {
  socialLinks: SocialLink[];
  onUpdateSocialLinks: (links: SocialLink[]) => Promise<void>;
}

export const SocialLinksAdmin: React.FC<SocialLinksAdminProps> = ({
  socialLinks,
  onUpdateSocialLinks
}) => {
  const [list, setList] = useState<SocialLink[]>(socialLinks);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<SocialPlatform>('facebook_page');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const PLATFORMS: { value: SocialPlatform; label: string }[] = [
    { value: 'facebook_page', label: 'Facebook Page' },
    { value: 'facebook_group', label: 'Facebook Group' },
    { value: 'facebook_profile', label: 'Facebook Profile' },
    { value: 'youtube', label: 'YouTube Channel' },
    { value: 'discord', label: 'Discord Server' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'custom', label: 'Custom External Link' },
  ];

  const handleOpenAdd = () => {
    setEditingId(null);
    setPlatform('facebook_page');
    setTitle('BlackBird Studio Official Facebook Page');
    setUrl('https://facebook.com/');
    setIsVisible(true);
    setIsEditing(true);
  };

  const handleOpenEdit = (link: SocialLink) => {
    setEditingId(link.id);
    setPlatform(link.platform);
    setTitle(link.title);
    setUrl(link.url);
    setIsVisible(link.isVisible);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    const updated = list.filter((l) => l.id !== id).map((l, idx) => ({ ...l, displayOrder: idx + 1 }));
    setList(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const copy = [...list];
    const [item] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, item);
    const reindexed = copy.map((l, idx) => ({ ...l, displayOrder: idx + 1 }));
    setList(reindexed);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    if (editingId) {
      setList((prev) =>
        prev.map((l) =>
          l.id === editingId
            ? { ...l, platform, title: title.trim(), url: url.trim(), isVisible }
            : l
        )
      );
    } else {
      const newLink: SocialLink = {
        id: 'bbs-soc-' + Date.now(),
        platform,
        title: title.trim(),
        url: url.trim(),
        isVisible,
        displayOrder: list.length + 1
      };
      setList([...list, newLink]);
    }
    setIsEditing(false);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await onUpdateSocialLinks(list);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-wider">
            Social Media & Official Studio Links
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Add, edit, reorder, and toggle visibility for Facebook, YouTube, Discord, TikTok, and external links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold text-xs uppercase tracking-wider border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Link</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Links Saved!' : 'Save Links Permanently'}</span>
          </button>
        </div>
      </div>

      {/* Social Links Table */}
      <div className="rounded-2xl bg-[#101015] border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Display Title</th>
                <th className="py-3 px-4">URL</th>
                <th className="py-3 px-4">Visibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {list.map((link, idx) => (
                <tr key={link.id} className="hover:bg-zinc-900/40">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-zinc-400 font-bold mr-1">#{link.displayOrder}</span>
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === list.length - 1}
                        className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-amber-300 capitalize">
                    {link.platform.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    {link.title}
                  </td>
                  <td className="py-3 px-4 text-zinc-400 truncate max-w-xs">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-amber-400 flex items-center gap-1"
                    >
                      <span className="truncate">{link.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        setList((prev) =>
                          prev.map((l) => (l.id === link.id ? { ...l, isVisible: !l.isVisible } : l))
                        );
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        link.isVisible
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {link.isVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleOpenEdit(link)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-amber-300 hover:bg-amber-500 hover:text-black transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Link Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0f0f14] border border-amber-500/50 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-lg font-heading font-bold text-white uppercase tracking-wider">
                {editingId ? 'Edit Social Link' : 'Add Social Link'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1 block">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1 block">
                  Custom Display Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. BlackBird Studio Official Facebook Page"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1 block">
                  Target Destination URL *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500"
                  />
                  <span className="text-xs text-zinc-200">Visible in Footer & Social Section</span>
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
