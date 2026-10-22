'use client';

import React, { useState, useEffect } from 'react';
import { Scale, Database } from 'lucide-react';
import DailyMandiPricesSection from '@/components/crop-price/DailyMandiPricesSection';
import HistoricalDatasetSection from '@/components/crop-price/HistoricalDatasetSection';
import { useLanguage } from '@/i18n';
import { PageHeader } from '@/components/ui';

export default function CropPricePageClient() {
  const { language, translations } = useLanguage();
  const isTa = language === 'ta';

  // Navigation tab: 'live' (Live Prices) | 'historical' (Historical Dataset)
  const [activeTab, setActiveTab] = useState<'live' | 'historical'>('live');

  // Sync tab with URL query parameter (?tab=live or ?tab=historical)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'historical' || tabParam === 'history' || tabParam === 'dataset') {
        setActiveTab('historical');
      } else {
        setActiveTab('live');
      }
    }
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Page Header with Scale icon, APMC badge, title, subtitle, and functional Live Prices & Historical Dataset controls */}
      <PageHeader
        title={translations.cropPrices.title}
        subtitle={translations.cropPrices.subtitle}
        badge={isTa ? 'அரசு ஒழுங்குமுறை மண்டி' : 'APMC Mandi Directory'}
        icon={Scale}
        iconBg="bg-emerald-50 border-emerald-200 text-emerald-700"
        actions={
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-xs border cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20 ring-2 ring-emerald-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeTab === 'live' ? 'bg-emerald-300 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span>{isTa ? 'நேரலை சந்தை விலைகள்' : 'Live Prices'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('historical')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-xs border cursor-pointer ${
                activeTab === 'historical'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/20 ring-2 ring-slate-800/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Database
                className={`w-4 h-4 ${activeTab === 'historical' ? 'text-emerald-400' : 'text-slate-500'}`}
              />
              <span>{isTa ? 'வரலாற்று தரவுத்தளம்' : 'Historical Dataset'}</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === 'live' ? (
          <DailyMandiPricesSection />
        ) : (
          <HistoricalDatasetSection />
        )}
      </div>
    </div>
  );
}
