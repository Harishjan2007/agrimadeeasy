'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Info, Sparkles } from 'lucide-react';
import { CropPrediction } from '@/types';
import { getCropPredictions } from '@/lib/supabase/crops';
import { useLanguage } from '@/i18n';

export default function PredictionPreview() {
  const [predictions, setPredictions] = useState<CropPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, translations, translateCrop, translateTrend } = useLanguage();

  const isTa = language === 'ta';

  useEffect(() => {
    let isMounted = true;
    async function loadPredictions() {
      try {
        const res = await getCropPredictions();
        if (isMounted && res.data) {
          setPredictions(res.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load predictions on Home page:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPredictions();
    return () => {
      isMounted = false;
    };
  }, []);

  const getTrendBadge = (trend: string) => {
    if (trend === 'up' || trend === 'increasing') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{translations.prediction.increasing}</span>
        </span>
      );
    }
    if (trend === 'down' || trend === 'decreasing') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>{translations.prediction.decreasing}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Minus className="w-3.5 h-3.5" />
        <span>{translations.prediction.stable}</span>
      </span>
    );
  };

  return (
    <section className="py-14 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                {translations.prediction.marketOutlook}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {translations.home.predictionsTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {translations.home.predictionsSubtitle}
            </p>
          </div>

          <Link
            href="/prediction"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-800 shrink-0 group"
          >
            <span>{translations.common.viewAll} {translations.nav.predictions}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="agri-card p-5 bg-white border-slate-200 animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                    <div className="space-y-1.5">
                      <div className="h-4 bg-slate-200 rounded w-24"></div>
                      <div className="h-3 bg-slate-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : predictions.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">{translations.prediction.noPredictionsFound}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {isTa ? 'பருவகால விலை கணிப்புகள் வெளியிடப்பட்டதும் இங்கு தோன்றும்.' : 'Stored seasonal price trend forecasts will appear here when models are published.'}
            </p>
            <Link
              href="/prediction"
              className="mt-3 inline-flex items-center gap-1 btn-secondary text-xs py-1.5 px-3"
            >
              <span>{translations.common.viewAll} {translations.nav.predictions}</span>
            </Link>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {predictions.map((p) => {
              const translatedCrop = translateCrop(p.crop?.name);
              return (
                <div
                  key={p.id}
                  className="agri-card p-5 bg-white border-slate-200 hover:border-blue-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{p.crop?.icon || '🌾'}</span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{translatedCrop}</h4>
                          <p className="text-[11px] text-slate-500">{p.market?.name || p.market?.location}</p>
                        </div>
                      </div>
                      {getTrendBadge(p.trend)}
                    </div>

                    {/* Price metrics comparison */}
                    <div className="grid grid-cols-2 gap-2 my-4">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {translations.prediction.currentPrice}
                        </span>
                        <span className="text-base font-bold text-slate-800">
                          ₹{Number(p.current_price).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 text-center">
                        <span className="text-[10px] uppercase font-bold text-blue-600 block">
                          {translations.prediction.predictedRange}
                        </span>
                        <span className="text-base font-extrabold text-blue-900">
                          ₹{Number(p.predicted_min).toLocaleString('en-IN')} - ₹{Number(p.predicted_max).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-medium text-slate-700">{translations.prediction.predictionPeriod}: </span>
                      <span className="text-slate-900 font-semibold">{p.prediction_period}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{translations.prediction.predictionDate}: {p.prediction_date}</span>
                    <Link
                      href="/prediction"
                      className="font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>{translations.common.viewDetails}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stored Prediction Transparency Notice */}
        <div className="mt-6 flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-blue-900/80">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>{isTa ? 'கணிப்பு தரவு குறிப்பு:' : 'Note on Forecast Data:'}</strong> {isTa 
              ? 'விலை கணிப்புகள் வரலாற்று மண்டி தரவுகள் மற்றும் பருவகால தேவையின் அடிப்படையில் உழவர்களுக்கு திட்டமிட உதவ வழங்கப்படுகின்றன.'
              : 'Price projections represent stored historical & seasonal benchmark forecasts recorded for regional mandis to assist farmers with strategic market planning.'}
          </p>
        </div>

      </div>
    </section>
  );
}
