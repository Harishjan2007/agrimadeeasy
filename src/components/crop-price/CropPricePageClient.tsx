'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Building2, 
  Calculator, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { CropPrice, Crop, Market } from '@/types';
import { getCropPrices, getCrops, getMarkets } from '@/lib/supabase/crops';
import CropPriceCard from '@/components/crop-price/CropPriceCard';
import { useLanguage } from '@/i18n';

export default function CropPricePageClient() {
  const [cropPrices, setCropPrices] = useState<CropPrice[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, translations, translateCrop, translateCategory } = useLanguage();

  const isTa = language === 'ta';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMarketId, setSelectedMarketId] = useState('all');
  const [sortBy, setSortBy] = useState<'price-desc' | 'price-asc' | 'recent' | 'name'>('price-desc');

  // Calculator State
  const [calcCropId, setCalcCropId] = useState<string>('');
  const [calcQuantity, setCalcQuantity] = useState<number>(25); // Quintals

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [pricesRes, cropsRes, marketsRes] = await Promise.all([
        getCropPrices(),
        getCrops(),
        getMarkets()
      ]);

      if (pricesRes.error) {
        setError(translations.cropPrices.unableToLoad);
      } else {
        setCropPrices(pricesRes.data);
      }

      if (cropsRes.data && cropsRes.data.length > 0) {
        setCrops(cropsRes.data);
        if (!calcCropId) {
          setCalcCropId(cropsRes.data[0].id);
        }
      } else if (pricesRes.data && pricesRes.data.length > 0) {
        // Fallback unique crops extracted from prices
        const derivedCrops: Crop[] = [];
        const seen = new Set<string>();
        pricesRes.data.forEach((p) => {
          if (p.crop && !seen.has(p.crop_id)) {
            seen.add(p.crop_id);
            derivedCrops.push(p.crop);
          }
        });
        setCrops(derivedCrops);
        if (derivedCrops.length > 0 && !calcCropId) {
          setCalcCropId(derivedCrops[0].id);
        }
      }

      if (marketsRes.data && marketsRes.data.length > 0) {
        setMarkets(marketsRes.data);
      } else if (pricesRes.data && pricesRes.data.length > 0) {
        // Fallback unique markets extracted from prices
        const derivedMarkets: Market[] = [];
        const seen = new Set<string>();
        pricesRes.data.forEach((p) => {
          if (p.market && !seen.has(p.market_id)) {
            seen.add(p.market_id);
            derivedMarkets.push(p.market);
          }
        });
        setMarkets(derivedMarkets);
      }
    } catch (err) {
      console.error('Failed to load crop price page data:', err);
      setError(translations.cropPrices.unableToLoad);
    } finally {
      setLoading(false);
    }
  }, [calcCropId, translations.cropPrices.unableToLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categories = ['All', 'Cereals', 'Oilseeds', 'Vegetables', 'Fiber', 'Commercial'];

  // Filtered & Sorted Crop Prices
  const filteredPrices = useMemo(() => {
    return cropPrices
      .filter((item) => {
        const cropName = item.crop?.name.toLowerCase() || '';
        const marketName = item.market?.name.toLowerCase() || '';
        const location = item.market?.location.toLowerCase() || '';
        const category = item.crop?.category || '';
        
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch = !q || cropName.includes(q) || marketName.includes(q) || location.includes(q);
        const matchesCategory = selectedCategory === 'All' || category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesMarket = selectedMarketId === 'all' || item.market_id === selectedMarketId || item.market?.id === selectedMarketId;
        
        return matchesSearch && matchesCategory && matchesMarket;
      })
      .sort((a, b) => {
        if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
        if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
        if (sortBy === 'recent') {
          return new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime();
        }
        if (sortBy === 'name') return (a.crop?.name || '').localeCompare(b.crop?.name || '');
        return 0;
      });
  }, [cropPrices, searchTerm, selectedCategory, selectedMarketId, sortBy]);

  // Calculator computations
  const selectedCalcCrop = useMemo(() => {
    return crops.find((c) => c.id === calcCropId) || crops[0] || { id: '', name: 'Crop', icon: '🌾' };
  }, [crops, calcCropId]);

  const selectedCalcMandiPrice = useMemo(() => {
    if (!calcCropId) return 0;
    const matchingPrices = cropPrices.filter((cp) => cp.crop_id === calcCropId);
    if (matchingPrices.length === 0) return 0;
    const sum = matchingPrices.reduce((acc, curr) => acc + Number(curr.price), 0);
    return Math.round(sum / matchingPrices.length);
  }, [cropPrices, calcCropId]);

  const mandiTotalRevenue = Math.round((calcQuantity || 0) * selectedCalcMandiPrice);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-agri-900 via-agri-800 to-agri-950 text-white py-10 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-agri-500/20 text-agri-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-agri-500/30">
                <TrendingUp className="w-3.5 h-3.5" />
                {isTa ? 'நேரலை ஒழுங்குமுறை விற்பனைக்கூட பட்டியல்' : 'Live APMC Mandi & Regulated Market Directory'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {translations.cropPrices.title}
              </h1>
              <p className="text-agri-100 text-sm sm:text-base mt-2 max-w-2xl">
                {translations.cropPrices.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/prediction"
                className="btn-accent text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>{translations.nav.predictions}</span>
              </Link>
              <Link
                href="/dealers"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
              >
                <span>{translations.dealers.findDealersBtn || translations.nav.dealers}</span>
                <ArrowRight className="w-3.5 h-3.5" />
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

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={translations.cropPrices.searchPlaceholder}
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
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

            {/* Market Dropdown */}
            <div className="md:col-span-4">
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedMarketId}
                  onChange={(e) => setSelectedMarketId(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white appearance-none cursor-pointer transition-all"
                >
                  <option value="all">
                    {isTa ? 'அனைத்து ஒழுங்குமுறை மண்டிகள்' : 'All APMC Mandis & Markets'} ({markets.length})
                  </option>
                  {markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.location})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-3">
              <div className="relative">
                <ArrowUpDown className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'price-desc' | 'price-asc' | 'recent' | 'name')}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white appearance-none cursor-pointer transition-all"
                >
                  <option value="price-desc">{translations.cropPrices.sortPriceHighLow}</option>
                  <option value="price-asc">{translations.cropPrices.sortPriceLowHigh}</option>
                  <option value="recent">{translations.cropPrices.sortRecent}</option>
                  <option value="name">{translations.cropPrices.sortCropName}</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              {translations.cropPrices.filterByCategory}:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-agri-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {translateCategory(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Grid: Price Cards Grid + Right Side Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          
          {/* Main Cards Grid (8 cols) */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{translations.cropPrices.title}</span>
                  {!loading && (
                    <span className="text-xs bg-agri-100 text-agri-800 font-semibold px-2.5 py-0.5 rounded-full">
                      {filteredPrices.length} {isTa ? 'பயிர்கள்' : 'Records'}
                    </span>
                  )}
                </h2>
              </div>

              {!loading && cropPrices.length > 0 && (
                <button
                  onClick={() => loadData()}
                  className="text-xs text-agri-700 hover:text-agri-800 font-semibold flex items-center gap-1"
                  title={isTa ? 'விலைகளைப் புதுப்பிக்க' : 'Refresh rates'}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isTa ? 'புதுப்பிக்க' : 'Refresh'}</span>
                </button>
              )}
            </div>

            {/* Loading Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cropPrices.length === 0 ? (
              /* Global Empty State: No crop prices available */
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">{translations.cropPrices.noPricesFound}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {translations.cropPrices.noPricesDescription}
                </p>
                <button
                  onClick={() => loadData()}
                  className="mt-5 btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{translations.common.retry}</span>
                </button>
              </div>
            ) : filteredPrices.length === 0 ? (
              /* Filter Empty State */
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">{translations.common.noResults}</h3>
                <p className="text-xs text-slate-500 mt-1">{translations.cropPrices.noPricesDescription}</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setSelectedMarketId('all');
                  }}
                  className="mt-4 btn-secondary text-xs py-2 px-4"
                >
                  {translations.common.clearFilters}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredPrices.map((item) => (
                  <CropPriceCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Calculator Widget */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-agri-100 text-agri-700">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{translations.cropPrices.calculatorTitle}</h3>
                  <p className="text-xs text-slate-500">{translations.cropPrices.calculatorSubtitle}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {translations.cropPrices.selectCrop}
                  </label>
                  <select
                    value={calcCropId}
                    onChange={(e) => setCalcCropId(e.target.value)}
                    disabled={crops.length === 0}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-agri-500"
                  >
                    {crops.length === 0 ? (
                      <option value="">{translations.cropPrices.noPricesFound}</option>
                    ) : (
                      crops.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {translateCrop(c.name)}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {translations.cropPrices.enterQuantity}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={calcQuantity}
                    onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-agri-500"
                  />
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      {isTa ? 'மண்டி அடிப்படை விலை' : 'Mandi Benchmark Rate'} {selectedCalcMandiPrice > 0 ? `(₹${selectedCalcMandiPrice.toLocaleString('en-IN')}/${isTa ? 'குவிண்டால்' : 'Q'})` : ''}:
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedCalcMandiPrice > 0 ? `₹${mandiTotalRevenue.toLocaleString('en-IN')}` : 'N/A'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1">
                    {isTa
                      ? `${translateCrop(selectedCalcCrop.name)} பயிருக்கான நேரலை மண்டி விலையின் அடிப்படையில் கணக்கிடப்பட்டது.`
                      : `Calculated from current live APMC mandi pricing records for ${selectedCalcCrop.name}.`}
                  </div>
                </div>

                {selectedCalcCrop.name && (
                  <Link
                    href={`/dealers?crop=${encodeURIComponent(selectedCalcCrop.name)}`}
                    className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
                  >
                    <span>{isTa ? `${translateCrop(selectedCalcCrop.name)} வாங்கும் வியாபாரிகளைக் காண்க` : `Find ${selectedCalcCrop.name} Buyers`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
