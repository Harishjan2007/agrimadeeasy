'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Store, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw, 
  MapPin, 
  Filter, 
  Scale, 
  RotateCcw, 
  Info, 
  ArrowRight,
  Navigation,
  Compass,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  X,
  Building2,
  ShieldCheck,
  Package
} from 'lucide-react';
import { Dealer, Crop, CropPrice } from '@/types';
import { getDealers } from '@/lib/supabase/dealers';
import { getCropPrices, getCrops } from '@/lib/supabase/crops';
import DealerCard from '@/components/dealers/DealerCard';
import { PageHeader, EmptyState, CategoryTabs } from '@/components/ui';
import { useLanguage } from '@/i18n';
import { calculateDistanceKm, TAMIL_NADU_DISTRICTS, DistrictPreset } from '@/lib/location';
import { ALL_DEMO_DEALERS, BUYER_TYPES } from '@/lib/dealers-data';

export default function DealersPageClient() {
  const [realDealers, setRealDealers] = useState<Dealer[]>([]);
  const [cropPrices, setCropPrices] = useState<CropPrice[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [activeTab, setActiveTab] = useState<'all' | 'enrolled' | 'demo'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCropId, setSelectedCropId] = useState<string>('all');
  const [selectedBuyerType, setSelectedBuyerType] = useState<string>('all');

  // Geolocation & Radius State (Default Radius: 100 km)
  const [radiusKm, setRadiusKm] = useState<number | 'all'>(100);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationSource, setLocationSource] = useState<'prompting' | 'gps' | 'manual' | 'denied'>('prompting');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

  // Demo Contact Intercept Modal State
  const [demoDealerModal, setDemoDealerModal] = useState<Dealer | null>(null);

  const { language, translations, translateCrop } = useLanguage();
  const isTa = language === 'ta';

  // Request browser geolocation on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.geolocation) {
      setLocationSource('denied');
      setLocationErrorMsg(isTa ? 'உங்கள் உலாவியில் ஜிபிஎஸ் இருப்பிட வசதி இல்லை.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setLocationSource('prompting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setLocationSource('gps');
        setLocationErrorMsg(null);
      },
      (err) => {
        console.warn('Browser geolocation request was denied or timed out:', err.message);
        setLocationSource('denied');
        setLocationErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? (isTa ? 'இருப்பிட அனுமதி வழங்கப்படவில்லை. கீழே உள்ள உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.' : 'Location permission denied. Please choose your district manually below.')
            : (isTa ? 'இருப்பிடத்தைப் பெறுவதில் தாமதம் ஏற்பட்டது. கைமுறையாக மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.' : 'Unable to acquire GPS coordinates. Please select your district below.')
        );
      },
      {
        timeout: 8000,
        enableHighAccuracy: false,
        maximumAge: 60000
      }
    );
  }, [isTa]);

  // Load Real Dealers and Benchmarks
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dealersRes, pricesRes, cropsRes] = await Promise.all([
        getDealers(),
        getCropPrices(),
        getCrops()
      ]);

      if (dealersRes.error) {
        setError(translations.dealers.noDealersDescription);
      } else {
        // Ensure real dealers are explicitly flagged as not demo and verified
        const sanitizedReal = (dealersRes.data || []).map((d) => ({
          ...d,
          isDemo: false,
          verified: true
        }));
        setRealDealers(sanitizedReal);
      }

      if (pricesRes.data) {
        setCropPrices(pricesRes.data);
      }

      if (cropsRes.data) {
        setCrops(cropsRes.data);
      }
    } catch (err) {
      console.error('Failed to load dealers or benchmark prices:', err);
      setError(translations.dealers.noDealersDescription);
    } finally {
      setLoading(false);
    }
  }, [translations.dealers.noDealersDescription]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle manual district selection fallback
  const handleManualDistrictChange = (presetId: string) => {
    setSelectedDistrictId(presetId);
    if (!presetId) {
      setUserCoords(null);
      setLocationSource('denied');
      return;
    }
    const preset = TAMIL_NADU_DISTRICTS.find((p) => p.id === presetId);
    if (preset) {
      setUserCoords({
        latitude: preset.latitude,
        longitude: preset.longitude
      });
      setLocationSource('manual');
      setLocationErrorMsg(null);
    }
  };

  // Re-request GPS
  const handleRequestGps = () => {
    if (!navigator.geolocation) return;
    setLocationSource('prompting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setLocationSource('gps');
        setSelectedDistrictId('');
        setLocationErrorMsg(null);
      },
      (err) => {
        setLocationSource('denied');
        setLocationErrorMsg(err.message || 'GPS request failed');
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // Combine real dealers and 10 demonstration dealers
  const allAvailableDealers = useMemo(() => {
    return [...realDealers, ...ALL_DEMO_DEALERS];
  }, [realDealers]);

  // Extract unique crops bought across all dealers
  const availableCrops = useMemo(() => {
    const cropMap = new Map<string, Crop>();
    allAvailableDealers.forEach((d) => {
      (d.crop_prices || []).forEach((cp) => {
        if (cp.crop && !cropMap.has(cp.crop.id)) {
          cropMap.set(cp.crop.id, cp.crop);
        }
      });
    });
    if (cropMap.size === 0 && crops.length > 0) {
      return crops;
    }
    return Array.from(cropMap.values());
  }, [allAvailableDealers, crops]);

  // Mandi benchmark price when a specific crop is selected
  const activeBenchmark = useMemo(() => {
    if (selectedCropId === 'all') return null;
    const matchingPrices = cropPrices.filter((cp) => cp.crop_id === selectedCropId);
    if (matchingPrices.length === 0) return null;

    const primary = matchingPrices[0];
    const crop = primary.crop || availableCrops.find((c) => c.id === selectedCropId);

    return {
      price: primary.price,
      mandiName: primary.market?.name || 'Regional APMC Mandi',
      location: primary.market?.location || 'Tamil Nadu',
      cropName: crop?.name || 'Crop',
      cropIcon: crop?.icon || '🌾'
    };
  }, [selectedCropId, cropPrices, availableCrops]);

  // Calculate distance, filter, and apply required HIGHEST OFFERED PRICE FIRST ranking
  const filteredAndRankedDealers = useMemo(() => {
    // 1. Calculate distance for all dealers based on active origin coords
    const withDistance = allAvailableDealers.map((dealer) => {
      const dist = userCoords && dealer.latitude && dealer.longitude
        ? calculateDistanceKm(userCoords.latitude, userCoords.longitude, dealer.latitude, dealer.longitude)
        : null;
      return { dealer, distanceKm: dist };
    });

    // Unified listing includes all real enrolled and demo dealers together
    let filtered = withDistance;

    // Filter by Tab (all, enrolled, or demo)
    if (activeTab === 'enrolled') {
      filtered = filtered.filter(({ dealer }) => !dealer.isDemo);
    } else if (activeTab === 'demo') {
      filtered = filtered.filter(({ dealer }) => dealer.isDemo);
    }

    // 3. Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(({ dealer }) => {
        const name = (dealer.shop_name || '').toLowerCase();
        const address = (dealer.address || '').toLowerCase();
        const district = (dealer.district || '').toLowerCase();
        const phone = (dealer.phone || '').toLowerCase();
        const buyerType = (dealer.buyer_type || '').toLowerCase();
        const cropsMatch = (dealer.crop_prices || []).some((cp) =>
          (cp.crop?.name || '').toLowerCase().includes(term) ||
          (cp.crop?.category || '').toLowerCase().includes(term)
        );

        return (
          name.includes(term) ||
          address.includes(term) ||
          district.includes(term) ||
          phone.includes(term) ||
          buyerType.includes(term) ||
          cropsMatch
        );
      });
    }

    // 4. Filter by buyer type
    if (selectedBuyerType !== 'all') {
      filtered = filtered.filter(({ dealer }) => dealer.buyer_type === selectedBuyerType);
    }

    // 5. Filter by radius (Default 100km when userCoords exists)
    if (radiusKm !== 'all' && userCoords) {
      filtered = filtered.filter(({ distanceKm }) => {
        // Exclude dealers beyond radius; keep dealers whose coords are strictly missing without fabricating
        if (distanceKm === null) return true;
        return distanceKm <= radiusKm;
      });
    }

    // 6. Filter by crop if selected
    if (selectedCropId !== 'all') {
      filtered = filtered.filter(({ dealer }) => {
        return (dealer.crop_prices || []).some(
          (cp) => cp.crop_id === selectedCropId && cp.active
        );
      });
    }

    // 7. HIGHEST OFFERED PRICE FIRST — REQUIRED DEFAULT RANKING
    return filtered.sort((a, b) => {
      // Prioritize real enrolled dealers if prices are tied
      if (selectedCropId !== 'all') {
        const aQuote = (a.dealer.crop_prices || []).find((cp) => cp.crop_id === selectedCropId && cp.active);
        const bQuote = (b.dealer.crop_prices || []).find((cp) => cp.crop_id === selectedCropId && cp.active);

        const aPrice = aQuote ? Number(aQuote.buying_price) : 0;
        const bPrice = bQuote ? Number(bQuote.buying_price) : 0;

        // Primary: Highest price first (descending)
        if (bPrice !== aPrice) {
          return bPrice - aPrice;
        }

        // Secondary: Shorter distance first
        const aDist = a.distanceKm !== null ? a.distanceKm : 999999;
        const bDist = b.distanceKm !== null ? b.distanceKm : 999999;
        if (aDist !== bDist) {
          return aDist - bDist;
        }

        // Tertiary: Real enrolled before demo if everything else is equal
        if (a.dealer.isDemo !== b.dealer.isDemo) {
          return a.dealer.isDemo ? 1 : -1;
        }

        return a.dealer.shop_name.localeCompare(b.dealer.shop_name);
      } else {
        // When no specific crop is chosen, rank by distance first (closest buyers), then real before demo
        const aDist = a.distanceKm !== null ? a.distanceKm : 999999;
        const bDist = b.distanceKm !== null ? b.distanceKm : 999999;
        if (aDist !== bDist) {
          return aDist - bDist;
        }

        if (a.dealer.isDemo !== b.dealer.isDemo) {
          return a.dealer.isDemo ? 1 : -1;
        }

        return a.dealer.shop_name.localeCompare(b.dealer.shop_name);
      }
    });
  }, [allAvailableDealers, userCoords, searchTerm, selectedBuyerType, radiusKm, selectedCropId, activeTab]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCropId('all');
    setSelectedBuyerType('all');
    setRadiusKm(100);
    setActiveTab('all');
  };

  const realCount = realDealers.length;
  const demoCount = ALL_DEMO_DEALERS.length;

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Modern Page Header */}
      <PageHeader
        title={translations.dealers.title}
        subtitle={translations.dealers.subtitle}
        badge={translations.dealers.directBuyerBadge}
        icon={Store}
        iconColor="text-amber-700"
        iconBg="bg-amber-50 border-amber-200"
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



        {/* Location & Radius Discovery Panel (Default 100km, Geolocation + Manual Fallback) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isTa ? 'இருப்பிட அடிப்படையிலான கொள்முதலாளர் கண்டறிதல்' : 'Location-Based Produce Buyer Discovery'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTa 
                    ? '100 கி.மீ இயல்புநிலை சுற்றளவில் மிக உயர்ந்த கொள்முதல் விலை வழங்கும் வியாபாரிகளை முதலில் காண்க.' 
                    : 'Discover nearby traders offering the highest purchase prices within a default 100 km radius.'}
                </p>
              </div>
            </div>

            {/* GPS Status Indicator & Action */}
            <div className="flex items-center gap-2 shrink-0">
              {locationSource === 'gps' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                  <Crosshair className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>{isTa ? 'ஜிபிஎஸ் இயங்குகிறது' : 'GPS Location Active'}</span>
                </span>
              )}

              {locationSource === 'manual' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isTa ? 'மாவட்ட மையம் (நேரடி தேர்வு)' : 'District Center (Manual)'}</span>
                </span>
              )}

              {locationSource === 'prompting' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 animate-pulse">
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isTa ? 'இருப்பிடம் கண்டறியப்படுகிறது...' : 'Acquiring GPS...'}</span>
                </span>
              )}

              <button
                type="button"
                onClick={handleRequestGps}
                className="text-xs font-semibold text-slate-700 hover:text-amber-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
                title={isTa ? 'ஜிபிஎஸ் புதுப்பிக்க' : 'Refresh GPS coordinates'}
              >
                <Crosshair className="w-3.5 h-3.5 text-amber-700" />
                <span>{translations.dealers.useCurrentLocation}</span>
              </button>
            </div>
          </div>

          {/* Location Denied / Fallback Explanation Alert */}
          {locationSource === 'denied' && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{translations.dealers.locationUnavailable}</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {translations.dealers.locationFallbackDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Location Controls: Radius Selector + Manual District Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 pt-1">
            {/* Radius Selector (Default 100km) */}
            <div className="lg:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>{translations.dealers.radius}:</span>
                <span className="text-amber-800 font-black">
                  {radiusKm === 'all' ? (isTa ? 'முழு தமிழ்நாடு (வரம்பற்றது)' : 'All / Statewide') : `${radiusKm} km`}
                </span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[25, 50, 100, 200].map((dist) => (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => setRadiusKm(dist)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      radiusKm === dist
                        ? 'bg-amber-800 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    {dist} km {dist === 100 && (isTa ? '(இயல்பு)' : '(Default)')}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRadiusKm('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    radiusKm === 'all'
                      ? 'bg-amber-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                  }`}
                >
                  {isTa ? 'அனைத்தும் (வரம்பற்றது)' : 'All / Statewide'}
                </button>
              </div>
            </div>

            {/* Manual District Selection Fallback */}
            <div className="lg:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {translations.dealers.manualDistrict}
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => handleManualDistrictChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-2xs"
              >
                <option value="">
                  {userCoords && locationSource === 'gps'
                    ? (isTa ? '📍 தானியங்கி ஜிபிஎஸ் இருப்பிடம் செயலில் உள்ளது' : '📍 Device GPS origin active (select to override)')
                    : (isTa ? '-- உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும் --' : '-- Choose your Tamil Nadu district --')}
                </option>
                {TAMIL_NADU_DISTRICTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    📍 {isTa ? p.nameTa : p.name} ({p.state})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actionable Filters Bar (Crop + Buyer Type + Search) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 mb-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>{isTa ? 'கொள்முதல் வடிகட்டிகள் & தேடல்' : 'Buying Filters & Crop Selection'}</span>
            </h3>
            {(searchTerm || selectedCropId !== 'all' || selectedBuyerType !== 'all' || radiusKm !== 100) && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-slate-500 hover:text-amber-700 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{translations.dealers.clearFilters}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* 1. Crop Dropdown Filter — Drives the Required Highest Offered Price First Ranking */}
            <div className="lg:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>{translations.dealers.cropFilterLabel}</span>
                <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {translations.dealers.sortHighestPrice}
                </span>
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full bg-slate-50 border-2 border-amber-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-2xs"
              >
                <option value="all">{translations.dealers.allCrops} ({availableCrops.length})</option>
                {availableCrops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon || '🌾'} {translateCrop(c.name)} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Buyer Type Dropdown Filter */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {translations.dealers.buyerTypeLabel}
              </label>
              <select
                value={selectedBuyerType}
                onChange={(e) => setSelectedBuyerType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-2xs"
              >
                <option value="all">{isTa ? 'அனைத்து வணிக வகைகள்' : 'All Buyer Types'}</option>
                {BUYER_TYPES.filter((t) => t !== 'All Buyer Types').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Text Search Input */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {translations.dealers.searchPlaceholder}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={translations.dealers.searchPlaceholder}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-2xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Crop Selection Prompt Banner (When All Crops is selected) */}
        {selectedCropId === 'all' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-center gap-3 text-amber-900 text-xs">
            <Info className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <p className="font-bold">{translations.dealers.selectCropPrompt}</p>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                {isTa
                  ? 'தற்போது அருகிலுள்ள அனைத்து கொள்முதலாளிகளும் தூரத்தின் அடிப்படையில் பட்டியலிடப்பட்டுள்ளனர்.'
                  : 'Currently showing all nearby dealers ordered by proximity. Select a crop to compare exact prices.'}
              </p>
            </div>
          </div>
        )}

        {/* Mandi Benchmark Price Comparison Banner (When a specific crop is selected) */}
        {activeBenchmark && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-amber-200 flex items-center justify-center text-2xl shadow-2xs shrink-0">
                {activeBenchmark.cropIcon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    {translations.dealers.mandiBenchmark}:
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {translateCrop(activeBenchmark.cropName)}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    {translations.dealers.sortHighestPrice}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {activeBenchmark.mandiName} ({activeBenchmark.location})
                </p>
                <p className="text-[11px] text-amber-900/80 mt-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>{translations.dealers.mandiBenchmarkNotice}</span>
                </p>
              </div>
            </div>

            <div className="bg-white px-5 py-3 rounded-xl border border-amber-200/90 text-right shrink-0 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Regional APMC Mandi Rate
              </span>
              <span className="text-xl font-black text-slate-950">
                ₹{activeBenchmark.price.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-500">/Q</span>
              </span>
            </div>
          </div>
        )}

        {/* Dealers Grid & Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{translations.dealers.title}</span>
              {!loading && (
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                  {filteredAndRankedDealers.length} {isTa ? 'வியாபாரிகள்' : 'Produce Buyers'}
                </span>
              )}
            </h2>

            {!loading && (
              <div className="flex items-center gap-3 flex-wrap">
                <CategoryTabs
                  tabs={[
                    { id: 'all', label: translations.dealers.allDealersTab, count: allAvailableDealers.length },
                    { id: 'enrolled', label: translations.dealers.enrolledDealersTab, count: realCount },
                    { id: 'demo', label: translations.dealers.demoDealersTab, count: demoCount }
                  ]}
                  activeTab={activeTab}
                  onChange={(tabId) => setActiveTab(tabId as 'all' | 'enrolled' | 'demo')}
                  variant="pill"
                  size="sm"
                />

                <div className="flex items-center gap-2 text-xs text-slate-500 pl-2 border-l border-slate-200">
                  <button
                    onClick={() => loadData()}
                    className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                    title={isTa ? 'புதுப்பிக்க' : 'Refresh dealers'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isTa ? 'புதுப்பிக்க' : 'Refresh'}</span>
                  </button>
                </div>
              </div>
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
          ) : allAvailableDealers.length === 0 ? (
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
          ) : filteredAndRankedDealers.length === 0 ? (
            /* Filter Empty State */
            <EmptyState
              title={translations.dealers.noDealersForFilter}
              description={translations.dealers.noDealersDescription}
              actionLabel={translations.dealers.clearFilters}
              onAction={handleClearFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndRankedDealers.map(({ dealer, distanceKm }) => (
                <DealerCard 
                  key={dealer.id} 
                  dealer={dealer}
                  selectedCropId={selectedCropId}
                  mandiBenchmarkPrice={activeBenchmark?.price || null}
                  mandiName={activeBenchmark?.mandiName}
                  distanceKm={distanceKm}
                  onDemoContactClick={(d) => setDemoDealerModal(d)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Demonstration Dealer Contact Intercept Modal */}
      {demoDealerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                  <AlertTriangle className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {translations.dealers.demoNoticeModalTitle}
                  </h3>
                  <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 mt-0.5">
                    {translations.dealers.demoDealerBadge}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDemoDealerModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
              <p className="font-semibold text-slate-900 text-sm">
                {demoDealerModal.shop_name}
              </p>
              <p className="text-slate-700">
                {translations.dealers.demoNoticeModalDesc}
              </p>
              <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-900">
                <p>📍 <strong>{isTa ? 'மாதிரி இடம்: ' : 'Sample Location: '}</strong> {demoDealerModal.address}</p>
                <p>📞 <strong>{isTa ? 'மாதிரி எண்: ' : 'Sample Hotline: '}</strong> {demoDealerModal.phone}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDemoDealerModal(null);
                  setActiveTab('enrolled');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors"
              >
                {isTa ? 'சரிபார்க்கப்பட்ட வியாபாரிகளைப் பார்க்க' : 'Browse Verified Buyers'}
              </button>
              <button
                type="button"
                onClick={() => setDemoDealerModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
              >
                {isTa ? 'புரிந்தது / மூடுக' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
