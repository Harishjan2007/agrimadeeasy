'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sprout,
  TrendingUp,
  Store,
  ShoppingBag,
  Tractor,
  Landmark,
  User,
  Menu,
  X,
  ArrowRight,
  LogOut,
  CalendarCheck,
  LayoutDashboard,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/lib/supabase/useAuth';
import { UserRole } from '@/types';
import { useLanguage } from '@/i18n';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, isConfigured, signOut } = useAuth();
  const { language, setLanguage, translations, translateRole } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const activeRole: UserRole = role || 'farmer';
  const isSignedIn = isConfigured ? Boolean(user) : false;

  // Desktop Center Navigation Links (Home + 7 core modules)
  const getNavLinks = () => {
    if (isSignedIn && activeRole === 'dealer') {
      return [
        { href: '/', label: translations.nav.home, icon: Sprout },
        { href: '/map', label: translations.nav.map, icon: MapPin },
        { href: '/dealer', label: translations.nav.dealerPortal, icon: LayoutDashboard },
        { href: '/ecommerce', label: translations.nav.ecommerce, icon: ShoppingBag },
        { href: '/dealers', label: translations.nav.mandiDirectory, icon: Store },
      ];
    }

    if (isSignedIn && activeRole === 'machinery_provider') {
      return [
        { href: '/', label: translations.nav.home, icon: Sprout },
        { href: '/map', label: translations.nav.map, icon: MapPin },
        { href: '/machinery-provider', label: translations.nav.machineryHostPortal, icon: LayoutDashboard },
        { href: '/machinery', label: translations.nav.fleetCatalog, icon: Tractor },
      ];
    }

    // Default farmer & guest links: Home + 7 core modules
    return [
      { href: '/', label: translations.nav.home, icon: Sprout },
      { href: '/map', label: translations.nav.map, icon: MapPin },
      { href: '/crop-price', label: translations.nav.cropPrices, icon: TrendingUp },
      { href: '/prediction', label: translations.nav.predictions, icon: TrendingUp },
      { href: '/dealers', label: translations.nav.dealers, icon: Store },
      { href: '/ecommerce', label: translations.nav.ecommerce, icon: ShoppingBag },
      { href: '/machinery', label: translations.nav.machinery, icon: Tractor },
      { href: '/schemes', label: translations.nav.schemes, icon: Landmark },
      { href: '/bookings', label: translations.nav.myBookings, icon: CalendarCheck },
    ];
  };

  // Full links for mobile drawer menu (including Profile)
  const getMobileNavLinks = () => {
    const main = getNavLinks();
    return [
      ...main,
      { href: '/profile', label: translations.nav.profile, icon: User },
    ];
  };

  const navLinks = getNavLinks();
  const mobileNavLinks = getMobileNavLinks();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      {/* Top micro-bar: announcement on left, portal shortcuts + compact Language Switcher on right */}
      <div className="bg-agri-900 text-white text-xs py-1.5 px-3 sm:px-4 overflow-hidden">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2">
          {/* Announcement */}
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-agri-400 animate-pulse shrink-0"></span>
            <span className="font-medium text-agri-100 truncate text-[11px] sm:text-xs">
              {translations.nav.liveTickerAnnouncement}
            </span>
          </div>

          {/* Right Area: Portal Shortcuts + Compact Toggle Switcher */}
          <div className="flex items-center gap-2 sm:gap-3.5 text-agri-200 text-xs shrink-0">
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/dealer" className="hover:text-white transition-colors flex items-center gap-1 text-[11px]">
                <span>{translations.nav.dealerPortal}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <span className="text-agri-700">|</span>
              <Link href="/machinery-provider" className="hover:text-white transition-colors flex items-center gap-1 text-[11px]">
                <span>{translations.nav.machineryHostPortal}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <span className="text-agri-700">|</span>
            </div>

            {/* Compact Top-Right Language Switcher: English | தமிழ் */}
            <div className="inline-flex items-center bg-agri-950/80 rounded-full p-0.5 border border-agri-700/80 shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  language === 'en'
                    ? 'bg-agri-500 text-white shadow-xs'
                    : 'text-agri-300 hover:text-white'
                }`}
                title="Switch to English"
              >
                English
              </button>
              <span className="text-agri-700 text-[10px] select-none px-0.5">|</span>
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  language === 'ta'
                    ? 'bg-agri-500 text-white shadow-xs'
                    : 'text-agri-300 hover:text-white'
                }`}
                title="தமிழுக்கு மாறவும்"
              >
                தமிழ்
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 xl:gap-4 2xl:gap-6">

          {/* LEFT: Logo & Brand (shrink-0) */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-agri-500 to-agri-700 flex items-center justify-center text-white shadow-md shadow-agri-600/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Sprout className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0 shrink-0">
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  Agri<span className="text-agri-600">ME</span>
                </span>
                <span className="bg-agri-100 text-agri-800 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  TN
                </span>
              </div>
            </div>
          </Link>

          {/* CENTER: Main Navigation (Desktop >= 1280px / xl) */}
          <nav className="hidden xl:flex items-center justify-center gap-0.5 xl:gap-1 2xl:gap-1.5 flex-1 min-w-0 px-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1 px-1.5 xl:px-2 2xl:px-2.5 py-1.5 rounded-lg text-xs 2xl:text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                    active
                      ? 'bg-agri-50 text-agri-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-agri-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 2xl:w-4 2xl:h-4 shrink-0 ${active ? 'text-agri-600' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Dedicated Account Action Group (Profile | Sign In | Sign Up) with clear separation */}
          <div className="hidden xl:flex items-center gap-2.5 xl:gap-3 2xl:gap-4 shrink-0 ml-2 xl:ml-3 2xl:ml-4 pl-2 xl:pl-3 2xl:pl-4 border-l border-slate-200/80">
            {!isSignedIn ? (
              <div className="flex items-center gap-2 xl:gap-2.5 2xl:gap-3 shrink-0">
                <Link
                  href="/profile"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs 2xl:text-sm font-semibold transition-all shrink-0 whitespace-nowrap ${
                    isActive('/profile')
                      ? 'bg-agri-50 text-agri-700 font-bold border border-agri-200 shadow-xs'
                      : 'text-slate-600 hover:text-agri-700 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0 text-slate-500" />
                  <span className="whitespace-nowrap">{translations.nav.profile}</span>
                </Link>

                <Link
                  href="/login"
                  className="text-xs 2xl:text-sm font-semibold text-slate-700 hover:text-agri-700 px-2 xl:px-2.5 py-1.5 rounded-xl transition-colors shrink-0 whitespace-nowrap"
                >
                  {translations.nav.signIn}
                </Link>

                <Link
                  href="/signup"
                  className="btn-primary text-xs 2xl:text-sm py-1.5 px-3 xl:px-3.5 2xl:px-4 rounded-xl font-semibold shrink-0 whitespace-nowrap shadow-xs"
                >
                  {translations.nav.signUp}
                </Link>
              </div>
            ) : (
              /* Signed In: Profile Badge + Sign Out Button */
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shrink-0 whitespace-nowrap ${
                    isActive('/profile')
                      ? 'bg-agri-100 border-agri-300 text-agri-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-agri-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden 2xl:block">
                    <span className="block text-xs font-bold leading-none truncate max-w-[100px]">
                      {profile?.name || user?.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize leading-none block mt-0.5">
                      {translateRole(activeRole)}
                    </span>
                  </div>
                  <span className="2xl:hidden whitespace-nowrap">{translations.nav.profile}</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                  title={translations.nav.signOut}
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile / Tablet Menu Trigger (< 1280px) */}
          <div className="flex items-center gap-1.5 xl:hidden shrink-0">
            <Link
              href="/profile"
              className="p-2 text-slate-600 hover:text-agri-600 rounded-xl hover:bg-slate-100 shrink-0"
              aria-label="User Profile"
              title={translations.nav.profile}
            >
              <User className="w-5 h-5 shrink-0" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-agri-500 shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 shrink-0" /> : <Menu className="w-6 h-6 shrink-0" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          
          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-1.5 pb-3 border-b border-slate-100">
            {mobileNavLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    active
                      ? 'bg-agri-50 text-agri-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-agri-600' : 'text-slate-400'}`} />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Portal Links */}
          <div className="pt-1 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              {translations.nav.specializedPortals}
            </p>
            <Link
              href="/dealer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="font-medium">{translations.nav.dealerPortal}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/machinery-provider"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="font-medium">{translations.nav.machineryHostPortal}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Auth Action Buttons */}
          <div className="pt-2 border-t border-slate-100">
            {isSignedIn ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 py-2.5 rounded-xl text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>{translations.nav.signOut} ({profile?.name || user?.email?.split('@')[0]})</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary flex-1 text-center text-sm py-2.5 font-semibold"
                >
                  {translations.nav.signIn}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary flex-1 text-center text-sm py-2.5 font-semibold"
                >
                  {translations.nav.signUp}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
