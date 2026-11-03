import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  X,
  Search,
  RefreshCw,
  UserRound,
  AlertCircle,
  Save
} from 'lucide-react';

import {
  fetchMemberAccounts,
  adminUpdateMemberAccountStatus,
  adminUpdateMemberAccountProfile,
  adminUpdateMemberAccountRank
} from '../../../services/api.ts';

import {
  OFFICIAL_RANKS
} from '../../../types/index.ts';

import type {
  MemberAccount,
  MemberAccountStatus,
  Rank
} from '../../../types/index.ts';

interface Props {
  onRefreshData: () => Promise<void>;
}

type FilterStatus = 'all' | MemberAccountStatus;

const statusLabels: Record<MemberAccountStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended'
};

export const MemberAccountsAdmin: React.FC<Props> = ({
  onRefreshData
}) => {
  const [accounts, setAccounts] = useState<MemberAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selected, setSelected] = useState<MemberAccount | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [draft, setDraft] = useState({
    fullName: '',
    avatarUrl: '',
    bio: '',
    hobbies: '',
    facebookLink: '',
    rank: 'D' as Rank
  });

  const loadAccounts = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await fetchMemberAccounts();
      setAccounts(result.accounts || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load member accounts.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const counts = useMemo(() => ({
    all: accounts.length,
    pending: accounts.filter(a => a.status === 'pending').length,
    approved: accounts.filter(a => a.status === 'approved').length,
    rejected: accounts.filter(a => a.status === 'rejected').length,
    suspended: accounts.filter(a => a.status === 'suspended').length
  }), [accounts]);

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return accounts.filter(account => {
      const matchesStatus =
        filter === 'all' || account.status === filter;

      const matchesSearch =
        !term ||
        account.full_name.toLowerCase().includes(term) ||
        account.email.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [accounts, filter, search]);

  const openEditor = (account: MemberAccount) => {
    setSelected(account);

    setDraft({
      fullName: account.full_name || '',
      avatarUrl: account.profile?.avatarUrl || '',
      bio: account.profile?.bio || '',
      hobbies: account.profile?.hobbies || '',
      facebookLink: account.profile?.facebookLink || '',
      rank: account.profile?.rank || 'D'
    });
  };

  const changeStatus = async (
    account: MemberAccount,
    status: MemberAccountStatus
  ) => {
    const confirmation = window.confirm(
      `Are you sure you want to change ${account.full_name} to ${statusLabels[status]}?`
    );

    if (!confirmation) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      await adminUpdateMemberAccountStatus(
        account.id,
        status,
        ''
      );

      await loadAccounts();
      await onRefreshData();

      setNotice('Member account status updated.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Status update failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async () => {
    if (!selected) return;

    if (draft.fullName.trim().length < 2) {
      setError('Name must contain at least 2 characters.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    try {
      await adminUpdateMemberAccountProfile(
        selected.id,
        {
          fullName: draft.fullName.trim(),
          avatarUrl: draft.avatarUrl.trim(),
          bio: draft.bio.trim(),
          hobbies: draft.hobbies.trim(),
          facebookLink: draft.facebookLink.trim()
        }
      );

      await adminUpdateMemberAccountRank(
        selected.id,
        draft.rank
      );

      setSelected(null);

      await loadAccounts();
      await onRefreshData();

      setNotice('Member profile and rank updated.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Profile update failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6">

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-400">
            BlackBird Studio
          </p>

          <h2 className="text-3xl font-bold text-white">
            Member Accounts
          </h2>

          <p className="text-sm text-zinc-400 mt-2">
            Manage registrations, approvals and member profiles.
          </p>
        </div>

        <button
          onClick={() => void loadAccounts()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-white"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(key => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-xl border p-4 text-left ${
              filter === key
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <p className="text-xs uppercase text-zinc-400">
              {key}
            </p>

            <p className="text-2xl font-bold text-white mt-1">
              {counts[key]}
            </p>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-300 flex gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-300">
          {notice}
        </div>
      )}

      <div className="relative">
        <Search
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 pl-10 text-white"
        />
      </div>

      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-zinc-400">
            Loading accounts...
          </p>
        ) : filteredAccounts.length === 0 ? (
          <p className="p-8 text-center text-zinc-400">
            No accounts found.
          </p>
        ) : (
          filteredAccounts.map(account => (
            <article
              key={account.id}
              className="border-b border-zinc-800 last:border-0 p-4 flex flex-col lg:flex-row lg:items-center gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
                  {account.profile?.avatarUrl ? (
                    <img
                      src={account.profile.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserRound className="text-zinc-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {account.full_name}
                  </p>

                  <p className="text-xs text-zinc-400 break-all">
                    {account.email}
                  </p>

                  <p className="text-xs text-zinc-500 mt-1">
                    Rank: {account.profile?.rank || 'D'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                  {statusLabels[account.status]}
                </span>

                <button
                  onClick={() => openEditor(account)}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-white"
                >
                  Edit Profile
                </button>

                {account.status !== 'approved' && (
                  <button
                    disabled={busy}
                    onClick={() => void changeStatus(account, 'approved')}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white disabled:opacity-50"
                  >
                    <Check size={13} className="inline mr-1" />
                    Approve
                  </button>
                )}

                {account.status !== 'rejected' && (
                  <button
                    disabled={busy}
                    onClick={() => void changeStatus(account, 'rejected')}
                    className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-300 disabled:opacity-50"
                  >
                    <X size={13} className="inline mr-1" />
                    Reject
                  </button>
                )}

                {account.status === 'approved' && (
                  <button
                    disabled={busy}
                    onClick={() => void changeStatus(account, 'suspended')}
                    className="rounded-lg border border-orange-500/40 px-3 py-2 text-xs text-orange-300 disabled:opacity-50"
                  >
                    Suspend
                  </button>
                )}

                {account.status === 'suspended' && (
                  <button
                    disabled={busy}
                    onClick={() => void changeStatus(account, 'approved')}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white disabled:opacity-50"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/80 p-4 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-[#111116] p-6 space-y-4">

            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                Edit Member Profile
              </h3>

              <button onClick={() => setSelected(null)}>
                <X className="text-zinc-400" />
              </button>
            </div>

            {([
              ['fullName', 'Full Name'],
              ['avatarUrl', 'Profile Picture URL'],
              ['bio', 'About / Bio'],
              ['hobbies', 'Hobbies'],
              ['facebookLink', 'Facebook Profile Link']
            ] as const).map(([key, label]) => (
              <label key={key} className="block text-sm text-zinc-400">
                {label}

                {key === 'bio' ? (
                  <textarea
                    value={draft[key]}
                    onChange={e => setDraft({...draft, [key]: e.target.value})}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-black p-3 text-white"
                  />
                ) : (
                  <input
                    value={draft[key]}
                    onChange={e => setDraft({...draft, [key]: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-black p-3 text-white"
                  />
                )}
              </label>
            ))}

            <label className="block text-sm text-zinc-400">
              Official Rank

              <select
                value={draft.rank}
                onChange={e => setDraft({...draft, rank: e.target.value as Rank})}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-black p-3 text-white"
              >
                {OFFICIAL_RANKS.map(rank => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-300"
              >
                Cancel
              </button>

              <button
                disabled={busy}
                onClick={() => void saveProfile()}
                className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-black disabled:opacity-50"
              >
                <Save size={15} className="inline mr-1" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
