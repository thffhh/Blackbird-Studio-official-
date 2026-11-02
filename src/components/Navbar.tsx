import React, { useState } from 'react';
import { StudioSettings } from '../types/index.ts';
import { ShieldCheck, Menu, X, Sparkles, Search, Compass, Users, Film, UserPlus } from 'lucide-react';

interface NavbarProps {
  settings: StudioSettings;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  onOpenAdminPortal: () => void;
  onOpenTrackApp: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onOpenAdminPortal,
  onOpenTrackApp,
  activeSection,
  onNavigate
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'hero', label: 'Home', icon: Compass },
    { id: 'members', label: 'Our Members', icon: Users },
    { id: 'projects', label: 'Our Works', icon: Film },
    { id: 'join-us', label: 'Join Us', icon: UserPlus },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Announcement Bar if enabled */}
      {settings.isAnnouncementVisible && settings.announcementText && (
        <div className="bg-gradient-to-r from-amber-950/90 via-black to-amber-950/90 border-b border-amber-500/30 text-amber-200 text-xs sm:text-sm py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span>{settings.announcementText}</span>
          <button 
            onClick={() => onNavigate('join-us')}
            className="underline underline-offset-2 ml-1 text-amber-300 hover:text-white font-semibold cursor-pointer"
          >
            Apply Now &rarr;
          </button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#08080a]/90 backdrop-blur-md border-b border-amber-500/15 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Studio Name */}
          <button 
            onClick={() => handleNavClick('hero')} 
            className="flex items-center gap-3.5 group cursor-pointer text-left"
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
                <span className="font-heading font-black text-amber-400 text-lg">BB</span>
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

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium tracking-wide transition-all cursor-pointer relative ${
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

            {/* Application Tracker link */}
            <button
              onClick={onOpenTrackApp}
              className="px-3.5 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer hover:bg-zinc-800/40"
              title="Check your Application Status"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Status</span>
            </button>
          </nav>

          {/* Right Action: Admin Login or Portal */}
          <div className="hidden md:flex items-center gap-3">
            {isAdminLoggedIn ? (
              <button
                onClick={onOpenAdminPortal}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="px-3.5 py-2 rounded-md border border-amber-500/30 text-amber-300/80 hover:text-amber-200 hover:border-amber-400 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-amber-500/10 cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenTrackApp}
              className="p-2 text-zinc-400 hover:text-amber-300"
              aria-label="Track Application"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-800 bg-[#0d0d12] px-4 pt-3 pb-5 space-y-2 animate-fadeIn">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
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
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrackApp();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800/60 text-left"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>Track Application Status</span>
            </button>

            <div className="pt-3 border-t border-zinc-800/80">
              {isAdminLoggedIn ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPortal();
                  }}
                  className="w-full py-2.5 rounded-lg bg-amber-500 text-black font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminLogin();
                  }}
                  className="w-full py-2.5 rounded-lg border border-amber-500/40 text-amber-300 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Login</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
