'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Store, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { Dealer } from '@/types';
import { getDealers } from '@/lib/supabase/dealers';
import DealerCard from '@/components/dealers/DealerCard';
import { useLanguage } from '@/i18n';

export default function DealersPageClient() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { language, translations } = useLanguage();

  const isTa = language === 'ta';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getDealers();
      if (res.error) {
        setError(translations.dealers.noDealersDescription);
      } else {
        setDealers(res.data);
      }
    } catch (err) {
      console.error('Failed to load dealers:', err);
      setError(translations.dealers.noDealersDescription);
    } finally {
      setLoading(false);
    }
  }, [translations.dealers.noDealersDescription]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search by Dealer Name, Address, Phone, or Crop
  const filteredDealers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return dealers;

    return dealers.filter((dealer) => {
      const name = dealer.shop_name.toLowerCase();
      const address = dealer.address.toLowerCase();
      const phone = dealer.phone.toLowerCase();
      const cropPrices = dealer.crop_prices || [];
      const buysMatchingCrop = cropPrices.some(
        (cp) => cp.crop?.name.toLowerCase().includes(term) || cp.crop?.category?.toLowerCase().includes(term)
      );

      return (
        name.includes(term) ||
        address.includes(term) ||
        phone.includes(term) ||
        buysMatchingCrop
      );
    });
  }, [dealers, searchTerm]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-agri-950 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-amber-500/30">
                <Store className="w-3.5 h-3.5" />
                {translations.dealers.directBuyerBadge}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {translations.dealers.title}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
                {translations.dealers.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/crop-price"
                className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{isTa ? 'மண்டி விலை ஒப்பீடு' : 'Check Mandi Benchmarks'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Error State Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="text-sm font-bold">{translations.common.error}</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadData()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shrink-0 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{translations.common.retry}</span>
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8">
          <div className="max-w-2xl relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={translations.dealers.searchPlaceholder}
              className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                {isTa ? 'அழிக்க' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Dealers Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{translations.dealers.title}</span>
              {!loading && (
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                  {filteredDealers.length} {isTa ? 'வியாபாரிகள்' : 'Merchants'}
                </span>
              )}
            </h2>

            {!loading && dealers.length > 0 && (
              <button
                onClick={() => loadData()}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                title={isTa ? 'புதுப்பிக்க' : 'Refresh dealers'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isTa ? 'புதுப்பிக்க' : 'Refresh'}</span>
              </button>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200"></div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="h-20 bg-slate-100 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : dealers.length === 0 ? (
            /* Global Empty State */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">{translations.dealers.noDealersFound}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {translations.dealers.noDealersDescription}
              </p>
              <button
                onClick={() => loadData()}
                className="mt-5 btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{translations.common.retry}</span>
              </button>
            </div>
          ) : filteredDealers.length === 0 ? (
            /* Filter Empty State */
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">{translations.dealers.noDealersFound} &quot;{searchTerm}&quot;</h3>
              <p className="text-xs text-slate-500 mt-1">{translations.dealers.noDealersDescription}</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 btn-secondary text-xs py-2 px-4"
              >
                {translations.common.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDealers.map((dealer) => (
                <DealerCard
                  key={dealer.id}
                  dealer={dealer}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
