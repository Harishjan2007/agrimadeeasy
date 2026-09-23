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
  ArrowRight
} from 'lucide-react';
import { Dealer, Crop, CropPrice } from '@/types';
import { getDealers } from '@/lib/supabase/dealers';
import { getCropPrices, getCrops } from '@/lib/supabase/crops';
import DealerCard from '@/components/dealers/DealerCard';
import { PageHeader, EmptyState } from '@/components/ui';
import { useLanguage } from '@/i18n';

export default function DealersPageClient() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [cropPrices, setCropPrices] = useState<CropPrice[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCropId, setSelectedCropId] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const { language, translations, translateCrop } = useLanguage();
  const isTa = language === 'ta';

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
        setDealers(dealersRes.data);
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

  // Extract unique locations/districts from dealer addresses
  const availableLocations = useMemo(() => {
    const locations = new Set<string>();
    dealers.forEach((d) => {
      const addr = d.address;
      if (addr.includes('Vellore')) locations.add('Vellore');
      if (addr.includes('Thiruvannamalai')) locations.add('Thiruvannamalai');
      if (addr.includes('Salem')) locations.add('Salem');
      if (addr.includes('Kanchipuram')) locations.add('Kanchipuram');
      if (addr.includes('Guntur')) locations.add('Guntur');
    });
    return Array.from(locations);
  }, [dealers]);

  // Extract unique crops bought across all dealers
  const availableCrops = useMemo(() => {
    const cropMap = new Map<string, Crop>();
    dealers.forEach((d) => {
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
  }, [dealers, crops]);

  // Mandi benchmark price when a specific crop is selected
  const activeBenchmark = useMemo(() => {
    if (selectedCropId === 'all') return null;
    const matchingPrices = cropPrices.filter((cp) => cp.crop_id === selectedCropId);
    if (matchingPrices.length === 0) return null;

    // Pick highest or first regional mandi price
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

  // Filter dealers by search, crop bought, and location
  const filteredDealers = useMemo(() => {
    return dealers.filter((dealer) => {
      const term = searchTerm.toLowerCase().trim();
      const name = dealer.shop_name.toLowerCase();
      const address = dealer.address.toLowerCase();
      const phone = dealer.phone.toLowerCase();

      // Search term filter
      const matchesSearch = !term ||
        name.includes(term) ||
        address.includes(term) ||
        phone.includes(term) ||
        (dealer.crop_prices || []).some(
          (cp) => cp.crop?.name.toLowerCase().includes(term) || cp.crop?.category?.toLowerCase().includes(term)
        );

      // Crop filter
      const matchesCrop = selectedCropId === 'all' ||
        (dealer.crop_prices || []).some((cp) => cp.crop_id === selectedCropId && cp.active);

      // Location filter
      const matchesLocation = selectedLocation === 'all' ||
        address.toLowerCase().includes(selectedLocation.toLowerCase());

      return matchesSearch && matchesCrop && matchesLocation;
    });
  }, [dealers, searchTerm, selectedCropId, selectedLocation]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCropId('all');
    setSelectedLocation('all');
  };

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
        stats={[
          { label: isTa ? 'வியபாரிகள்' : 'Total Buyers', value: dealers.length },
          { label: isTa ? 'மாவட்டங்கள்' : 'Districts', value: availableLocations.length },
          { label: isTa ? 'கொள்முதல் பயிர்கள்' : 'Crops Bought', value: availableCrops.length },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/map?category=dealers"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
            >
              <MapPin className="w-4 h-4 text-agri-600" />
              <span>{isTa ? 'வரைபடத்தில் காண்க' : 'View on Map'}</span>
            </Link>
            <Link
              href="/crop-price"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all"
            >
              <TrendingUp className="w-4 h-4 text-white" />
              <span>{isTa ? 'மண்டி விலை ஒப்பீடு' : 'Check Mandi Benchmarks'}</span>
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

        {/* Search & Actionable Filters Bar (Crop + Location + Search) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 mb-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>{isTa ? 'விற்பனை வடிகட்டிகள் & தேடல்' : 'Dealer Discovery & Buying Filters'}</span>
            </h3>
            {(searchTerm || selectedCropId !== 'all' || selectedLocation !== 'all') && (
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
            {/* 1. Crop Dropdown Filter */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                {translations.dealers.cropFilterLabel}
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-2xs"
              >
                <option value="all">{translations.dealers.allCrops} ({availableCrops.length})</option>
                {availableCrops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon || '🌾'} {translateCrop(c.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Location / District Filter */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                {translations.dealers.locationFilterLabel}
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-2xs"
              >
                <option value="all">{translations.dealers.allLocations} ({availableLocations.length})</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Text Search Input */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
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

            <div className="bg-white px-5 py-3 rounded-xl border border-amber-200/90 text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                APMC Mandi Rate
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{translations.dealers.title}</span>
              {!loading && (
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                  {filteredDealers.length} {isTa ? 'வியாபாரிகள்' : 'Verified Buyers'}
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
            <EmptyState
              title={translations.dealers.noDealersForFilter}
              description={translations.dealers.noDealersDescription}
              actionLabel={translations.dealers.clearFilters}
              onAction={handleClearFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDealers.map((dealer) => (
                <DealerCard 
                  key={dealer.id} 
                  dealer={dealer}
                  selectedCropId={selectedCropId}
                  mandiBenchmarkPrice={activeBenchmark?.price || null}
                  mandiName={activeBenchmark?.mandiName}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
