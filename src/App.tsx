
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';

import {
  fetchPublicData,
  fetchAdminData,
  adminCheckSession,
  PublicData,
  AdminAllData
} from './services/api.ts';

import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { AboutStudio } from './components/AboutStudio.tsx';
import { MembersSection } from './components/MembersSection.tsx';
import { OurWorksSection } from './components/OurWorksSection.tsx';
import { JoinUsSection } from './components/JoinUsSection.tsx';
import { SocialSection } from './components/SocialSection.tsx';
import { Footer } from './components/Footer.tsx';
import { LegalModal } from './components/LegalModals.tsx';
import { TrackApplicationModal } from './components/TrackApplicationModal.tsx';
import { AdminLoginModal } from './components/admin/AdminLoginModal.tsx';
import { AdminPortal } from './components/admin/AdminPortal.tsx';

import MemberRegister from './components/member/MemberRegister.tsx';
import MemberLogin from './components/member/MemberLogin.tsx';

import { Loader2 } from 'lucide-react';

// ============================================
// APP ROUTER
// ============================================

export default function App() {
  const path = window.location.pathname;

  if (path === '/member/register') {
    return <MemberRegister />;
  }

  if (path === '/member/login') {
    return <MemberLogin />;
  }

  return <StudioHomeApp />;
}

// ============================================
// MAIN STUDIO WEBSITE
// ============================================

function StudioHomeApp() {
  const [publicData, setPublicData] = useState<PublicData | null>(null);
  const [adminData, setAdminData] = useState<AdminAllData | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals & Navigation state
  const [activeSection, setActiveSection] = useState('hero');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [isTrackAppOpen, setIsTrackAppOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  const loadData = useCallback(async () => {
    try {
      const pub = await fetchPublicData();
      setPublicData(pub);

      const session = await adminCheckSession();

      if (session.authenticated) {
        setIsAdminLoggedIn(true);

        const adm = await fetchAdminData();
        setAdminData(adm);
      } else {
        setIsAdminLoggedIn(false);
      }
    } catch (err) {
      console.error('Failed to load initial studio data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdminLoginSuccess = async () => {
    setIsAdminLoggedIn(true);

    try {
      const adm = await fetchAdminData();

      setAdminData(adm);
      setIsAdminPortalOpen(true);

      await loadData();
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const handleAdminLogout = async () => {
    setIsAdminLoggedIn(false);
    setIsAdminPortalOpen(false);
    setAdminData(null);

    await loadData();
  };

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);

    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Loading screen
  if (loading || !publicData) {
    return (
      <div className="min-h-screen bg-[#08080a] flex flex-col items-center justify-center text-white">

        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-amber-500/40 bg-zinc-950 flex items-center justify-center p-2 mb-4 shadow-[0_0_30px_rgba(212,175,55,0.25)] animate-pulse">
          <span className="font-heading font-black text-amber-400 text-2xl">
            BB
          </span>
        </div>

        <div className="flex items-center gap-2 text-amber-300 font-heading text-sm tracking-widest uppercase">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Loading BlackBird Studio...</span>
        </div>

      </div>
    );
  }

  const {
    members,
    projects,
    socialLinks,
    settings,
    customization
  } = publicData;

  const visible = customization.visibleSections || {
    hero: true,
    story: true,
    members: true,
    projects: true,
    joinUs: true,
    social: true,
    contact: true
  };

  return (
    <div
      className="min-h-screen text-slate-100 relative selection:bg-[#d4af37] selection:text-black transition-colors duration-500"
      style={{
        backgroundColor: customization.bgColor || '#08080a',
        '--gold-primary': customization.accentColor || '#d4af37'
      } as React.CSSProperties}
    >

      {/* Navbar */}
      <Navbar
        settings={settings}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
        onOpenTrackApp={() => setIsTrackAppOpen(true)}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Main Sections */}
      <main>

        {visible.hero !== false && (
          <Hero
            customization={customization}
            settings={settings}
            memberCount={members.length}
            projectCount={projects.length}
            onNavigate={handleNavigate}
          />
        )}

        {visible.story !== false && (
          <AboutStudio
            settings={settings}
            onJoinClick={() => handleNavigate('join-us')}
          />
        )}

        {visible.members !== false && (
          <MembersSection
            members={members}
          />
        )}

        {visible.projects !== false && (
          <OurWorksSection
            projects={projects}
          />
        )}

        {visible.joinUs !== false && (
          <JoinUsSection
            onOpenTrackApp={() => setIsTrackAppOpen(true)}
          />
        )}

        {visible.social !== false && (
          <SocialSection
            socialLinks={socialLinks}
            settings={settings}
          />
        )}

      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        socialLinks={socialLinks}
        onNavigate={handleNavigate}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenLegal={(type) => setLegalModalType(type)}
      />

      {/* Admin Login */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Admin Dashboard */}
      {isAdminPortalOpen && adminData && (
        <AdminPortal
          data={adminData}
          onRefreshData={loadData}
          onClose={() => setIsAdminPortalOpen(false)}
          onLogout={handleAdminLogout}
        />
      )}

      {/* Application Tracking */}
      <TrackApplicationModal
        isOpen={isTrackAppOpen}
        onClose={() => setIsTrackAppOpen(false)}
      />

      {/* Legal Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

    </div>
  );
}
