import React, { useState } from 'react';
import { Application, Rank, OFFICIAL_RANKS } from '../../../types/index.ts';
import { getRankBadgeStyle } from '../../../utils/ranks.ts';
import { uploadMedia } from '../../../services/api.ts';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Edit3, 
  Search, 
  Upload, 
  X, 
  Check, 
  UserPlus, 
  MessageSquare,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface ApplicationsSectionAdminProps {
  applications: Application[];
  onApproveApplication: (id: string, notes?: string) => Promise<void>;
  onRejectApplication: (id: string, notes?: string) => Promise<void>;
  onUpdateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
}

export const ApplicationsSectionAdmin: React.FC<ApplicationsSectionAdminProps> = ({
  applications,
  onApproveApplication,
  onRejectApplication,
  onUpdateApplication
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Editable Form State
  const [editFullName, setEditFullName] = useState('');
  const [editDesiredRank, setEditDesiredRank] = useState<Rank>('D');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editHobbies, setEditHobbies] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editMotivation, setEditMotivation] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editAdditional, setEditAdditional] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');

  const filtered = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        app.fullName.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q) ||
        app.contactInfo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenEdit = (app: Application) => {
    setSelectedApp(app);
    setEditFullName(app.fullName);
    setEditDesiredRank(app.desiredRank);
    setEditAvatarUrl(app.avatarUrl);
    setEditHobbies(app.hobbies);
    setEditBio(app.bio);
    setEditMotivation(app.motivation);
    setEditExperience(app.dubbingExperience || '');
    setEditContact(app.contactInfo);
    setEditAdditional(app.additionalInfo || '');
    setEditAdminNotes(app.adminNotes || '');
    setIsEditing(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const res = await uploadMedia(file);
      setEditAvatarUrl(res.url);
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setLoading(true);
      await onUpdateApplication(selectedApp.id, {
        fullName: editFullName.trim(),
        desiredRank: editDesiredRank,
        avatarUrl: editAvatarUrl.trim(),
        hobbies: editHobbies.trim(),
        bio: editBio.trim(),
        motivation: editMotivation.trim(),
        dubbingExperience: editExperience.trim(),
        contactInfo: editContact.trim(),
        additionalInfo: editAdditional.trim(),
        adminNotes: editAdminNotes.trim()
      });
      setIsEditing(false);
      setSelectedApp(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update application');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (appId: string) => {
    const note = prompt('Optional private note for approval:', 'Approved after audition assessment.');
    try {
      await onApproveApplication(appId, note || undefined);
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleQuickReject = async (appId: string) => {
    const note = prompt('Optional private note for rejection:', 'Does not meet vocal criteria at this time.');
    try {
      await onRejectApplication(appId, note || undefined);
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-wider">
            Audition Applications Management
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Review incoming audition submissions. Approving automatically creates a public member profile at the bottom of the roster.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, or contact..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => {
            const count = st === 'all' ? applications.length : applications.filter((a) => a.status === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-2xl bg-[#101015] border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Desired Rank</th>
                <th className="py-3 px-4">Contact Link / Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-zinc-900/40">
                  <td className="py-3 px-4 font-mono font-bold text-amber-300 whitespace-nowrap">
                    {app.id}
                  </td>
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={app.avatarUrl}
                      alt={app.fullName}
                      className="w-9 h-9 rounded-full object-cover border border-amber-500/30 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-white">{app.fullName}</div>
                      <div className="text-[10px] text-zinc-400">{new Date(app.submittedAt).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-300 font-semibold">
                      Rank {app.desiredRank}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-400 truncate max-w-xs">
                    {app.contactInfo}
                  </td>
                  <td className="py-3 px-4">
                    {app.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold uppercase">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Approved
                      </span>
                    )}
                    {app.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/50 text-rose-300 text-[10px] font-bold uppercase">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        Rejected
                      </span>
                    )}
                    {app.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-950/60 border border-yellow-500/50 text-yellow-300 text-[10px] font-bold uppercase">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-zinc-400 text-[11px] truncate max-w-[140px]">
                    {app.adminNotes || '—'}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button
                      onClick={() => handleOpenEdit(app)}
                      className="px-2.5 py-1 rounded bg-zinc-800 text-amber-300 hover:bg-amber-500 hover:text-black font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Inspect & Edit all fields"
                    >
                      Inspect / Edit
                    </button>
                    {app.status !== 'approved' && (
                      <button
                        onClick={() => handleQuickApprove(app.id)}
                        className="px-2 py-1 rounded bg-emerald-950/60 text-emerald-300 hover:bg-emerald-600 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                        title="Approve to member"
                      >
                        Approve
                      </button>
                    )}
                    {app.status !== 'rejected' && (
                      <button
                        onClick={() => handleQuickReject(app.id)}
                        className="px-2 py-1 rounded bg-rose-950/60 text-rose-300 hover:bg-rose-600 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                        title="Reject application"
                      >
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect & Full Edit Application Modal */}
      {isEditing && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-[#0f0f14] border border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.25)] max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div>
                <span className="text-[11px] text-amber-400 uppercase font-mono font-bold">
                  {selectedApp.id}
                </span>
                <h3 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                  Review & Edit Application Details
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdits} className="overflow-y-auto space-y-5 pr-2">
              
              {/* Picture Upload / Replace */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-amber-500/40 bg-zinc-950 shrink-0">
                  <img
                    src={editAvatarUrl}
                    alt={editFullName}
                    className="w-full h-full object-cover"
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-amber-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 block">
                    Applicant Profile Picture (Replace/Upload)
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 font-semibold cursor-pointer border border-zinc-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="Avatar image URL"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>

              {/* Name & Desired Rank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                    Applicant Full Name
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                    Assigned / Desired Rank
                  </label>
                  <select
                    value={editDesiredRank}
                    onChange={(e) => setEditDesiredRank(e.target.value as Rank)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                  >
                    {OFFICIAL_RANKS.map((r) => (
                      <option key={r} value={r}>
                        Rank {r} — {getRankBadgeStyle(r).description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                  Contact Information (Facebook URL or Email)
                </label>
                <input
                  type="text"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
              </div>

              {/* Hobbies */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                  Hobbies & Creative Interests
                </label>
                <input
                  type="text"
                  value={editHobbies}
                  onChange={(e) => setEditHobbies(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                  Short Introduction / Bio
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white resize-none"
                />
              </div>

              {/* Motivation */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                  Why do you want to join BlackBird Studio?
                </label>
                <textarea
                  rows={2}
                  value={editMotivation}
                  onChange={(e) => setEditMotivation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white resize-none"
                />
              </div>

              {/* Dubbing Experience */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                  Dubbing Experience
                </label>
                <textarea
                  rows={2}
                  value={editExperience}
                  onChange={(e) => setEditExperience(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white resize-none"
                />
              </div>

              {/* Additional Info */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                  Additional Information
                </label>
                <input
                  type="text"
                  value={editAdditional}
                  onChange={(e) => setEditAdditional(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
              </div>

              {/* Private Admin Notes */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <label className="text-xs uppercase tracking-wider font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Private Administrator Notes (Not visible to applicant)</span>
                </label>
                <textarea
                  rows={2}
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="e.g. Audition completed on Discord, impressive voice modulation for villain characters..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white resize-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickApprove(selectedApp.id);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Approve to Members
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickReject(selectedApp.id);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Reject Application
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer flex items-center gap-1.5"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Application Changes</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
