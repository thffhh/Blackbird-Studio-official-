import React, { useState, useMemo } from 'react';
import { Member, Rank, OFFICIAL_RANKS } from '../types/index.ts';
import { getRankBadgeStyle } from '../utils/ranks.ts';
import { MemberModal } from './MemberModal.tsx';
import { Search, Users, ChevronRight, Mic } from 'lucide-react';

interface MembersSectionProps {
  members: Member[];
}

export const MembersSection: React.FC<MembersSectionProps> = ({ members }) => {
  const [selectedRank, setSelectedRank] = useState<Rank | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMemberModal, setActiveMemberModal] = useState<Member | null>(null);

  // Filter members while preserving the exact admin display order
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Must be active
      if (!member.isActive) return false;

      // Rank filter
      if (selectedRank !== 'ALL' && member.rank !== selectedRank) {
        return false;
      }

      // Search filter (name, hobbies, bio)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = member.name.toLowerCase().includes(query);
        const hobbiesMatch = member.hobbies.toLowerCase().includes(query);
        const bioMatch = member.bio.toLowerCase().includes(query);
        if (!nameMatch && !hobbiesMatch && !bioMatch) {
          return false;
        }
      }

      return true;
    });
  }, [members, selectedRank, searchQuery]);

  return (
    <section id="members" className="py-24 sm:py-32 bg-[#08080a] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Studio Roster</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tracking-wide uppercase mb-4">
            Our Voice Members
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-6" />
          <p className="text-zinc-300 text-base sm:text-lg font-light leading-relaxed">
            The talented vocalists, sound directors, and dubbing artists behind our acclaimed anime adaptations.
          </p>
        </div>

        {/* Search & Rank Filter Bar */}
        <div className="mb-12 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member by name or skill..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Count Indicator */}
            <div className="text-xs text-zinc-400 font-medium">
              Showing <span className="text-amber-300 font-semibold">{filteredMembers.length}</span> of {members.length} studio members
            </div>
          </div>

          {/* Rank Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedRank('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedRank === 'ALL'
                  ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              All Ranks ({members.length})
            </button>

            {OFFICIAL_RANKS.map((rank) => {
              const count = members.filter((m) => m.rank === rank).length;
              const isSelected = selectedRank === rank;
              const style = getRankBadgeStyle(rank);

              return (
                <button
                  key={rank}
                  onClick={() => setSelectedRank(rank)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `border-2 ${style.border} ${style.bg} ${style.text} shadow-sm`
                      : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <span>{rank}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Member Cards Grid */}
        {filteredMembers.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 p-8">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-heading font-semibold text-zinc-300 mb-1">
              No Voice Members Found
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Try adjusting your search query or selecting "All Ranks".
            </p>
            <button
              onClick={() => {
                setSelectedRank('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-lg bg-zinc-800 text-xs text-amber-300 font-semibold hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredMembers.map((member) => {
              const rankStyle = getRankBadgeStyle(member.rank);

              return (
                <div
                  key={member.id}
                  onClick={() => setActiveMemberModal(member)}
                  className="group relative rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-amber-500/50 p-5 transition-all duration-300 hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                >
                  {/* Top card info */}
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-amber-500/30 group-hover:border-amber-400 bg-zinc-950 shrink-0 shadow-md transition-colors">
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>

                      {/* Name & Rank */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}>
                            {member.rank}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-lg text-white group-hover:text-amber-300 transition-colors truncate">
                          {member.name}
                        </h3>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {member.hobbies || 'Voice Artist'}
                        </p>
                      </div>
                    </div>

                    {/* Short Bio snippet */}
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4 font-light">
                      {member.bio}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      Active Artist
                    </span>
                    <span className="text-amber-400 group-hover:text-amber-300 font-semibold flex items-center gap-1">
                      <span>View Profile</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Member Profile Modal */}
      <MemberModal
        member={activeMemberModal}
        onClose={() => setActiveMemberModal(null)}
      />
    </section>
  );
};
