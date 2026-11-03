import React, { useEffect, useState } from 'react';
import {
  fetchMemberAccounts,
  adminUpdateMemberAccountStatus,
  adminUpdateMemberAccountProfile,
  adminUpdateMemberAccountRank,
  adminDeleteMemberAccount,
  adminLinkMemberAccountToRoster
} from '../../../services/api';
import {
  OFFICIAL_RANKS,
  type MemberAccount,
  type MemberAccountStatus,
  type Rank,
  type Member
} from '../../../types';

interface Props {
  members: Member[];
  onRefreshData: () => Promise<void>;
}

export const MemberAccountsAdmin: React.FC<Props> = ({
  members,
  onRefreshData
}) => {
  const [accounts, setAccounts] = useState<MemberAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, string>>({});

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await fetchMemberAccounts();
      setAccounts(result.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const updateStatus = async (
    account: MemberAccount,
    status: MemberAccountStatus
  ) => {
    try {
      setBusy(account.id);
      await adminUpdateMemberAccountStatus(account.id, status);
      await loadAccounts();
      await onRefreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setBusy(null);
    }
  };

  const editProfile = async (account: MemberAccount) => {
    const fullName = prompt('Member name:', account.full_name);
    if (fullName === null) return;
    if (!fullName.trim()) {
      alert('Name cannot be empty.');
      return;
    }

    const avatarUrl = prompt('Profile picture URL:', account.profile?.avatarUrl || '');
    if (avatarUrl === null) return;

    const bio = prompt('About / Bio:', account.profile?.bio || '');
    if (bio === null) return;

    const hobbies = prompt('Hobbies:', account.profile?.hobbies || '');
    if (hobbies === null) return;

    const facebookLink = prompt('Facebook profile link:', account.profile?.facebookLink || '');
    if (facebookLink === null) return;

    try {
      setBusy(account.id);
      await adminUpdateMemberAccountProfile(account.id, {
        fullName: fullName.trim(),
        avatarUrl,
        bio,
        hobbies,
        facebookLink
      });
      await loadAccounts();
      await onRefreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Profile update failed.');
    } finally {
      setBusy(null);
    }
  };

  const changeRank = async (account: MemberAccount, rank: Rank) => {
    try {
      setBusy(account.id);
      await adminUpdateMemberAccountRank(account.id, rank);
      await loadAccounts();
      await onRefreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rank update failed.');
    } finally {
      setBusy(null);
    }
  };

  const linkMember = async (account: MemberAccount) => {
    const memberId = selectedMembers[account.id];

    if (!memberId) {
      alert('Please select an existing member first.');
      return;
    }

    const selectedMember = members.find(
      (member) => member.id === memberId
    );

    if (!selectedMember) {
      alert('Selected member was not found.');
      return;
    }

    if (!confirm(`Link ${account.full_name} with ${selectedMember.name}?`)) {
      return;
    }

    try {
      setBusy(account.id);

      await adminLinkMemberAccountToRoster(account.id, memberId);

      await loadAccounts();
      await onRefreshData();

      setSelectedMembers((previous) => ({
        ...previous,
        [account.id]: ''
      }));

      alert('Member account linked successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not link member account.');
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async (account: MemberAccount) => {
    if (!confirm(`Delete the account for ${account.full_name}?`)) return;

    try {
      setBusy(account.id);
      await adminDeleteMemberAccount(account.id);
      await loadAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusy(null);
    }
  };

  const statusColor: Record<MemberAccountStatus, string> = {
    pending: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    approved: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    rejected: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
    suspended: 'text-orange-300 bg-orange-500/10 border-orange-500/30'
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Member Accounts</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Review registrations and manage approved member profiles.
          </p>
        </div>

        <button
          onClick={() => void loadAccounts()}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-zinc-400 py-10 text-center">
          Loading member accounts...
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
          No member accounts found.
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <article
              key={account.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {account.profile?.avatarUrl ? (
                    <img
                      src={account.profile.avatarUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-amber-300 font-bold">
                      {account.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate">
                      {account.full_name}
                    </h3>
                    <p className="text-xs text-zinc-400 break-all">
                      {account.email}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Rank: {account.profile?.rank || 'D'}
                    </p>
                  </div>
                </div>

                <span className={`text-xs px-3 py-1 rounded-full border ${statusColor[account.status] || statusColor.pending}`}>
                  {account.status}
                </span>
              </div>

              {/* Link Existing Public Member */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-amber-300">
                    Link Existing Public Member
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Connect this account to an existing member in the public roster.
                  </p>
                </div>

                {account.linkedMemberId ? (
                  <div className="text-sm text-emerald-300">
                    <span className="font-semibold">Linked with:</span>{' '}
                    {account.linkedMemberName || 'Existing Member'}
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedMembers[account.id] || ''}
                      disabled={busy === account.id}
                      onChange={(event) =>
                        setSelectedMembers((previous) => ({
                          ...previous,
                          [account.id]: event.target.value
                        }))
                      }
                      className="w-full px-3 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
                    >
                      <option value="">Select an existing member</option>

                      {members
                        .filter((member) => !member.sourceMemberAccountId)
                        .map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} — Rank {member.rank}
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      disabled={
                        busy === account.id ||
                        !selectedMembers[account.id]
                      }
                      onClick={() => void linkMember(account)}
                      className="w-full px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm font-bold"
                    >
                      {busy === account.id ? 'Linking...' : 'Link Member'}
                    </button>
                  </>
                )}
              </div>

              {account.profile?.bio && (
                <p className="text-sm text-zinc-300">{account.profile.bio}</p>
              )}

              {account.profile?.hobbies && (
                <p className="text-xs text-zinc-400">
                  Hobbies: {account.profile.hobbies}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {account.status !== 'approved' && (
                  <button
                    disabled={busy === account.id}
                    onClick={() => void updateStatus(account, 'approved')}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold"
                  >
                    Approve
                  </button>
                )}

                {account.status !== 'rejected' && (
                  <button
                    disabled={busy === account.id}
                    onClick={() => void updateStatus(account, 'rejected')}
                    className="px-3 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 disabled:opacity-50 text-rose-300 text-xs font-semibold"
                  >
                    Reject
                  </button>
                )}

                {account.status !== 'suspended' && account.status === 'approved' && (
                  <button
                    disabled={busy === account.id}
                    onClick={() => void updateStatus(account, 'suspended')}
                    className="px-3 py-2 rounded-lg bg-orange-600/20 hover:bg-orange-600/40 disabled:opacity-50 text-orange-300 text-xs font-semibold"
                  >
                    Suspend
                  </button>
                )}

                <button
                  disabled={busy === account.id}
                  onClick={() => void editProfile(account)}
                  className="px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  Edit Profile
                </button>

                <select
                  value={account.profile?.rank || 'D'}
                  disabled={busy === account.id}
                  onChange={(event) => void changeRank(account, event.target.value as Rank)}
                  className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs"
                  aria-label={`Change rank for ${account.full_name}`}
                >
                  {OFFICIAL_RANKS.map((rank) => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>

                <button
                  disabled={busy === account.id}
                  onClick={() => void deleteAccount(account)}
                  className="px-3 py-2 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50 text-xs font-semibold"
                >
                  Delete Account
                </button>
              </div>

              {busy === account.id && (
                <p className="text-xs text-amber-300">Updating...</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
