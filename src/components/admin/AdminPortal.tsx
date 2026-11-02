import React, { useState } from 'react';
import { 
  AdminAllData, 
  adminSaveMember, 
  adminDeleteMember, 
  adminReorderMembers, 
  adminUpdateApplication,
  adminApproveApplication,
  adminRejectApplication,
  adminSaveProject,
  adminDeleteProject,
  adminReorderProjects,
  adminUpdateSettings,
  adminUpdateCustomization,
  adminUpdateSocialLinks,
  adminLogout
} from '../../services/api.ts';
import { OverviewSection } from './sections/OverviewSection.tsx';
import { MembersSectionAdmin } from './sections/MembersSectionAdmin.tsx';
import { ApplicationsSectionAdmin } from './sections/ApplicationsSectionAdmin.tsx';
import { MemberOrderSectionAdmin } from './sections/MemberOrderSectionAdmin.tsx';
import { StudioSettingsAdmin } from './sections/StudioSettingsAdmin.tsx';
import { WebsiteCustomizationAdmin } from './sections/WebsiteCustomizationAdmin.tsx';
import { WorksManagementAdmin } from './sections/WorksManagementAdmin.tsx';
import { SocialLinksAdmin } from './sections/SocialLinksAdmin.tsx';
import { ContentManagementAdmin } from './sections/ContentManagementAdmin.tsx';
import { AccountSettingsAdmin } from './sections/AccountSettingsAdmin.tsx';

import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  ArrowUpDown, 
  Building2, 
  Palette, 
  Film, 
  Share2, 
  FileText, 
  Settings, 
  LogOut, 
  Globe, 
  Menu, 
  X, 
  ShieldCheck 
} from 'lucide-react';

interface AdminPortalProps {
  data: AdminAllData;
  onRefreshData: () => Promise<void>;
  onClose: () => void;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  data,
  onRefreshData,
  onClose,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'members', label: 'Member Management', icon: Users, badge: data.stats.totalMembers },
    { id: 'applications', label: 'Application Management', icon: UserPlus, badge: data.stats.pendingApplications, badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
    { id: 'member-order', label: 'Manage Member Order', icon: ArrowUpDown },
    { id: 'studio-settings', label: 'Studio Settings', icon: Building2 },
    { id: 'customization', label: 'Website Customization', icon: Palette },
    { id: 'works', label: 'Our Works Management', icon: Film, badge: data.stats.totalProjects },
    { id: 'social-links', label: 'Social Media Links', icon: Share2 },
    { id: 'content', label: 'Website Content', icon: FileText },
    { id: 'account', label: 'Account Settings', icon: Settings },
  ];

  const handleLogoutClick = async () => {
    await adminLogout();
    onLogout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08080a] text-slate-100 flex flex-col md:flex-row overflow-hidden animate-fadeIn">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0d0d12] border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="font-heading font-black text-sm text-white uppercase tracking-wider">
            Admin Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-xs text-amber-300 font-semibold flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Site</span>
          </button>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300"
            aria-label="Toggle admin navigation menu"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#0c0c10] border-r border-zinc-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 font-heading font-bold shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              BB
            </div>
            <div>
              <div className="font-heading font-black text-white text-sm tracking-wider">
                BLACKBIRD STUDIO
              </div>
              <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                Admin Control Room
              </div>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 truncate mt-1">
            Logged in: <span className="text-zinc-300">Authenticated administrator</span>
          </div>
        </div>

        {/* 10 Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer group ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(212,175,55,0.15)] font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>

                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tab.badgeColor || 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-zinc-800/80 space-y-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>View Live Website</span>
          </button>

          <button
            onClick={handleLogoutClick}
            className="w-full py-2 px-3 rounded-xl text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#08080a] p-4 sm:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          
          {activeTab === 'overview' && (
            <OverviewSection
              data={data}
              onSelectTab={setActiveTab}
              onApproveApplication={async (id) => {
                await adminApproveApplication(id);
                await onRefreshData();
              }}
              onRejectApplication={async (id) => {
                await adminRejectApplication(id);
                await onRefreshData();
              }}
            />
          )}

          {activeTab === 'members' && (
            <MembersSectionAdmin
              members={data.members}
              onSaveMember={async (m) => {
                await adminSaveMember(m);
                await onRefreshData();
              }}
              onDeleteMember={async (id) => {
                await adminDeleteMember(id);
                await onRefreshData();
              }}
            />
          )}

          {activeTab === 'applications' && (
            <ApplicationsSectionAdmin
              applications={data.applications}
              onApproveApplication={async (id, notes) => {
                await adminApproveApplication(id, notes);
                await onRefreshData();
              }}
              onRejectApplication={async (id, notes) => {
                await adminRejectApplication(id, notes);
                await onRefreshData();
              }}
              onUpdateApplication={async (id, updates) => {
                await adminUpdateApplication(id, updates);
                await onRefreshData();
              }}
            />
          )}

          {activeTab === 'member-order' && (
            <MemberOrderSectionAdmin
              members={data.members}
              onSaveOrder={async (orderedIds) => {
                await adminReorderMembers(orderedIds);
                await onRefreshData();
              }}
            />
          )}

          {activeTab === 'studio-settings' && (
            <StudioSettingsAdmin
              settings={data.settings}
              onUpdateSettings={async (settings) => {
                await adminUpdateSettings(settings);
                await onRefreshData();
              }}
            />
          )}

          {activeTab === 'customization' && (
            <WebsiteCustomizationAdmin
              customization={data.customization}
              onUpdateCustomization={async (customization) => {
                await adminUpdateCustomization(customization);
                await onRefreshData();
              }}
            />
          )}

          {activeTab === 'works' && (
            <WorksManagementAdmin
              projects={data.projects}
              onSaveProject={async (project) => {
                await adminSaveProject(project);
                await onRefreshData();
              }}
              onDeleteProject={async (id) => {
                await adminDeleteProject(id);
                await onRefreshData();
              }}
              onReorderProjects={async (orderedIds) => {
                await adminReorderProjects(orderedIds);
                await onRefreshData();
              }}
            />
          )}

          {activeTab === 'social-links' && (
            <SocialLinksAdmin
              socialLinks={data.socialLinks}
              onUpdateSocialLinks={async (links) => {
                await adminUpdateSocialLinks(links);
                await onRefreshData();
              }}
            />
          )}

          {activeTab === 'content' && (
            <ContentManagementAdmin
              customization={data.customization}
              settings={data.settings}
              onUpdateCustomization={async (c) => {
                await adminUpdateCustomization(c);
                await onRefreshData();
              }}
              onUpdateSettings={async (s) => {
                await adminUpdateSettings(s);
                await onRefreshData();
              }}
            />
          )}

          {activeTab === 'account' && (
            <AccountSettingsAdmin
              supabaseConfig={data.supabaseConfig}
              onRefreshData={onRefreshData}
            />
          )}

        </div>
      </main>

    </div>
  );
};
