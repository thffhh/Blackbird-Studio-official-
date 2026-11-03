import React, { useEffect, useState } from 'react';
import {
  fetchMemberSession,
  updateMemberProfile,
  memberLogout,
  type MemberSessionUser
} from '../../services/api';
import { Loader2, LogOut, Save, UserCircle, ExternalLink } from 'lucide-react';

export default function MemberDashboard() {
  const [user, setUser] = useState<MemberSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    avatarUrl: '',
    bio: '',
    hobbies: '',
    facebookLink: ''
  });

  useEffect(() => {
    let active = true;

    fetchMemberSession()
      .then((result) => {
        if (!active) return;

        if (!result.authenticated || !result.user) {
          window.location.replace('/member/login');
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
      })
      .catch(() => {
        if (active) window.location.replace('/member/login');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const change = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
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

      const refreshed = await fetchMemberSession();

      setUser(refreshed.user);
      setForm({
        fullName: refreshed.user.fullName || '',
        avatarUrl: refreshed.user.profile?.avatarUrl || '',
        bio: refreshed.user.profile?.bio || '',
        hobbies: refreshed.user.profile?.hobbies || '',
        facebookLink: refreshed.user.profile?.facebookLink || ''
      });

      setMessage(result.message || 'Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await memberLogout();
    } finally {
      window.location.replace('/member/login');
    }
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-[#08080a] flex items-center justify-center text-amber-300">
        <Loader2 className="animate-spin mr-2" />
        Loading member profile...
      </main>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-amber-400';

  return (
    <main className="min-h-screen bg-[#08080a] text-white px-4 py-8 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-amber-400">
              BlackBird Studio
            </p>
            <h1 className="text-3xl font-black mt-2">Member Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage your member profile and information.
            </p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
          >
            <LogOut size={16} /> Logout
          </button>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-4">
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt="Member avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-amber-400"
              />
            ) : (
              <UserCircle className="w-20 h-20 text-zinc-600" />
            )}

            <div>
              <h2 className="text-xl font-bold">{user.fullName}</h2>
              <p className="text-sm text-zinc-400">{user.email}</p>
              <p className="text-sm text-amber-300 mt-1">
                Rank: {user.profile?.rank || 'D'}
              </p>
              <p className="text-xs text-emerald-400 mt-1">
                Approved Member
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={saveProfile}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-7 space-y-5"
        >
          <div>
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Your rank and account email are controlled separately.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-300">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-300">
              {message}
            </p>
          )}

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Full Name</span>
            <input
              className={inputClass}
              value={form.fullName}
              onChange={(e) => change('fullName', e.target.value)}
              minLength={2}
              maxLength={120}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Avatar Image URL (HTTPS)</span>
            <input
              className={inputClass}
              type="url"
              value={form.avatarUrl}
              onChange={(e) => change('avatarUrl', e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Bio / About Me</span>
            <textarea
              className={inputClass}
              rows={4}
              maxLength={5000}
              value={form.bio}
              onChange={(e) => change('bio', e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Hobbies & Specialties</span>
            <textarea
              className={inputClass}
              rows={3}
              maxLength={5000}
              value={form.hobbies}
              onChange={(e) => change('hobbies', e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Facebook Profile URL</span>
            <input
              className={inputClass}
              type="url"
              value={form.facebookLink}
              onChange={(e) => change('facebookLink', e.target.value)}
              placeholder="https://www.facebook.com/your-profile"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-5">
            <span className="text-xs text-zinc-500">
              Rank: {user.profile?.rank || 'D'} (Admin managed)
            </span>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-black hover:bg-amber-300 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          {form.facebookLink && (
            <a
              href={form.facebookLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-amber-300 hover:underline"
            >
              View Facebook Profile <ExternalLink size={14} />
            </a>
          )}
        </form>
      </div>
    </main>
  );
}
