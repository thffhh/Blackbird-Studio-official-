
import React, { useEffect, useState } from 'react';
import {
  fetchMemberSession,
  updateMemberProfile,
  memberLogout,
  uploadMedia,
  type MemberSessionUser
} from '../../services/api.ts';
import {
  X, LogOut, Save, UserCircle, Camera, Loader2,
  ExternalLink, ShieldCheck
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function MemberDashboard({ onClose }: Props) {
  const [user, setUser] = useState<MemberSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    avatarUrl: '',
    bio: '',
    hobbies: '',
    facebookLink: ''
  });

  const loadProfile = async () => {
    const result = await fetchMemberSession();

    if (!result.authenticated || !result.user) {
      window.location.href = '/member/login';
      return;
    }

    setUser(result.user);
    setForm({
      fullName: result.user.fullName || '',
      avatarUrl: result.user.profile?.avatarUrl || '',
      bio: result.user.profile?.bio || '',
      hobbies: result.user.profile?.hobbies || '',
      facebookLink: result.user.profile?.facebookLink || ''
    });
  };

  useEffect(() => {
    loadProfile()
      .catch(() => setError('Could not load your member profile.'))
      .finally(() => setLoading(false));
  }, []);

  const change = (field: keyof typeof form, value: string) => {
    setForm(old => ({ ...old, [field]: value }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a JPG, PNG or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be 5 MB or less.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setMessage('');

      const result = await uploadMedia(file);
      if (!result.success || !result.url) {
        throw new Error('Image upload failed.');
      }

      change('avatarUrl', result.url);
      setMessage('Photo uploaded. Save your profile to apply it.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const result = await updateMemberProfile({
        fullName: form.fullName,
        avatarUrl: form.avatarUrl,
        bio: form.bio,
        hobbies: form.hobbies,
        facebookLink: form.facebookLink
      });

      await loadProfile();
      setMessage(result.message || 'Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      await memberLogout();
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center text-amber-300">
        <Loader2 className="animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

  if (!user) return null;

  const inputClass =
    'w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-amber-400';

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-6">
      <div className="max-w-2xl mx-auto my-4 rounded-2xl border border-amber-500/20 bg-[#101014] text-white shadow-2xl">

        <header className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
              BlackBird Studio
            </p>
            <h2 className="text-2xl font-black mt-1">My Profile</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800"
            aria-label="Close profile"
          >
            <X />
          </button>
        </header>

        <div className="p-5 sm:p-7 space-y-6">

          <div className="flex flex-wrap items-center gap-4">
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-amber-400"
              />
            ) : (
              <UserCircle className="w-24 h-24 text-zinc-600" />
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold">{user.fullName}</h3>
              <p className="text-sm text-zinc-400 break-all">{user.email}</p>
              <p className="text-sm text-amber-300 mt-1">
                Rank: {user.profile?.rank || 'D'}
              </p>
              <p className="text-xs text-emerald-400 mt-1">
                <ShieldCheck className="inline w-3.5 h-3.5 mr-1" />
                Approved Member
              </p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-5">

            <div>
              <label className="block text-sm text-zinc-300 mb-2">
                Profile Photo
              </label>

              <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 cursor-pointer text-sm">
                {uploading
                  ? <Loader2 className="animate-spin" size={17} />
                  : <Camera size={17} />}
                {uploading ? 'Uploading...' : 'Choose from Gallery'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleImageUpload}
                />
              </label>
              <p className="text-xs text-zinc-500 mt-2">
                JPG, PNG or WEBP · Maximum 5 MB
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">Full Name</span>
              <input
                className={inputClass}
                value={form.fullName}
                onChange={e => change('fullName', e.target.value)}
                minLength={2}
                maxLength={120}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">Bio / About Me</span>
              <textarea
                className={inputClass}
                rows={4}
                maxLength={5000}
                value={form.bio}
                onChange={e => change('bio', e.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">Hobbies & Specialties</span>
              <textarea
                className={inputClass}
                rows={3}
                maxLength={5000}
                value={form.hobbies}
                onChange={e => change('hobbies', e.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">Facebook Profile Link</span>
              <input
                className={inputClass}
                type="url"
                value={form.facebookLink}
                onChange={e => change('facebookLink', e.target.value)}
                placeholder="https://www.facebook.com/..."
              />
            </label>

            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-sm text-zinc-400">
              Your rank is managed by the BlackBird Studio Admin.
              <strong className="block text-amber-300 mt-1">
                Current Rank: {user.profile?.rank || 'D'}
              </strong>
            </div>

            {error && (
              <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                {error}
              </p>
            )}

            {message && (
              <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving
                ? <Loader2 className="animate-spin" size={18} />
                : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          {form.facebookLink && (
            <a
              href={form.facebookLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-amber-300"
            >
              View Facebook Profile <ExternalLink size={14} />
            </a>
          )}

          <button
            onClick={logout}
            className="w-full border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 rounded-xl py-3 flex items-center justify-center gap-2"
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
