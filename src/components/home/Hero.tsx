'use client';

import React from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Tractor, 
  Store, 
  CheckCircle2, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { useLanguage } from '@/i18n';

export default function Hero() {
  const { language, translations, translateCrop } = useLanguage();
  const isTa = language === 'ta';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-agri-50/70 via-white to-slate-50 pt-8 pb-16 lg:py-20 border-b border-slate-200/70">
      {/* Subtle decorative background circles */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-agri-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-harvest-100/40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading & Value Prop */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-agri-100/80 border border-agri-200/80 text-agri-800 text-xs sm:text-sm font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 text-agri-600" />
              <span>{translations.home.heroBadge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              {translations.home.heroTitlePrefix}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-agri-600 to-agri-800">
                {translations.home.heroTitleHighlight}
              </span>{' '}
              {translations.home.heroTitleSuffix}
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              {translations.home.heroDescription}
            </p>

            {/* Quick Benefits Bullet List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0" />
                <span>{isTa ? 'நேரலை மண்டி & வியாபாரி விலைகள்' : 'Live Mandi & Buyer Rates'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0" />
                <span>{isTa ? 'நேரடி வியாபாரி தொடர்பு' : 'Direct Dealer Discovery'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0" />
                <span>{isTa ? 'எளிதான இயந்திர வாடகை' : 'Easy Machinery Rentals'}</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-4">
              <Link href="/crop-price" className="btn-primary py-3.5 px-6 text-sm sm:text-base font-semibold shadow-md shadow-agri-600/20">
                <TrendingUp className="w-5 h-5" />
                <span>{translations.home.explorePricesBtn}</span>
              </Link>
              <Link href="/dealers" className="btn-secondary py-3.5 px-6 text-sm sm:text-base font-semibold">
                <Store className="w-5 h-5 text-agri-600" />
                <span>{translations.home.findDealersBtn}</span>
              </Link>
              <Link href="/machinery" className="btn-secondary py-3.5 px-6 text-sm sm:text-base font-semibold">
                <Tractor className="w-5 h-5 text-harvest-600" />
                <span>{translations.home.bookMachineryBtn}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Interactive Feature Card */}
          <div className="lg:col-span-5">
            <div className="agri-card bg-white p-6 shadow-xl border-slate-200/90 relative">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-agri-700 uppercase tracking-wider bg-agri-50 px-2 py-0.5 rounded">
                    {translations.home.todayMarket}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {translateCrop('Paddy')} (Samba / Basmati)
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-agri-700">₹3,520</span>
                  <p className="text-[11px] text-slate-400">{isTa ? 'குவிண்டாலுக்கு' : 'per Quintal'}</p>
                </div>
              </div>

              {/* Price comparison mini-box */}
              <div className="space-y-2.5 mb-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {isTa ? 'வேலூர் மண்டி விலை' : 'Vellore Mandi Rate'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {isTa ? 'ஒழுங்குமுறை விற்பனைக்கூடம்' : 'APMC Regulated Mandi'}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 text-sm">₹3,450 / Qtl</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-agri-50/80 border border-agri-200/70">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-agri-600" />
                    <div>
                      <p className="text-xs font-bold text-agri-900">Sri Balaji Agro Buyers</p>
                      <p className="text-[10px] text-agri-700 font-medium">
                        {isTa ? 'வியாபாரி கொள்முதல் விலை (+₹70 கூடுதல்)' : 'Dealer buying price (+₹70 bonus)'}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-agri-700 text-sm">₹3,520 / Qtl</span>
                </div>
              </div>

              {/* Machinery availability quick callout */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-harvest-500 text-white flex items-center justify-center font-bold">
                    <Tractor className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-900">
                      {isTa ? 'நெல் அறுவடை இயந்திரம் வாடகைக்கு உள்ளது' : 'Combine Harvester Available'}
                    </p>
                    <p className="text-[11px] text-amber-700">
                      {isTa ? 'காட்பாடி பகுதி • ₹2,200/மணிநேரம்' : 'Katpadi region • ₹2,200/hr'}
                    </p>
                  </div>
                </div>
                <Link href="/machinery" className="text-xs font-bold text-harvest-700 hover:text-harvest-900 underline">
                  {translations.machinery.bookNow}
                </Link>
              </div>

              {/* Quick links to roles */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {isTa ? 'நீங்கள் வணிகரா?' : 'Are you a merchant?'}
                </span>
                <div className="flex items-center gap-3">
                  <Link href="/dealer" className="font-semibold text-agri-700 hover:underline">
                    {translations.nav.dealerPortal} →
                  </Link>
                  <Link href="/machinery-provider" className="font-semibold text-slate-700 hover:underline">
                    {translations.nav.machineryHostPortal} →
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
