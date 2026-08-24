'use client';

import React from 'react';
import Link from 'next/link';
import { Store, ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/supabase/useAuth';
import { useLanguage } from '@/i18n';

export default function DealerPortalPage() {
  const { user, role, loading, isConfigured } = useAuth();
  const { language, translations, translateRole } = useLanguage();
  const isTa = language === 'ta';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 mt-4">{translations.common.loading}</p>
      </div>
    );
  }

  // 1. Signed-Out Protection
  if (isConfigured && !user) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full mb-2">
              {isTa ? 'வியாபாரி அங்கீகாரம்' : 'Merchant Authentication'}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">{translations.auth.loginRequiredTitle}</h1>
            <p className="text-xs text-slate-500 mt-2">
              {isTa 
                ? 'கொள்முதல் மேற்கோள்கள் மற்றும் சரக்குகளை நிர்வகிக்க உங்கள் வியாபாரி கணக்கில் உள்நுழையவும்.'
                : 'Please sign in with your registered Agricultural Dealer account to access quotes, listings, and trade tools.'}
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

  // 2. Role Restriction Guard (Signed in as Farmer or Machinery Provider)
  if (isConfigured && user && role !== 'dealer') {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full mb-2">
              {isTa ? 'அணுகல் கட்டுப்படுத்தப்பட்டது' : 'Access Restricted'}
            </span>
            <h1 className="text-xl font-extrabold text-slate-900">{isTa ? 'வியாபாரி பாத்திரம் தேவை' : 'Dealer Role Required'}</h1>
            <p className="text-xs text-slate-500 mt-2">
              {isTa
                ? `உங்கள் கணக்கு பாத்திரம் ${translateRole(role || 'farmer')}. வியாபாரி போர்ட்டல் பதிவு செய்யப்பட்ட விவசாய வியாபாரிகளுக்கு மட்டுமே.`
                : `Your active account role is ${translateRole(role || 'farmer')}. The Dealer Portal is strictly reserved for registered agricultural merchants and crop buyers.`}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link href="/" className="btn-primary w-full py-2.5 text-center text-sm font-bold">
              {isTa ? 'முகப்புப் பக்கத்திற்குத் திரும்பு' : 'Return to Farmer Home'}
            </Link>
            <Link href="/profile" className="btn-secondary w-full py-2.5 text-center text-sm font-semibold">
              {translations.nav.profile}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-agri-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isTa ? 'முகப்புக்குச் செல்' : 'Back to Home'}</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
            <Store className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 mb-2">
              <Store className="w-3.5 h-3.5" />
              {translations.dealerPortal.welcomeBadge}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {translations.dealerPortal.title}
            </h1>
            <p className="text-slate-600 text-sm max-w-md mx-auto mt-2">
              {translations.dealerPortal.subtitle}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 max-w-lg mx-auto text-left space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{translations.dealerPortal.featuresTitle}</span>
            </div>
            <p>{translations.dealerPortal.feature1}</p>
            <p>{translations.dealerPortal.feature2}</p>
            <p>{translations.dealerPortal.feature3}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/dealers"
              className="btn-primary text-xs sm:text-sm py-2.5 px-5"
            >
              {translations.dealerPortal.browseDealers}
            </Link>
            <Link
              href="/ecommerce"
              className="btn-secondary text-xs sm:text-sm py-2.5 px-5"
            >
              {translations.dealerPortal.viewMarketplace}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
