'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight, MapPin, Building2 } from 'lucide-react';
import { CropPrice } from '@/types';
import { getFeaturedCropPrices } from '@/lib/supabase/crops';
import { useLanguage } from '@/i18n';

export default function CropPricePreview() {
  const [featuredPrices, setFeaturedPrices] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, translations, translateCrop, translateCategory } = useLanguage();

  const isTa = language === 'ta';

  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        const res = await getFeaturedCropPrices();
        if (isMounted && res.data) {
          setFeaturedPrices(res.data);
        }
      } catch (err) {
        console.error('Failed to load featured crop prices on Home page:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-14 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-agri-100 text-agri-700">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-agri-700 uppercase tracking-wider">
                {isTa ? 'மண்டி விலை கண்காணிப்பு' : 'Mandi Price Watch'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {translations.home.marketPricesTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {translations.home.marketPricesSubtitle}
            </p>
          </div>

          <Link
            href="/crop-price"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-agri-700 hover:text-agri-800 shrink-0 group"
          >
            <span>{translations.common.viewAll} {translations.nav.cropPrices}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="agri-card p-5 animate-pulse space-y-3 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-12 bg-slate-200 rounded-xl"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : featuredPrices.length === 0 ? (
          /* Empty State */
          <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">{translations.cropPrices.noPricesFound}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {isTa ? 'மண்டி தரவுகள் புதுப்பிக்கப்பட்டதும் இங்கு தோன்றும்.' : 'Market rates will appear here as soon as mandi data is published.'}
            </p>
            <Link
              href="/crop-price"
              className="mt-3 inline-flex items-center gap-1 btn-secondary text-xs py-1.5 px-3"
            >
              <span>{translations.common.viewAll} {translations.nav.cropPrices}</span>
            </Link>
          </div>
        ) : (
          /* Price Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredPrices.map((item) => {
              const translatedCrop = translateCrop(item.crop?.name);
              const translatedCat = translateCategory(item.crop?.category);
              const unitDisplay = item.unit?.includes('/') ? item.unit.split('/')[1] : item.unit || (isTa ? 'குவிண்டால்' : 'Qtl');
              return (
                <div
                  key={item.id}
                  className="agri-card p-5 flex flex-col justify-between hover:border-agri-300 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl group-hover:scale-105 transition-transform">
                          {item.crop?.icon || '🌾'}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-agri-700 transition-colors">
                            {translatedCrop}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {translatedCat}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="my-3 py-2.5 px-3 bg-agri-50/60 rounded-xl border border-agri-100 flex items-baseline justify-between">
                      <span className="text-xs font-medium text-slate-600">
                        {translations.cropPrices.currentRate}:
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-black text-agri-800">
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 ml-1">
                          /{unitDisplay}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.market?.name || item.market?.location || 'APMC Mandi'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-500">{item.source || 'Mandi Board'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {new Date(item.recorded_at).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <Link
                      href={`/dealers?crop=${encodeURIComponent(item.crop?.name || '')}`}
                      className="font-bold text-agri-700 hover:text-agri-800 flex items-center gap-1"
                    >
                      <span>{translations.dealers.contactDealer}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
