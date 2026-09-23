'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  CheckCircle2, 
  Tractor, 
  Store, 
  Sparkles, 
  Info,
  Edit3,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/supabase/useAuth';
import { updateUserProfile } from '@/lib/supabase/auth';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { UserRole, Profile } from '@/types';
import { useLanguage } from '@/i18n';
import { PageHeader } from '@/components/ui';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, role, loading, isConfigured, signOut, refreshProfile } = useAuth();
  const { language, translations, translateRole } = useLanguage();
  const isTa = language === 'ta';

  // Local state for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Fallback demo state when Supabase is not configured
  const [demoUser, setDemoUser] = useState<Profile>(MOCK_PROFILES[0]);
  const [demoRole, setDemoRole] = useState<UserRole>('farmer');
  const [demoSignOutNotice, setDemoSignOutNotice] = useState(false);

  // Sync edit form fields when profile is loaded
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditPhone(profile.phone || '');
      setEditLocation(profile.location || '');
    } else if (!isConfigured) {
      setEditName(demoUser.name || '');
      setEditPhone(demoUser.phone || '');
      setEditLocation(demoUser.location || '');
    }
  }, [profile, demoUser, isConfigured]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    if (isConfigured && user) {
      const { error } = await updateUserProfile(user.id, {
        name: editName,
        phone: editPhone,
        location: editLocation
      });

      if (error) {
        setSaveError(error.message || (isTa ? 'சுயவிவரத்தைப் புதுப்பிப்பது தோல்வியடைந்தது.' : 'Failed to update profile.'));
        setSaving(false);
        return;
      }

      await refreshProfile();
      setSaving(false);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
      return;
    }

    // Demo mode edit simulation
    setDemoUser(prev => ({
      ...prev,
      name: editName,
      phone: editPhone,
      location: editLocation
    }));
    setSaving(false);
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleRealSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const switchDemoRole = (newRole: UserRole) => {
    setDemoRole(newRole);
    const p = MOCK_PROFILES.find((x) => x.role === newRole);
    if (p) {
      setDemoUser(p);
    }
  };

  const getRoleBadge = (accountRole: UserRole) => {
    switch (accountRole) {
      case 'farmer':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {translations.profile.farmerRoleBadge}
          </span>
        );
      case 'dealer':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Store className="w-3.5 h-3.5 text-amber-600" />
            {translations.profile.dealerRoleBadge}
          </span>
        );
      case 'machinery_provider':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Tractor className="w-3.5 h-3.5 text-blue-600" />
            {translations.profile.providerRoleBadge}
          </span>
        );
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-10 h-10 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 mt-4">{translations.common.loading}</p>
      </div>
    );
  }

  // 2. Signed-Out Guard for Configured Supabase
  if (isConfigured && !user) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{translations.auth.loginRequiredTitle}</h1>
            <p className="text-xs text-slate-500 mt-2">
              {translations.auth.loginRequiredDescription}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link href="/login" className="btn-primary w-full py-2.5 text-center text-sm font-bold">
              {translations.auth.loginButton}
            </Link>
            <Link href="/signup" className="btn-secondary w-full py-2.5 text-center text-sm font-semibold">
              {translations.auth.signupTitle}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active profile object to display
  const activeProfile: Profile = isConfigured && profile 
    ? profile 
    : isConfigured && user
    ? {
        id: user.id,
        name: (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: (user.user_metadata?.phone as string) || 'Not provided',
        location: (user.user_metadata?.location as string) || 'Not provided',
        role: (user.user_metadata?.role as UserRole) || 'farmer',
        created_at: user.created_at || new Date().toISOString()
      }
    : demoUser;

  const activeRole: UserRole = isConfigured ? (role || activeProfile.role || 'farmer') : demoRole;

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Modern Page Header */}
      <PageHeader
        title={activeProfile.name || translations.nav.profile}
        subtitle={activeProfile.email || activeProfile.phone}
        badge={isConfigured ? (isTa ? 'சரிபார்க்கப்பட்ட கணக்கு' : 'Verified Account') : (isTa ? 'மாதிரி பயனர்' : 'Demo Profile')}
        icon={User}
        iconColor="text-emerald-700"
        iconBg="bg-emerald-50 border-emerald-200"
        actions={
          <div className="flex items-center gap-2">
            {getRoleBadge(activeRole)}
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* Success Alert */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{translations.profile.profileUpdated}</span>
          </div>
        )}

        {/* Error Alert */}
        {saveError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Demo Signout Notice */}
        {demoSignOutNotice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{isTa ? 'மாதிரி கணக்கு முறை அறிவிப்பு: வேடங்களை மாற்ற கீழே உள்ள தேர்வியைப் பயன்படுத்தவும்.' : 'Demo Mode Notice: In demo mode, use the persona switcher below to change roles.'}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-agri-600" />
              <span>{translations.profile.personalInfo}</span>
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-agri-700 bg-agri-50 hover:bg-agri-100 border border-agri-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              {isEditing ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>{translations.profile.cancelEdit}</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{translations.profile.editProfile}</span>
                </>
              )}
            </button>
          </div>

          {/* EDIT FORM MODE */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{translations.profile.fullName}</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {translations.profile.email} ({isTa ? 'மாற்ற முடியாது' : 'Read-only Auth'})
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={activeProfile.email}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{translations.profile.phone}</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{translations.profile.location}</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  {translations.profile.cancelEdit}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? translations.common.loading : translations.profile.saveChanges}</span>
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{translations.profile.fullName}</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{activeProfile.name || (isTa ? 'வழங்கப்படவில்லை' : 'Not provided')}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{translations.profile.email}</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{activeProfile.email || (isTa ? 'வழங்கப்படவில்லை' : 'Not provided')}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{translations.profile.phone}</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{activeProfile.phone || (isTa ? 'வழங்கப்படவில்லை' : 'Not provided')}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{translations.profile.location}</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{activeProfile.location || (isTa ? 'வழங்கப்படவில்லை' : 'Not provided')}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>{translations.profile.role}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 capitalize">{translateRole(activeRole)} {isTa ? 'கணக்கு' : 'Account'}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{translations.profile.memberSince}</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {activeProfile.created_at
                    ? new Date(activeProfile.created_at).toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
                        month: 'long',
                        year: 'numeric'
                      })
                    : (isTa ? 'சமீபத்தில் இணைந்தார்' : 'Recently joined')}
                </p>
              </div>
            </div>
          )}

          {/* Role-Specific Quick Shortcuts */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {activeRole === 'farmer' && (
                <>
                  <Link href="/bookings" className="btn-secondary text-xs py-2 px-3.5">
                    {translations.nav.myBookings}
                  </Link>
                  <Link href="/crop-price" className="btn-secondary text-xs py-2 px-3.5">
                    {translations.nav.cropPrices}
                  </Link>
                </>
              )}
              {activeRole === 'dealer' && (
                <>
                  <Link href="/dealer" className="btn-secondary text-xs py-2 px-3.5">
                    {translations.nav.dealerPortal}
                  </Link>
                  <Link href="/ecommerce" className="btn-secondary text-xs py-2 px-3.5">
                    {translations.nav.ecommerce}
                  </Link>
                </>
              )}
              {activeRole === 'machinery_provider' && (
                <>
                  <Link href="/machinery-provider" className="btn-secondary text-xs py-2 px-3.5">
                    {translations.nav.machineryPortal}
                  </Link>
                  <Link href="/machinery" className="btn-secondary text-xs py-2 px-3.5">
                    {translations.nav.machinery}
                  </Link>
                </>
              )}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={isConfigured ? handleRealSignOut : () => {
                setDemoSignOutNotice(true);
                setTimeout(() => setDemoSignOutNotice(false), 3000);
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{translations.auth.signout}</span>
            </button>
          </div>
        </div>

        {/* Demo Persona Switcher (when unconfigured) */}
        {!isConfigured && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-agri-600" />
                  <span>{isTa ? 'மாதிரி பயனர் தேர்வு' : 'Demo User Persona Switcher'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isTa ? 'ஆஃப்லைன் மாதிரி சோதனையின் போது வெவ்வேறு கணக்கு பாத்திரங்களை சோதிக்கலாம்' : 'Simulate different account roles during offline demo testing'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => switchDemoRole('farmer')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  demoRole === 'farmer'
                    ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">🌾 {translateRole('farmer')}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Murugan Ramasamy (Vellore)</span>
                {demoRole === 'farmer' && (
                  <span className="text-[10px] font-bold text-emerald-700 mt-2 inline-block">● {isTa ? 'செயலில் உள்ள பாத்திரம்' : 'Active Role'}</span>
                )}
              </button>

              <button
                onClick={() => switchDemoRole('dealer')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  demoRole === 'dealer'
                    ? 'bg-amber-50 border-amber-500 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">🏪 {translateRole('dealer')}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Sri Balaji Agro Buyers</span>
                {demoRole === 'dealer' && (
                  <span className="text-[10px] font-bold text-amber-700 mt-2 inline-block">● {isTa ? 'செயலில் உள்ள பாத்திரம்' : 'Active Role'}</span>
                )}
              </button>

              <button
                onClick={() => switchDemoRole('machinery_provider')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  demoRole === 'machinery_provider'
                    ? 'bg-blue-50 border-blue-500 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">🚜 {translateRole('machinery_provider')}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Velan Machinery Rentals</span>
                {demoRole === 'machinery_provider' && (
                  <span className="text-[10px] font-bold text-blue-700 mt-2 inline-block">● {isTa ? 'செயலில் உள்ள பாத்திரம்' : 'Active Role'}</span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
