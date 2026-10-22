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
  AlertCircle,
  Check,
  Scale,
  TrendingUp,
  ShoppingBag,
  Landmark,
  Layers,
  Sprout
} from 'lucide-react';
import { useAuth } from '@/lib/supabase/useAuth';
import { updateUserProfile, setAuthCookie } from '@/lib/supabase/auth';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { UserRole, Profile, OnboardingUserType } from '@/types';
import { useLanguage } from '@/i18n';
import { PageHeader } from '@/components/ui';
import AuthGuard from '@/components/common/AuthGuard';
import { 
  INDIAN_STATES_AND_UTS, 
  getDistrictsForState, 
  POPULAR_CROPS_ONBOARDING, 
  ONBOARDING_INTERESTS, 
  USER_TYPES 
} from '@/lib/indian-geography';

function ProfileContent() {
  const router = useRouter();
  const { user, profile, role, loading, isConfigured, signOut, refreshProfile } = useAuth();
  const { language, translations, translateRole } = useLanguage();
  const isTa = language === 'ta';

  // Local state for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editUserType, setEditUserType] = useState<OnboardingUserType>('Farmer');
  const [editState, setEditState] = useState('Tamil Nadu');
  const [editDistrict, setEditDistrict] = useState('Salem');
  const [editPrimaryCrops, setEditPrimaryCrops] = useState<string[]>([]);
  const [editMainInterests, setEditMainInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Fallback demo state
  const [demoUser, setDemoUser] = useState<Profile>(MOCK_PROFILES[0]);
  const [demoRole, setDemoRole] = useState<UserRole>('farmer');

  // Cascading districts for current edited state
  const availableDistricts = getDistrictsForState(editState);

  // Sync edit form fields when profile is loaded
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditPhone(profile.phone || '');
      setEditUserType((profile.user_type as OnboardingUserType) || 'Farmer');
      setEditState(profile.state || 'Tamil Nadu');
      setEditDistrict(profile.district || 'Salem');
      setEditPrimaryCrops(profile.primary_crops || ['paddy', 'tomato']);
      setEditMainInterests(profile.main_interests || ['crop_prices', 'price_prediction', 'government_schemes']);
    } else if (!isConfigured) {
      setEditName(demoUser.name || '');
      setEditPhone(demoUser.phone || '');
      setEditUserType((demoUser.user_type as OnboardingUserType) || 'Farmer');
      setEditState(demoUser.state || 'Tamil Nadu');
      setEditDistrict(demoUser.district || 'Salem');
      setEditPrimaryCrops(demoUser.primary_crops || ['paddy', 'tomato']);
      setEditMainInterests(demoUser.main_interests || ['crop_prices', 'price_prediction', 'government_schemes']);
    }
  }, [profile, demoUser, isConfigured]);

  const handleStateChange = (newState: string) => {
    setEditState(newState);
    const districts = getDistrictsForState(newState);
    if (districts.length > 0) {
      setEditDistrict(districts[0]);
    } else {
      setEditDistrict('');
    }
  };

  const toggleCrop = (cropId: string) => {
    setEditPrimaryCrops(prev => 
      prev.includes(cropId) ? prev.filter(c => c !== cropId) : [...prev, cropId]
    );
  };

  const toggleInterest = (interestId: string) => {
    setEditMainInterests(prev => 
      prev.includes(interestId) ? prev.filter(i => i !== interestId) : [...prev, interestId]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    const locationString = `${editDistrict}, ${editState}`;

    if (isConfigured && user) {
      const { error } = await updateUserProfile(user.id, {
        name: editName,
        phone: editPhone,
        location: locationString,
        user_type: editUserType,
        state: editState,
        district: editDistrict,
        primary_crops: editPrimaryCrops,
        main_interests: editMainInterests
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
    const updatedDemo = {
      ...demoUser,
      name: editName,
      phone: editPhone,
      location: locationString,
      user_type: editUserType,
      state: editState,
      district: editDistrict,
      primary_crops: editPrimaryCrops,
      main_interests: editMainInterests
    };
    setDemoUser(updatedDemo);

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('agrime_demo_session');
        if (stored) {
          const session = JSON.parse(stored);
          session.profile = updatedDemo;
          localStorage.setItem('agrime_demo_session', JSON.stringify(session));
        }
      } catch {}
    }

    setSaving(false);
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleRealSignOut = async () => {
    await signOut();
    router.push('/');
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

  const getInterestIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scale': return <Scale className="w-4 h-4 text-emerald-600" />;
      case 'TrendingUp': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'Store': return <Store className="w-4 h-4 text-amber-600" />;
      case 'Tractor': return <Tractor className="w-4 h-4 text-purple-600" />;
      case 'ShoppingBag': return <ShoppingBag className="w-4 h-4 text-rose-600" />;
      case 'Landmark': return <Landmark className="w-4 h-4 text-teal-600" />;
      default: return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-10 h-10 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 mt-4">{translations.common.loading}</p>
      </div>
    );
  }

  // Active profile object to display
  const activeProfile: Profile = profile 
    ? profile 
    : user
    ? {
        id: user.id,
        name: (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: (user.user_metadata?.phone as string) || 'Not provided',
        location: (user.user_metadata?.location as string) || 'Not provided',
        role: (user.user_metadata?.role as UserRole) || 'farmer',
        user_type: (user.user_metadata?.user_type as OnboardingUserType) || 'Farmer',
        state: (user.user_metadata?.state as string) || 'Tamil Nadu',
        district: (user.user_metadata?.district as string) || 'Salem',
        primary_crops: (user.user_metadata?.primary_crops as string[]) || ['paddy', 'tomato'],
        main_interests: (user.user_metadata?.main_interests as string[]) || ['crop_prices', 'price_prediction', 'government_schemes'],
        created_at: user.created_at || new Date().toISOString()
      }
    : demoUser;

  const activeRole: UserRole = role || activeProfile.role || 'farmer';

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Modern Page Header */}
      <PageHeader
        title={activeProfile.name || translations.nav.profile}
        subtitle={activeProfile.email || activeProfile.phone}
        badge={isConfigured ? (isTa ? 'சரிபார்க்கப்பட்ட கணக்கு' : 'Verified Account') : (isTa ? 'செயலில் உள்ள சுயவிவரம்' : 'Active Profile')}
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

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-agri-600" />
              <span>{translations.profile.personalInfo}</span>
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-agri-700 bg-agri-50 hover:bg-agri-100 border border-agri-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
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
            <form onSubmit={handleSaveProfile} className="space-y-5">
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
                    {translations.profile.email} ({isTa ? 'மாற்ற முடியாது' : 'Read-only'})
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

                {/* User Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{isTa ? 'பயனர் வகை' : 'User Type'}</label>
                  <select
                    value={editUserType}
                    onChange={(e) => setEditUserType(e.target.value as OnboardingUserType)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  >
                    <option value="Farmer">Farmer (விவசாயி)</option>
                    <option value="Dealer">Dealer (வியாபாரி)</option>
                    <option value="Buyer">Buyer (வாங்குபவர்)</option>
                    <option value="Other">Other (மற்றவை)</option>
                  </select>
                </div>

                {/* State & Cascading District */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{isTa ? 'மாநிலம்' : 'State / UT'}</label>
                  <select
                    value={editState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  >
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{isTa ? 'மாவட்டம்' : 'District'}</label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Edit Primary Crops */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  {isTa ? 'முதன்மைப் பயிர்கள்' : 'Primary Crops'} ({editPrimaryCrops.length} {isTa ? 'தேர்வு' : 'selected'})
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {POPULAR_CROPS_ONBOARDING.map((crop) => {
                    const isChecked = editPrimaryCrops.includes(crop.id);
                    return (
                      <button
                        key={crop.id}
                        type="button"
                        onClick={() => toggleCrop(crop.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{crop.icon}</span>
                        <span>{isTa ? crop.nameTa : crop.name}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Edit Main Interests */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  {isTa ? 'முக்கிய தள ஆர்வங்கள்' : 'Main Platform Interests'} ({editMainInterests.length} {isTa ? 'தேர்வு' : 'selected'})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {ONBOARDING_INTERESTS.map((item) => {
                    const isChecked = editMainInterests.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleInterest(item.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getInterestIcon(item.icon)}
                          <span className="text-xs font-bold text-slate-800">{isTa ? item.nameTa : item.name}</span>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  {translations.profile.cancelEdit}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? translations.common.loading : translations.profile.saveChanges}</span>
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <span>{isTa ? 'இருப்பிடம் (மாவட்டம் & மாநிலம்)' : 'Location'}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {activeProfile.district && activeProfile.state 
                      ? `${activeProfile.district}, ${activeProfile.state}` 
                      : (activeProfile.location || (isTa ? 'வழங்கப்படவில்லை' : 'Not provided'))}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>{isTa ? 'பயனர் வகை' : 'User Type'}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {activeProfile.user_type || 'Farmer'}
                  </p>
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

              {/* Onboarding Question Display: Primary Crops */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    <span>{isTa ? 'தேர்ந்தெடுக்கப்பட்ட முதன்மைப் பயிர்கள்' : 'Selected Primary Crops'}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                    {activeProfile.primary_crops?.length || 0} {isTa ? 'பயிர்கள்' : 'Crops'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeProfile.primary_crops && activeProfile.primary_crops.length > 0 ? (
                    activeProfile.primary_crops.map((cropId) => {
                      const match = POPULAR_CROPS_ONBOARDING.find(c => c.id === cropId);
                      return (
                        <span
                          key={cropId}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-900 border border-emerald-200 shadow-xs"
                        >
                          <span>{match?.icon || '🌾'}</span>
                          <span>{match ? (isTa ? match.nameTa : match.name) : cropId}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      {isTa ? 'பயிர்கள் எதுவும் தேர்ந்தெடுக்கப்படவில்லை' : 'No primary crops specified yet'}
                    </span>
                  )}
                </div>
              </div>

              {/* Onboarding Question Display: Main Interests */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{isTa ? 'தளத்தில் உங்கள் முதன்மை ஆர்வங்கள்' : 'Platform Interests'}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
                    {activeProfile.main_interests?.length || 0} {isTa ? 'ஆர்வங்கள்' : 'Interests'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {activeProfile.main_interests && activeProfile.main_interests.length > 0 ? (
                    activeProfile.main_interests.map((interestId) => {
                      const match = ONBOARDING_INTERESTS.find(i => i.id === interestId);
                      return (
                        <Link
                          key={interestId}
                          href={match?.route || '/'}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex items-center gap-2 group shadow-xs"
                        >
                          <div className="p-1 rounded-lg bg-slate-50 group-hover:bg-white shrink-0">
                            {match ? getInterestIcon(match.icon) : <Sparkles className="w-4 h-4 text-emerald-600" />}
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {match ? (isTa ? match.nameTa : match.name) : interestId}
                          </span>
                        </Link>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 italic col-span-3">
                      {isTa ? 'ஆர்வங்கள் எதுவும் தேர்ந்தெடுக்கப்படவில்லை' : 'No interests specified yet'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Link href="/crop-price" className="btn-secondary text-xs py-2 px-3.5">
                {translations.nav.cropPrices}
              </Link>
              <Link href="/prediction" className="btn-secondary text-xs py-2 px-3.5">
                {translations.nav.predictions}
              </Link>
              <Link href="/schemes" className="btn-secondary text-xs py-2 px-3.5">
                {translations.nav.schemes}
              </Link>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleRealSignOut}
              className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{translations.auth.signout}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
