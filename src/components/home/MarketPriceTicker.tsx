'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CropPrice } from '@/types';
import { getCropPrices } from '@/lib/supabase/crops';
import { useLanguage } from '@/i18n';

export default function MarketPriceTicker() {
  const [prices, setPrices] = useState<CropPrice[]>([]);
  const { language, translations, translateCrop } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    async function loadTickerPrices() {
      try {
        const res = await getCropPrices();
        if (isMounted && res.data && res.data.length > 0) {
          setPrices(res.data.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to load ticker crop prices:', err);
      }
    }
    loadTickerPrices();
    return () => {
      isMounted = false;
    };
  }, []);

  if (prices.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-y border-slate-200 py-3 shadow-2xs overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          
          {/* Ticker label */}
          <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-slate-200">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-agri-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-agri-600"></span>
            </span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider hidden sm:inline">
              {translations.home.liveMandiPrices}:
            </span>
          </div>

          {/* Scrolling / Flex commodities */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1 text-xs">
            {prices.map((cp) => {
              const translatedCrop = translateCrop(cp.crop?.name);
              const locationShort = cp.market?.location ? cp.market.location.split(',')[0] : 'APMC';
              return (
                <div key={cp.id} className="flex items-center gap-2 shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <span className="text-sm">{cp.crop?.icon || '🌾'}</span>
                  <span className="font-semibold text-slate-800">{translatedCrop}</span>
                  <span className="font-bold text-agri-700">₹{Number(cp.price).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-500">({locationShort})</span>
                </div>
              );
            })}
          </div>

          {/* View all link */}
          <Link
            href="/crop-price"
            className="shrink-0 text-xs font-bold text-agri-700 hover:text-agri-800 flex items-center gap-1 pl-2"
          >
            <span>{translations.common.viewAll}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

        </div>
      </div>
    </div>
  );
}
