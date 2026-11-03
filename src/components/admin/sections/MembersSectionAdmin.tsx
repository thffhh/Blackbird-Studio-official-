import React, { useState } from 'react';
import { Member, Rank, OFFICIAL_RANKS } from '../../../types/index.ts';
import { getRankBadgeStyle } from '../../../utils/ranks.ts';
import { uploadMedia } from '../../../services/api.ts';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Upload, 
  Calendar, 
  Search, 
  Loader2,
  Power
} from 'lucide-react';

interface MembersSectionAdminProps {
  members: Member[];
  onSaveMember: (member: Partial<Member>) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
}

export const MembersSectionAdmin: React.FC<MembersSectionAdminProps> = ({
  members,
  onSaveMember,
  onDeleteMember
}) => {
  const [search, setSearch] = useState('');
  const [filterRank, setFilterRank] = useState<string>('ALL');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [id, setId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [rank, setRank] = useState<Rank>('D');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [bio, setBio] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const filtered = members.filter((m) => {
    if (filterRank !== 'ALL' && m.rank !== filterRank) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.hobbies.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenAdd = () => {
    setId(undefined);
    setName('');
    setRank('D');
    setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80');
    setHobbies('');
    setBio('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setIsActive(true);
    setFormError('');
    setIsEditing(true);
  };

  const handleOpenEdit = (m: Member) => {
    setId(m.id);
    setName(m.name);
    setRank(m.rank);
    setAvatarUrl(m.avatarUrl);
    setHobbies(m.hobbies);
    setBio(m.bio);
    setJoiningDate(m.joiningDate);
    setIsActive(m.isActive);
    setFormError('');
    setIsEditing(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await uploadMedia(file);
      setAvatarUrl(res.url);
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Member name is required.');
      return;
    }
    if (!avatarUrl.trim()) {
      setFormError('Profile picture URL or upload is required.');
    }

    try {
      setLoading(true);
      await onSaveMember({
        id,
        name: name.trim(),
        rank,
        avatarUrl: avatarUrl.trim(),
        hobbies: hobbies.trim(),
        bio: bio.trim(),
        joiningDate,
        isActive
      });
      setIsEditing(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save member.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (m: Member) => {
    try {
      await onSaveMember({
        id: m.id,
        isActive: !m.isActive
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update member status.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-wider">
            Voice Artist Roster Management
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage public team profiles, ranks, bio information, and activation status.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or skills..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="ALL">All Ranks ({members.length})</option>
            {OFFICIAL_RANKS.map((r) => (
              <option key={r} value={r}>
                Rank {r} ({members.filter((m) => m.rank === r).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Table */}
      <div className="rounded-2xl bg-[#101015] border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Artist</th>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filtered.map((m) => {
                const rankStyle = getRankBadgeStyle(m.rank);
                return (
                  <tr key={m.id} className="hover:bg-zinc-900/40">
                    <td className="py-3 px-4 font-mono text-zinc-400 font-semibold">
                      #{m.displayOrder}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={m.avatarUrl}
                        alt={m.name}
                        className="w-9 h-9 rounded-full object-cover border border-amber-500/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{m.name}</div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-xs">{m.hobbies}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}>
                        Rank {m.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {m.joiningDate}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(m)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                          m.isActive
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}
                        title="Click to toggle public visibility"
                      >
                        <Power className="w-3 h-3" />
                        <span>{m.isActive ? 'Active (Live)' : 'Deactivated'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg bg-zinc-800 text-amber-300 hover:bg-amber-500 hover:text-black transition-colors cursor-pointer"
                        title="Edit member details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(m.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#121218] border border-rose-500/50 rounded-2xl p-6 text-center shadow-xl">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-heading font-bold text-white mb-2">Remove Member?</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Are you sure you want to delete this voice artist? This will permanently remove them from the studio roster.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteMember(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Member Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#0f0f14] border border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.25)] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <h3 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                {id ? 'Edit Voice Member' : 'Add New Voice Member'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="overflow-y-auto space-y-5 pr-2">
              
              {/* Picture Upload & Preview */}
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-zinc-900 shrink-0">
                  <img
                    src={avatarUrl}
                    alt={name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-amber-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 block">
                    Profile Picture Upload / Replace
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 font-semibold cursor-pointer border border-zinc-700 flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-zinc-500">or paste image URL below</span>
                  </div>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Name & Official Rank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                    Full Name / Stage Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Tanim Iqbal Sifat"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                    Official Rank (Strict 9 Ranks) *
                  </label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value as Rank)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {OFFICIAL_RANKS.map((r) => (
                      <option key={r} value={r}>
                        Rank {r} — {getRankBadgeStyle(r).description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Joining Date & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                    Joining Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/40"
                    />
                    <span className="text-xs text-zinc-200">
                      Active Member (Visible in Public Gallery)
                    </span>
                  </label>
                </div>
              </div>

              {/* Hobbies */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                  Hobbies & Voice Specialties
                </label>
                <input
                  type="text"
                  value={hobbies}
                  onChange={(e) => setHobbies(e.target.value)}
                  placeholder="e.g. Shonen battle cries, baritone voices, anime sound direction"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Biography */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                  Artist Biography
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Detailed artist biography, anime roles voiced, background..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Member Details</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
