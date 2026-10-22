'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar,
  Building2,
  MapPin,
  Clock,
  AlertCircle,
  ArrowRight,
  Database,
  ChevronDown,
  Info,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/lib/supabase/useAuth';
import { POPULAR_CROPS_ONBOARDING } from '@/lib/indian-geography';
import type { FilterOptions } from '@/lib/historical-data';

export default function InteractivePredictionSection() {
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const { profile } = useAuth();

  // Filter options from historical dataset
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Form selections
  const [selectedCrop, setSelectedCrop] = useState<string>('tomato');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [selectedHorizon, setSelectedHorizon] = useState<'7 Days' | '15 Days' | '30 Days'>('15 Days');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [debouncedCustomPrice, setDebouncedCustomPrice] = useState<string>('');
  const [priceError, setPriceError] = useState<string | null>(null);

  // Prediction inference result
  const [predictionData, setPredictionData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request cancellation and race-condition tracking refs
  const latestRequestIdRef = useRef<number>(0);
  const lastFetchedKeyRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch filter options on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        setOptionsLoading(true);
        const res = await fetch('/api/historical-prices?action=options');
        const json = await res.json();
        if (json.success && json.data) {
          setFilterOptions(json.data);
          if (json.data.crops && json.data.crops.length > 0) {
            const initialCrop = json.data.crops.find((c: any) => c.slug === 'tomato') || json.data.crops[0];
            setSelectedCrop(initialCrop.slug);
          }
        }
      } catch (err) {
        console.error('Failed to load prediction filter options:', err);
      } finally {
        setOptionsLoading(false);
      }
    }
    loadOptions();
  }, []);

  // 2. Debounce and validate manual price input
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = customPrice.trim();
      if (trimmed === '') {
        setPriceError(null);
        setDebouncedCustomPrice('');
      } else {
        const num = Number(trimmed);
        if (isNaN(num) || num <= 0) {
          setPriceError(
            isTa
              ? 'தயவுசெய்து சரியான நேர்மறை விலையை உள்ளிடவும் (எ.கா. 2500)'
              : 'Please enter a valid positive base price (e.g. 2500)'
          );
        } else {
          setPriceError(null);
          setDebouncedCustomPrice(trimmed);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [customPrice, isTa]);

  // 3. Dependent markets for current district
  const availableMarketsForDistrict = useMemo(() => {
    if (!filterOptions) return [];
    if (selectedDistrict === 'all') {
      const allM: string[] = [];
      Object.values(filterOptions.marketsByDistrict).forEach((list) => {
        list.forEach((m) => {
          if (!allM.includes(m)) allM.push(m);
        });
      });
      return allM.sort();
    }
    return filterOptions.marketsByDistrict[selectedDistrict] || [];
  }, [filterOptions, selectedDistrict]);

  // Handle District Change - reset dependent market to valid default
  const handleDistrictChange = (d: string) => {
    setSelectedDistrict(d);
    setSelectedMarket('all');
  };

  // Ensure selected market is valid for selected district
  useEffect(() => {
    if (selectedDistrict !== 'all' && selectedMarket !== 'all' && availableMarketsForDistrict.length > 0) {
      if (!availableMarketsForDistrict.includes(selectedMarket)) {
        setSelectedMarket('all');
      }
    }
  }, [selectedDistrict, selectedMarket, availableMarketsForDistrict]);

  // 4. Core Prediction Fetching with Version Tracking and Cancellation
  const executePrediction = useCallback(
    async (
      crop: string,
      district: string,
      market: string,
      horizon: string,
      price: string,
      forceRefresh = false
    ) => {
      if (!crop) return;

      const paramsKey = JSON.stringify({ crop, district, market, horizon, price });
      if (!forceRefresh && paramsKey === lastFetchedKeyRef.current) {
        return; // Prevent duplicate requests
      }

      // Abort previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const requestId = ++latestRequestIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          crop,
          district,
          market,
          horizon
        });

        if (price && Number(price) > 0) {
          params.set('current_price', price);
        }

        const res = await fetch(`/api/predictions/predict?${params.toString()}`, {
          signal: controller.signal
        });

        if (requestId !== latestRequestIdRef.current) return;

        const json = await res.json();

        if (requestId !== latestRequestIdRef.current) return;

        if (!json.success) {
          throw new Error(json.error || (isTa ? 'விலை கணிப்பு தோல்வியடைந்தது' : 'Prediction generation failed'));
        }

        lastFetchedKeyRef.current = paramsKey;
        setPredictionData(json.data);
        setError(null);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        if (requestId === latestRequestIdRef.current) {
          console.error('Prediction fetch error:', err);
          setError(err.message || (isTa ? 'விலை கணிப்பு தோல்வியடைந்தது' : 'Failed to generate prediction'));
          // Do not retain previous prediction if current request failed
          setPredictionData(null);
        }
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [isTa]
  );

  // 5. Automatic Prediction Trigger on Any Input Change
  useEffect(() => {
    if (!filterOptions || !selectedCrop) return;
    if (priceError) return; // Prevent generating misleading predictions for invalid manual price

    executePrediction(
      selectedCrop,
      selectedDistrict,
      selectedMarket,
      selectedHorizon,
      debouncedCustomPrice
    );
  }, [
    filterOptions,
    selectedCrop,
    selectedDistrict,
    selectedMarket,
    selectedHorizon,
    debouncedCustomPrice,
    priceError,
    executePrediction
  ]);

  // Abort on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Retry action for failed requests
  const handleRetry = () => {
    if (!selectedCrop) return;
    executePrediction(
      selectedCrop,
      selectedDistrict,
      selectedMarket,
      selectedHorizon,
      debouncedCustomPrice,
      true
    );
  };

  // Dedicated crop selector change for Multi-Horizon Forecast Projections
  const handleHorizonCropChange = (newCropSlug: string) => {
    setSelectedCrop(newCropSlug);
  };

  // Formatted forecast date helper
  const formattedForecastDate = (() => {
    if (!predictionData?.forecastDate) return '';
    try {
      const d = new Date(predictionData.forecastDate);
      if (isNaN(d.getTime())) return predictionData.forecastDate;
      return d.toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return predictionData.forecastDate;
    }
  })();

  // Location display string
  const locationDisplay = (() => {
    if (!predictionData) return '';
    const market =
      predictionData.selectedMarket === 'all' || predictionData.selectedMarket === 'All Mandis'
        ? isTa
          ? 'அனைத்து மண்டிகள்'
          : 'All Mandis'
        : predictionData.selectedMarket;
    const district =
      predictionData.selectedDistrict === 'all' || predictionData.selectedDistrict === 'Tamil Nadu'
        ? isTa
          ? 'தமிழ்நாடு'
          : 'Tamil Nadu'
        : predictionData.selectedDistrict;
    return `${market} • ${district}`;
  })();

  // Price difference vs base reference price
  const priceDiff = predictionData
    ? Math.round(predictionData.predictedPrice - predictionData.currentPrice)
    : 0;

  // Trend badge helper for table rows
  const renderTrendBadge = (trend: string) => {
    if (trend === 'up') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isTa ? 'ஏறும் போக்கு (↗)' : 'Rising (↗)'}</span>
        </span>
      );
    }
    if (trend === 'down') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
          <TrendingDown className="w-3.5 h-3.5 text-rose-700" />
          <span>{isTa ? 'இறங்கும் போக்கு (↘)' : 'Falling (↘)'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-300">
        <Minus className="w-3.5 h-3.5 text-slate-600" />
        <span>{isTa ? 'நிலையானது (→)' : 'Stable (→)'}</span>
      </span>
    );
  };

  // Farmer-friendly trend indicator for the main result box
  const renderFarmerTrend = () => {
    if (!predictionData) return null;
    if (predictionData.trend === 'up') {
      return (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>{isTa ? 'விலை ஏறும் போக்கு (↗ Rising)' : 'Rising (↗)'}</span>
          </span>
          {priceDiff > 0 && (
            <span className="text-xs text-emerald-300/90 font-medium">
              {isTa
                ? `தற்போதைய விலையை விட (₹${predictionData.currentPrice.toLocaleString('en-IN')}) சுமார் +₹${priceDiff.toLocaleString('en-IN')} அதிகம் எதிர்பார்க்கப்படுகிறது`
                : `Expected +₹${priceDiff.toLocaleString('en-IN')} vs current reference price (₹${predictionData.currentPrice.toLocaleString('en-IN')})`}
            </span>
          )}
        </div>
      );
    }
    if (predictionData.trend === 'down') {
      return (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-rose-500/20 text-rose-300 border border-rose-400/40 shadow-xs">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>{isTa ? 'விலை இறங்கும் போக்கு (↘ Falling)' : 'Falling (↘)'}</span>
          </span>
          {priceDiff < 0 && (
            <span className="text-xs text-rose-300/90 font-medium">
              {isTa
                ? `தற்போதைய விலையை விட (₹${predictionData.currentPrice.toLocaleString('en-IN')}) சுமார் -₹${Math.abs(priceDiff).toLocaleString('en-IN')} குறைவு எதிர்பார்க்கப்படுகிறது`
                : `Expected -₹${Math.abs(priceDiff).toLocaleString('en-IN')} vs current reference price (₹${predictionData.currentPrice.toLocaleString('en-IN')})`}
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-slate-700/60 text-slate-200 border border-slate-600/60 shadow-xs">
          <Minus className="w-4 h-4 text-slate-300" />
          <span>{isTa ? 'நிலையான விலை (→ Stable)' : 'Stable (→)'}</span>
        </span>
        <span className="text-xs text-slate-300 font-medium">
          {isTa
            ? `தற்போதைய விலைக்கு (₹${predictionData.currentPrice.toLocaleString('en-IN')}) அருகிலேயே நிலைத்திருக்கும் என எதிர்பார்க்கப்படுகிறது`
            : `Expected steady near current reference price (₹${predictionData.currentPrice.toLocaleString('en-IN')})`}
        </span>
      </div>
    );
  };

  return (
    <div id="interactive-prediction-section" className="space-y-6">
      {/* Interactive Form Card (Submit button removed, automatic updates enabled) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isTa ? 'இயந்திர கற்றல் விலை கணிப்பு' : 'Automatic Crop Price Prediction'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {isTa ? 'பயிர் விலை மதிப்பீடு உள்ளீடுகள்' : 'Real-Time Crop Price Forecast'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isTa
                ? 'பயிர், மாவட்டம் அல்லது சந்தையை மாற்றியவுடன் கணிப்பு உடனடியாக தானாகவே புதுப்பிக்கப்படும்.'
                : 'Select your crop, district, market, or horizon below to automatically update the forecast.'}
            </p>
          </div>

          {/* Unobtrusive Live Status Indicator replacing the former Submit button */}
          <div className="shrink-0 flex items-center">
            {loading ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>{isTa ? 'கணிக்கிறது...' : 'Updating Forecast...'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isTa ? 'தானியங்கி கணிப்பு தயார்' : 'Auto-Updates on Change'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Personalized Crop & District Quick Selection */}
        {(profile?.primary_crops?.length || profile?.district) && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isTa ? 'உங்கள் விருப்பப் பயிர்கள்:' : 'Your Primary Crops:'}</span>
              </span>

              {profile.primary_crops && profile.primary_crops.map(cId => {
                const match = POPULAR_CROPS_ONBOARDING.find(c => c.id === cId);
                const isSelected = selectedCrop === cId || (cId === 'paddy' && selectedCrop.includes('paddy'));
                return (
                  <button
                    key={cId}
                    type="button"
                    onClick={() => setSelectedCrop(cId)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{match?.icon || '🌾'}</span>
                    <span>{match ? (isTa ? match.nameTa : match.name) : cId}</span>
                  </button>
                );
              })}

              {profile.district && filterOptions?.districts.includes(profile.district) && (
                <button
                  type="button"
                  onClick={() => handleDistrictChange(profile.district!)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    selectedDistrict === profile.district
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'
                  }`}
                  title={isTa ? 'உங்கள் மாவட்டம்' : 'Your District'}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{profile.district}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Crop Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{isTa ? 'பயிர் / விளைபொருள்' : 'Supported Crop'}</span>
              <span className="text-[10px] text-emerald-700 font-semibold">139 Crops</span>
            </label>
            <div className="relative">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                disabled={optionsLoading}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 cursor-pointer disabled:opacity-50"
              >
                {filterOptions?.crops.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} ({c.count.toLocaleString()} rows)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. District Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{isTa ? 'மாவட்டம்' : 'District'}</span>
              <span className="text-[10px] text-purple-700 font-semibold">36 Districts</span>
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={optionsLoading}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 cursor-pointer disabled:opacity-50"
              >
                <option value="all">{isTa ? 'அனைத்து மாவட்டங்களும் (State-wide)' : 'All Districts (Tamil Nadu)'}</option>
                {filterOptions?.districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Market Dropdown (Dependent on district) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{isTa ? 'ஒழுங்குமுறை மண்டி' : 'APMC Market'}</span>
              <span className="text-[10px] text-amber-700 font-semibold">
                {availableMarketsForDistrict.length} Markets
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                disabled={optionsLoading}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 cursor-pointer disabled:opacity-50"
              >
                <option value="all">{isTa ? 'அனைத்து மண்டிகளும்' : 'All Mandis in District'}</option>
                {availableMarketsForDistrict.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 4. Horizon Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {isTa ? 'கணிப்பு காலம்' : 'Prediction Horizon'}
            </label>
            <div className="relative">
              <select
                value={selectedHorizon}
                onChange={(e) => setSelectedHorizon(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 cursor-pointer"
              >
                <option value="7 Days">7 Days (Short-term)</option>
                <option value="15 Days">15 Days (Harvest Forecast)</option>
                <option value="30 Days">30 Days (Monthly Trend)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Optional Custom Current Price Input with Validation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {isTa
                ? 'தற்போதைய விலை காலியாக இருந்தால், தேர்ந்தெடுக்கப்பட்ட மண்டியின் சமீபத்திய சந்தை விலை தானாகவே பயன்படுத்தப்படும்.'
                : 'Current price automatically populates from the latest historical auction rate in the selected market.'}
            </span>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{isTa ? 'தனிப்பயன் விலை:' : 'Override Base Price:'}</span>
              <div className="relative w-36">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  placeholder="Auto-fetch"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  min="1"
                  className={`w-full pl-6 pr-2 py-1.5 bg-slate-50 border rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 ${
                    priceError
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>
            {priceError && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{priceError}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error State with Direct Retry Option */}
      {error && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">{isTa ? 'கணிப்பு பிழை' : 'Prediction Error'}</p>
              <p className="text-xs text-rose-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shrink-0 shadow-xs self-start sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isTa ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry Prediction'}</span>
          </button>
        </div>
      )}

      {/* Initial Loading Skeleton */}
      {loading && !predictionData && !error && (
        <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl animate-pulse space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-28 bg-slate-800 rounded-full" />
            <div className="h-6 w-36 bg-slate-800 rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-40 bg-slate-800 rounded" />
            <div className="h-12 w-64 bg-slate-800 rounded-xl" />
          </div>
          <div className="h-24 bg-slate-800/60 rounded-2xl" />
        </div>
      )}

      {/* 2. Farmer-Friendly Prediction Results Box */}
      {predictionData && (
        <div className="space-y-6">
          {/* Main Forecast Hero Card (Ordered according to Section 2.7) */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800 space-y-6">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* 1. Selected crop, district/market, and forecast horizon */}
            <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{predictionData.selectedCrop.name}</span>
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{locationDisplay}</span>
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{predictionData.horizon}</span>
                </span>
              </div>

              {loading && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>{isTa ? 'புதுப்பிக்கிறது...' : 'Updating...'}</span>
                </div>
              )}
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Items 2, 3, 4, 5 */}
              <div className="lg:col-span-7 space-y-5">
                {/* 2. Expected Market Price — largest and most prominent */}
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-blue-300 uppercase tracking-wider">
                    {isTa ? 'எதிர்பார்க்கப்படும் சந்தை விலை' : 'Expected Market Price'}
                  </p>
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
                      ₹{predictionData.predictedPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-300">
                      {isTa ? 'குவிண்டாலுக்கு' : 'per quintal'}
                    </span>
                  </div>
                </div>

                {/* 3. Estimated Price Range — clearly labelled with the price unit */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      {isTa ? 'மதிப்பிடப்பட்ட விலை வரம்பு' : 'Estimated Price Range'}
                    </span>
                    <p className="text-lg sm:text-xl font-black text-emerald-300 mt-0.5">
                      ₹{predictionData.predictedMin.toLocaleString('en-IN')} – ₹{predictionData.predictedMax.toLocaleString('en-IN')}{' '}
                      <span className="text-xs sm:text-sm font-semibold text-slate-300">
                        {isTa ? 'குவிண்டாலுக்கு' : 'per quintal'}
                      </span>
                    </p>
                  </div>

                  {/* Visual Range bar showing expected price relative to bounds */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>₹{predictionData.predictedMin.toLocaleString('en-IN')}</span>
                      <span className="text-white font-bold">
                        {isTa ? 'கணிக்கப்பட்டது:' : 'Expected:'} ₹{predictionData.predictedPrice.toLocaleString('en-IN')}
                      </span>
                      <span>₹{predictionData.predictedMax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-blue-400 to-emerald-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              15,
                              ((predictionData.predictedPrice - predictionData.predictedMin) /
                                Math.max(1, predictionData.predictedMax - predictionData.predictedMin)) *
                                100
                            )
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Expected Trend — Rising, Stable, or Falling */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isTa ? 'எதிர்பார்க்கப்படும் போக்கு' : 'Expected Trend'}
                  </p>
                  {renderFarmerTrend()}
                </div>

                {/* 5. Forecast date and horizon */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 pt-1">
                  <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    {isTa ? 'கணிப்பு இலக்கு தேதி:' : 'Forecast Date:'}{' '}
                    <strong className="text-white font-bold">{formattedForecastDate}</strong> ({predictionData.horizon}{' '}
                    {isTa ? 'கணிப்பு' : 'horizon'})
                  </span>
                </div>
              </div>

              {/* Right Column: Items 6 & 7 */}
              <div className="lg:col-span-5 space-y-4">
                {/* 6. Plain language note: price is an estimate, not a guarantee */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3 text-slate-300">
                  <Info className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-200">
                      {isTa ? 'விவசாயிகளுக்கான குறிப்பு' : 'Note for Farmers'}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isTa
                        ? 'சந்தை வரத்து மற்றும் விளைபொருளின் தரத்தைப் பொறுத்து உண்மையான விற்பனை விலை மாறுபடலாம். இது திட்டமிடுவதற்கான விலை வழிகாட்டுதலே தவிர, உத்தரவாதமான விலை அல்ல.'
                        : 'Actual market prices may vary based on daily mandi arrivals and crop quality. This price estimate is for planning purposes and is not a guaranteed buying or selling rate.'}
                    </p>
                  </div>
                </div>

                {/* 7. Simplified action: view past prices for selected crop */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Database className="w-4 h-4" />
                    <span>{isTa ? 'முந்தைய சந்தை விலைகள்' : 'Past Market Prices'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isTa
                      ? `${predictionData.selectedCrop.name} பயிருக்கான முந்தைய ஏல விலைகள் மற்றும் போக்குகளைக் காண்க.`
                      : `Check previous mandi auction rates and historical price patterns for ${predictionData.selectedCrop.name}.`}
                  </p>

                  <Link
                    href={`/crop-price?tab=historical&crop=${predictionData.selectedCrop.slug}&district=${encodeURIComponent(
                      predictionData.selectedDistrict
                    )}&market=${encodeURIComponent(predictionData.selectedMarket)}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all group"
                  >
                    <Database className="w-4 h-4" />
                    <span>{isTa ? 'இந்த பயிரின் முந்தைய விலைகளைக் காண்க' : 'View Past Prices for This Crop'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Horizon Forecast Projections Table with Dedicated Crop Selector */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {isTa ? 'கால எல்லை கணிப்பு ஒப்பீடு' : 'Multi-Horizon Forecast Projections'}
                  </h3>
                  {predictionData?.selectedCrop && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {predictionData.selectedCrop.name}
                    </span>
                  )}
                  {loading && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                      {isTa ? 'புதுப்பிக்கிறது...' : 'Updating...'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isTa
                    ? `${predictionData?.selectedCrop?.name || 'பயிர்'} - 7 நாள், 15 நாள் மற்றும் 30 நாள் கணிக்கப்பட்ட விலைகள் மற்றும் போக்குகள்.`
                    : `Projected prices, estimated price ranges, and trend directions for ${predictionData?.selectedCrop?.name || 'selected crop'} across 7-day, 15-day, and 30-day horizons.`}
                </p>
              </div>

              {/* Clearly Labelled Crop Selector */}
              <div className="flex items-center gap-2.5 shrink-0">
                <label htmlFor="horizon-crop-select" className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  {isTa ? 'பயிர்:' : 'Crop:'}
                </label>
                <div className="relative min-w-[200px] sm:min-w-[220px]">
                  <select
                    id="horizon-crop-select"
                    value={selectedCrop}
                    onChange={(e) => handleHorizonCropChange(e.target.value)}
                    disabled={optionsLoading || loading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {filterOptions?.crops.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto relative">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>{isTa ? 'கணிப்பு புதுப்பிக்கப்படுகிறது...' : 'Calculating Crop Projections...'}</span>
                  </div>
                </div>
              )}
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">{isTa ? 'கால எல்லை' : 'Horizon'}</th>
                    <th className="px-5 py-3">{isTa ? 'இலக்கு தேதி' : 'Forecast Date'}</th>
                    <th className="px-5 py-3 text-right">{isTa ? 'கணிக்கப்பட்ட விலை' : 'Predicted Price'}</th>
                    <th className="px-5 py-3 text-right">{isTa ? 'மதிப்பிடப்பட்ட வரம்பு' : 'Estimated Range'}</th>
                    <th className="px-5 py-3 text-center">{isTa ? 'போக்கு' : 'Trend'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {predictionData.multiHorizonProjections?.map((proj: any, idx: number) => {
                    const isSelected = proj.horizon === predictionData.horizon;
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isSelected ? 'bg-blue-50/60 font-bold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{proj.horizon}</span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap">{proj.targetDate}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-black text-blue-900 whitespace-nowrap">
                          ₹{proj.predictedPrice.toLocaleString('en-IN')} / Q
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-slate-600 whitespace-nowrap">
                          ₹{proj.predictedMin.toLocaleString('en-IN')} – ₹{proj.predictedMax.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          {renderTrendBadge(proj.trend)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
