import React from 'react';
import { AdminAllData } from '../../../services/api.ts';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Film, 
  Eye, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

interface OverviewSectionProps {
  data: AdminAllData;
  onSelectTab: (tabId: string) => void;
  onApproveApplication: (id: string) => void;
  onRejectApplication: (id: string) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  data,
  onSelectTab,
  onApproveApplication,
  onRejectApplication
}) => {
  const { stats, applications } = data;
  const recentPending = applications.filter((a) => a.status === 'pending').slice(0, 5);

  const kpis = [
    {
      label: 'Total Members',
      value: stats.totalMembers,
      sub: `${stats.activeMembers} currently active`,
      icon: Users,
      color: 'text-amber-400',
      tab: 'members'
    },
    {
      label: 'Pending Auditions',
      value: stats.pendingApplications,
      sub: 'Awaiting admin review',
      icon: Clock,
      color: 'text-yellow-400',
      tab: 'applications',
      highlight: stats.pendingApplications > 0
    },
    {
      label: 'Approved Applications',
      value: stats.approvedApplications,
      sub: 'Converted to members',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      tab: 'applications'
    },
    {
      label: 'Rejected Applications',
      value: stats.rejectedApplications,
      sub: 'Declined submissions',
      icon: XCircle,
      color: 'text-rose-400',
      tab: 'applications'
    },
    {
      label: 'Total Dub Projects',
      value: stats.totalProjects,
      sub: 'In studio catalog',
      icon: Film,
      color: 'text-cyan-400',
      tab: 'works'
    },
    {
      label: 'Published Releases',
      value: stats.publishedProjects,
      sub: 'Live on public website',
      icon: Eye,
      color: 'text-purple-400',
      tab: 'works'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-[#121218] border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-400 font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>BlackBird Studio Command Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
            Studio Dashboard Overview
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl font-light">
            Manage your official voice artists roster, review incoming dub audition applications, control project releases, and customize the live website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('members')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
          <button
            onClick={() => onSelectTab('customization')}
            className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:border-amber-500/50 text-zinc-200 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer"
          >
            Customize UI
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectTab(kpi.tab)}
              className={`p-5 rounded-2xl bg-[#101015] border transition-all cursor-pointer hover:border-amber-500/60 hover:-translate-y-0.5 group ${
                kpi.highlight ? 'border-amber-500/50 bg-amber-950/10' : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400 group-hover:text-zinc-200">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-heading font-black text-white mb-1">
                {kpi.value}
              </div>
              <div className="text-[11px] text-zinc-400">
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Applications Quick Action Section */}
      <div className="p-6 rounded-2xl bg-[#101015] border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-heading font-bold text-white uppercase tracking-wider">
              Pending Audition Applications
            </h3>
            <p className="text-xs text-zinc-400">
              New candidates waiting for voice director review
            </p>
          </div>
          <button
            onClick={() => onSelectTab('applications')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({stats.pendingApplications})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentPending.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            <span>All audition applications have been reviewed!</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Applicant</th>
                  <th className="py-3 px-4">Desired Rank</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Direct Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {recentPending.map((app) => (
                  <tr key={app.id} className="hover:bg-zinc-900/40">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-3">
                      <img
                        src={app.avatarUrl}
                        alt={app.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-amber-500/30"
                      />
                      <div>
                        <div>{app.fullName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{app.id}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-300 font-semibold">
                        Rank {app.desiredRank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 truncate max-w-xs">
                      {app.contactInfo}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => onApproveApplication(app.id)}
                        className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500 hover:text-black font-semibold text-[11px] uppercase transition-colors cursor-pointer"
                        title="Approve and add to member roster"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onRejectApplication(app.id)}
                        className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-500 hover:text-black font-semibold text-[11px] uppercase transition-colors cursor-pointer"
                        title="Decline application"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
