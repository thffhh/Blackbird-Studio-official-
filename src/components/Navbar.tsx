import React, { useState } from 'react';
import { StudioSettings } from '../types/index.ts';
import {
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  Search,
  Compass,
  Users,
  Film,
  UserPlus,
  LogIn,
  Crown,
  UserCircle
} from 'lucide-react';

interface NavbarProps {
  settings: StudioSettings;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  onOpenAdminPortal: () => void;
  onOpenTrackApp: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;

  // Member account
  isMemberLoggedIn: boolean;
  memberName?: string;
  memberAvatar?: string;
  onOpenMemberProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onOpenAdminPortal,
  onOpenTrackApp,
  activeSection,
  onNavigate,
  isMemberLoggedIn,
  memberName = 'My Profile',
  memberAvatar = '',
  onOpenMemberProfile
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'hero', label: 'Home', icon: Compass },
    { id: 'members', label: 'Our Members', icon: Users },
    { id: 'projects', label: 'Our Works', icon: Film },
    { id: 'join-us', label: 'Join Us', icon: UserPlus }
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const goToMemberLogin = () => {
    window.location.href = '/member/login';
  };

  const goToMemberRegister = () => {
    window.location.href = '/member/register';
  };

  const handleOpenProfile = () => {
    setMobileMenuOpen(false);
    onOpenMemberProfile();
  };

  const renderProfileButton = (mobile = false) => (
    <button
      type="button"
      onClick={handleOpenProfile}
      className={`flex items-center gap-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 transition-all ${
        mobile
          ? 'w-full justify-center px-3 py-3 text-sm font-semibold'
          : 'px-3 py-2.5 text-xs font-semibold'
      }`}
    >
      {memberAvatar ? (
        <img
          src={memberAvatar}
          alt="Profile"
          className="w-7 h-7 rounded-full object-cover border border-amber-500/40"
        />
      ) : (
        <UserCircle className="w-5 h-5" />
      )}
      <span>{mobile ? 'My Profile' : memberName}</span>
    </button>
  );

  const renderMemberActions = (mobile = false) => {
    if (isMemberLoggedIn) {
      return renderProfileButton(mobile);
    }

    if (mobile) {
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              goToMemberLogin();
            }}
            className="w-full py-3 rounded-lg border border-amber-500/30 text-amber-200 font-semibold text-sm flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Member Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              goToMemberRegister();
            }}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(212,175,55,0.18)]"
          >
            <UserPlus className="w-4 h-4" />
            Create Member Account
          </button>
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={goToMemberLogin}
          className="px-3 py-2.5 rounded-lg border border-amber-500/30 text-amber-200 hover:text-white hover:border-amber-400 hover:bg-amber-500/10 transition-all text-xs font-semibold flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>Member Login</span>
        </button>

        <button
          type="button"
          onClick={goToMemberRegister}
          className="px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-bold text-xs shadow-[0_0_18px_rgba(212,175,55,0.2)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register</span>
        </button>
      </>
    );
  };

  return (
    <>
      {/* Announcement Bar */}
      {settings.isAnnouncementVisible && settings.announcementText && (
        <div className="bg-gradient-to-r from-amber-950/90 via-black to-amber-950/90 border-b border-amber-500/30 text-amber-200 text-xs sm:text-sm py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span>{settings.announcementText}</span>
          <button
            type="button"
            onClick={() => onNavigate('join-us')}
            className="underline underline-offset-2 ml-1 text-amber-300 hover:text-white font-semibold cursor-pointer"
          >
            Apply Now →
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-[#08080a]/95 backdrop-blur-xl border-b border-amber-500/15 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 flex items-center justify-between gap-3">

          {/* Logo */}
          <button
            type="button"
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-3 group cursor-pointer text-left shrink-0"
            aria-label="BlackBird Studio Home"
          >
            <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-amber-500/40 bg-zinc-950 flex items-center justify-center p-1 shadow-[0_0_15px_rgba(212,175,55,0.15)] group-hover:border-amber-400 transition-colors">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.studioName}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <span className="font-heading font-black text-amber-400 text-lg">
                  BB
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg sm:text-xl tracking-wider text-slate-100 group-hover:text-amber-300 transition-colors">
                  {settings.studioName.toUpperCase()}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 hidden sm:inline-block">
                  Bangla Dub
                </span>
              </div>
              <p className="text-xs text-zinc-400 tracking-wide font-bengali hidden sm:block">
                বাংলা এনিমে ডাবিং স্টুডিও
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-all cursor-pointer relative ${
                    isActive
                      ? 'text-amber-300 bg-amber-500/10'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/40'
                  }`}
                >
                  {item.label}

                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-400 to-amber-200 rounded-full" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onOpenTrackApp}
              className="px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer hover:bg-zinc-800/40"
              title="Check Application Status"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Status</span>
            </button>
          </nav>

          {/* Desktop Account Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {renderMemberActions(false)}

            {isAdminLoggedIn ? (
              <button
                type="button"
                onClick={onOpenAdminPortal}
                className="px-3 py-2.5 rounded-lg bg-zinc-900 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center gap-2 hover:bg-zinc-800"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="px-3 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-amber-300 hover:border-amber-500/40 transition-all text-xs font-semibold flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            {isMemberLoggedIn ? (
              <button
                type="button"
                onClick={handleOpenProfile}
                className="flex items-center gap-1.5 px-2 py-2 rounded-lg border border-amber-500/40 text-amber-300 text-xs"
              >
                {memberAvatar ? (
                  <img
                    src={memberAvatar}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-5 h-5" />
                )}
                Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={goToMemberLogin}
                className="p-2 rounded-lg border border-amber-500/30 text-amber-300"
                aria-label="Member Login"
                title="Member Login"
              >
                <LogIn className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-amber-500/15 border-b border-zinc-800 bg-[#0d0d12] px-4 pt-4 pb-5 space-y-2 animate-fadeIn">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrackApp();
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800/60 text-left"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>Track Application Status</span>
            </button>

            {/* Member Account Section */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-2">
              <div className="px-2 pb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-amber-500/70 font-bold">
                <Crown className="w-3.5 h-3.5" />
                Member Area
              </div>

              {renderMemberActions(true)}
            </div>

            {/* Admin Section */}
            <div className="pt-3 border-t border-zinc-800/80">
              {isAdminLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPortal();
                  }}
                  className="w-full py-3 rounded-lg bg-amber-500 text-black font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Dashboard
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminLogin();
                  }}
                  className="w-full py-3 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
