'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  ArrowRight, 
  Sparkles, 
  BarChart3,
  AlertCircle,
  RefreshCw,
  Scale
} from 'lucide-react';
import { Crop, Market, CropPrediction } from '@/types';
import { getCropPredictions, getCrops, getMarkets } from '@/lib/supabase/crops';
import PredictionCard from '@/components/prediction/PredictionCard';
import PredictionDecisionSupport from '@/components/prediction/PredictionDecisionSupport';
import { PageHeader } from '@/components/ui';
import { useLanguage } from '@/i18n';

export default function PredictionPageClient() {
  const [predictions, setPredictions] = useState<CropPrediction[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, translations } = useLanguage();

  const isTa = language === 'ta';

  const [searchTerm, setSearchTerm] = useState('');
  const [trendFilter, setTrendFilter] = useState<'all' | 'up' | 'down' | 'stable'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [predRes, cropsRes, marketsRes] = await Promise.all([
        getCropPredictions(),
        getCrops(),
        getMarkets()
      ]);

      if (predRes.error) {
        setError(translations.prediction.noPredictionsDescription);
      } else {
        setPredictions(predRes.data);
      }

      if (cropsRes.data && cropsRes.data.length > 0) {
        setCrops(cropsRes.data);
      }

      if (marketsRes.data && marketsRes.data.length > 0) {
        setMarkets(marketsRes.data);
      }
    } catch (err) {
      console.error('Failed to load predictions & reference data:', err);
      setError(translations.prediction.noPredictionsDescription);
    } finally {
      setLoading(false);
    }
  }, [translations.prediction.noPredictionsDescription]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPredictions = useMemo(() => {
    return predictions.filter((p) => {
      const cropName = p.crop?.name.toLowerCase() || '';
      const marketName = p.market?.name.toLowerCase() || '';
      const location = p.market?.location.toLowerCase() || '';
      const period = p.prediction_period.toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchesSearch = !q || cropName.includes(q) || marketName.includes(q) || location.includes(q) || period.includes(q);
      const matchesTrend = trendFilter === 'all' || p.trend === trendFilter || (trendFilter === 'up' && (p.trend as string) === 'increasing') || (trendFilter === 'down' && (p.trend as string) === 'decreasing');
      return matchesSearch && matchesTrend;
    });
  }, [predictions, searchTerm, trendFilter]);

  const upCount = predictions.filter((p) => p.trend === 'up' || (p.trend as string) === 'increasing').length;
  const stableCount = predictions.filter((p) => p.trend === 'stable').length;
  const downCount = predictions.filter((p) => p.trend === 'down' || (p.trend as string) === 'decreasing').length;

  const handleCardSelect = (pred: CropPrediction) => {
    setSelectedCropId(pred.crop_id);
    const element = document.getElementById('decision-support-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Modern AgriME Page Header */}
      <PageHeader
        title={translations.prediction.title}
        subtitle={translations.prediction.subtitle}
        badge={isTa ? 'பருவகால விலை மதிப்பீடு & முடிவு ஆதரவு' : 'Seasonal Price Estimates & Decision Support'}
        icon={TrendingUp}
        iconColor="text-blue-700"
        iconBg="bg-blue-50 border-blue-200"
        stats={[
          { label: isTa ? 'கணிப்புகள்' : 'Total Forecasts', value: predictions.length },
          { label: isTa ? 'ஏறும் போக்கு' : 'Rising', value: upCount },
          { label: isTa ? 'நிலையானது' : 'Stable', value: stableCount },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/crop-price?tab=compare"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
            >
              <Scale className="w-4 h-4 text-emerald-100" />
              <span>{translations.prediction.compareMarketPricesBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/crop-price"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
            >
              <span>{isTa ? 'இன்றைய மண்டி விலைகள்' : "View Today's Mandi Prices"}</span>
            </Link>
          </div>
        }
      />

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

        {/* Interactive Crop Price Prediction & Decision-Support Section */}
        <div id="decision-support-section">
          <PredictionDecisionSupport
            predictions={predictions}
            crops={crops}
            markets={markets}
            externalSelectedCropId={selectedCropId}
            onCropChange={(id) => setSelectedCropId(id)}
          />
        </div>

        {/* Section Heading & Filter Bar for All Available Market Projections */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="w-full lg:w-80 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={translations.prediction.searchPlaceholder}
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  {isTa ? 'அழிக்க' : 'Clear'}
                </button>
              )}
            </div>

            {/* Trend Filter Tabs */}
            <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
              <button
                onClick={() => setTrendFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  trendFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isTa ? 'அனைத்து போக்குகள்' : 'All Trends'} ({predictions.length})
              </button>
              <button
                onClick={() => setTrendFilter('up')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                  trendFilter === 'up'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {translations.prediction.increasing} ({upCount})
              </button>
              <button
                onClick={() => setTrendFilter('stable')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                  trendFilter === 'stable'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                {translations.prediction.stable} ({stableCount})
              </button>
              <button
                onClick={() => setTrendFilter('down')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                  trendFilter === 'down'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                {translations.prediction.decreasing} ({downCount})
              </button>
            </div>

          </div>
        </div>

        {/* Prediction Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{translations.prediction.allProjections}</span>
              {!loading && (
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  {filteredPredictions.length} {isTa ? 'பயிர்கள்' : 'Crops'}
                </span>
              )}
            </h2>

            {!loading && predictions.length > 0 && (
              <button
                onClick={() => loadData()}
                className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1"
                title={isTa ? 'புதுப்பிக்க' : 'Refresh predictions'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isTa ? 'புதுப்பிக்க' : 'Refresh'}</span>
              </button>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-3 bg-slate-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="h-20 bg-slate-100 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : predictions.length === 0 ? (
            /* Global Empty State */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">{translations.prediction.noPredictionsFound}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {translations.prediction.noPredictionsDescription}
              </p>
              <button
                onClick={() => loadData()}
                className="mt-5 btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{translations.common.retry}</span>
              </button>
            </div>
          ) : filteredPredictions.length === 0 ? (
            /* Filter Empty State */
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">{translations.common.noResults}</h3>
              <p className="text-xs text-slate-500 mt-1">{translations.prediction.noPredictionsDescription}</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTrendFilter('all');
                }}
                className="mt-4 btn-secondary text-xs py-2 px-4"
              >
                {translations.common.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPredictions.map((prediction) => (
                <PredictionCard
                  key={prediction.id}
                  prediction={prediction}
                  onSelect={handleCardSelect}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
