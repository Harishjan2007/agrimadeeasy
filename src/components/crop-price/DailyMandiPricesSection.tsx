'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Building2,
  Calendar,
  MapPin,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  WifiOff,
  KeyRound,
  FileX,
  Activity,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import {
  MarketPriceRecord,
  MarketPricesApiResponse,
  fetchMarketPrices,
  TAMIL_NADU_DISTRICTS,
  POPULAR_COMMODITIES
} from '@/lib/market-prices';
import { useLanguage } from '@/i18n';

export default function DailyMandiPricesSection() {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  // Filters state
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('All Commodities');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [marketSearch, setMarketSearch] = useState<string>('');

  // Pagination state
  const [limit, setLimit] = useState<number>(25);
  const [offset, setOffset] = useState<number>(0);

  // View mode: 'cards' | 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Query result state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<MarketPricesApiResponse | null>(null);

  const loadMarketPrices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchMarketPrices({
        state: selectedState,
        district: selectedDistrict,
        commodity: selectedCommodity !== 'All Commodities' ? selectedCommodity : (searchTerm.trim() || undefined),
        market: marketSearch.trim() || undefined,
        limit,
        offset
      });

      if (!res.success && res.error) {
        setError(res.error);
        setApiResponse(res);
      } else {
        setApiResponse(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch live market records from data.gov.in');
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict, selectedCommodity, searchTerm, marketSearch, limit, offset]);

  useEffect(() => {
    loadMarketPrices();
  }, [loadMarketPrices]);

  // Handle filter changes (resets offset to 0)
  const handleDistrictChange = (d: string) => {
    setSelectedDistrict(d);
    setOffset(0);
  };

  const handleCommoditySelect = (c: string) => {
    setSelectedCommodity(c);
    setSearchTerm('');
    setOffset(0);
  };

  const handleResetFilters = () => {
    setSelectedState('Tamil Nadu');
    setSelectedDistrict('All Districts');
    setSelectedCommodity('All Commodities');
    setSearchTerm('');
    setMarketSearch('');
    setOffset(0);
  };

  // Pagination calculations
  const total = apiResponse?.total || 0;
  const count = apiResponse?.count || 0;
  const records = useMemo(() => apiResponse?.records || [], [apiResponse]);

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startRecord = total === 0 ? 0 : offset + 1;
  const endRecord = Math.min(offset + count, total);

  // Filter client-side search query if user typed into free search box
  const displayedRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const q = searchTerm.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.commodity.toLowerCase().includes(q) ||
        r.variety.toLowerCase().includes(q) ||
        r.market.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q)
    );
  }, [records, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Government Provenance Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {isTa
                    ? 'அதிகாரப்பூர்வ அரசு தரவு: data.gov.in (OGD தளம்)'
                    : 'Official Government Data Provenance: data.gov.in (OGD Platform India)'}
                </span>
              </span>
              <ScaleUnitBadge />
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {isTa ? 'தினசரி ஒழுங்குமுறை மண்டி விலைகள்' : 'Daily APMC Mandi Wholesale Arrivals (Tamil Nadu)'}
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              {isTa
                ? 'வேளாண் அமைச்சகத்தின் data.gov.in API மூலம் பெறப்படும் நேரடி மண்டி மாதிரி விலைகள் (₹/குவிண்டால்).'
                : 'Direct wholesale modal rates from APMC Mandis via data.gov.in API (₹/Quintal).'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <button
              onClick={() => loadMarketPrices()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 shadow-xs transition-all disabled:opacity-50"
              title="Refresh rates from data.gov.in"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isTa ? 'விலைகளைப் புதுப்பிக்க' : 'Refresh Feed'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {/* District Dropdown */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTa ? 'மாவட்டம்' : 'District'}</span>
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
            >
              {TAMIL_NADU_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Commodity Dropdown */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTa ? 'பயிர் / விளைபொருள்' : 'Commodity'}</span>
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => handleCommoditySelect(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
            >
              {POPULAR_COMMODITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Mandi/Market Search */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTa ? 'மண்டி சந்தை' : 'Mandi Market'}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={marketSearch}
                onChange={(e) => {
                  setMarketSearch(e.target.value);
                  setOffset(0);
                }}
                placeholder={isTa ? 'எ.கா. கோயம்புத்தூர்...' : 'e.g. Coimbatore, Madurai...'}
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              />
              {marketSearch && (
                <button
                  onClick={() => setMarketSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Free Search Input */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTa ? 'விரைவு தேடல்' : 'Search Keyword'}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isTa ? 'தக்காளி, வெங்காயம்...' : 'Tomato, Onion, Variety...'}
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Commodity Filter Pills */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            {isTa ? 'முக்கிய பயிர்கள்:' : 'Top Crops:'}
          </span>
          {['Tomato', 'Onion', 'Paddy(Dhan)(Common)', 'Groundnut', 'Maize', 'Coconut', 'Turmeric', 'Cotton'].map((c) => (
            <button
              key={c}
              onClick={() => handleCommoditySelect(c)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCommodity === c
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.replace('(Dhan)(Common)', '')}
            </button>
          ))}
          {(selectedDistrict !== 'All Districts' || selectedCommodity !== 'All Commodities' || marketSearch || searchTerm) && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all shrink-0 flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isTa ? 'அனைத்தையும் நீக்கு' : 'Reset Filters'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header: Count + View Mode + Page Size Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            {isTa ? 'மண்டி வரத்து பதிவுகள்' : 'Reported Mandi Arrivals'}
          </h3>
          {!loading && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {displayedRecords.length} {isTa ? 'பதிவுகள்' : 'records shown'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold">{isTa ? 'பக்கத்திற்கு:' : 'Per page:'}</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setOffset(0);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTa ? 'அட்டவணை' : 'Table'}</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTa ? 'கார்டுகள்' : 'Cards'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Loading, Error, Empty, or Data Display */}
      {loading ? (
        <LoadingSkeleton viewMode={viewMode} />
      ) : error ? (
        /* Real Error State - Truthfully distinguished by failure category */
        <MandiErrorBanner
          error={error}
          apiResponse={apiResponse}
          isTa={isTa}
          onRetry={() => loadMarketPrices()}
        />
      ) : displayedRecords.length === 0 ? (
        /* Truthful Empty State */
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-900">
              {isTa ? 'மண்டி பதிவுகள் எதுவும் கிடைக்கவில்லை' : 'No APMC Mandi Records Found'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {apiResponse?.message || (isTa
                ? 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளுக்கு (மாவட்டம், பயிர் அல்லது மண்டி) அரசு இணையத்தில் நேரடி பதிவுகள் எதுவும் இல்லை.'
                : `No active mandi arrivals recorded on data.gov.in for the selected filter combination (${selectedDistrict}, ${selectedCommodity}).`)}
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isTa ? 'அனைத்து மண்டிகளையும் காண்க' : 'Reset Filters & View All Mandis'}</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Real Returned Records: Table View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="py-3.5 px-4">{isTa ? 'பயிர் / வகை' : 'Commodity / Variety'}</th>
                  <th className="py-3.5 px-4">{isTa ? 'மண்டி சந்தை' : 'Mandi Market'}</th>
                  <th className="py-3.5 px-4">{isTa ? 'மாவட்டம்' : 'District'}</th>
                  <th className="py-3.5 px-4">{isTa ? 'வரத்து தேதி' : 'Arrival Date'}</th>
                  <th className="py-3.5 px-4 text-right">{isTa ? 'குறைந்தபட்சம்' : 'Min Price'}</th>
                  <th className="py-3.5 px-4 text-right font-black text-emerald-800">{isTa ? 'சராசரி விலை (Modal)' : 'Modal Price'}</th>
                  <th className="py-3.5 px-4 text-right">{isTa ? 'அதிகபட்சம்' : 'Max Price'}</th>
                  <th className="py-3.5 px-4 text-center">{isTa ? 'நடவடிக்கை' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRecords.map((r, i) => (
                  <tr
                    key={r.id || i}
                    className="hover:bg-emerald-50/40 transition-colors group"
                  >
                    {/* Commodity */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-emerald-900">
                        {r.commodity}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span>{r.variety || 'General'}</span>
                        {r.grade && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {r.grade}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Mandi */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{r.market}</span>
                      </div>
                    </td>

                    {/* District */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{r.district}</span>
                      </div>
                    </td>

                    {/* Arrival Date */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{r.arrival_date}</span>
                      </div>
                    </td>

                    {/* Min Price */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-600 whitespace-nowrap">
                      ₹{r.min_price.toLocaleString('en-IN')}
                      <span className="text-[10px] text-slate-400 font-normal block">/Q</span>
                    </td>

                    {/* Modal Price (Benchmark) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs sm:text-sm border border-emerald-300">
                        ₹{r.modal_price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">₹/Quintal</span>
                    </td>

                    {/* Max Price */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-600 whitespace-nowrap">
                      ₹{r.max_price.toLocaleString('en-IN')}
                      <span className="text-[10px] text-slate-400 font-normal block">/Q</span>
                    </td>

                    {/* Quick Link to Predictions / Dealers */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Link
                        href={`/prediction?crop=${encodeURIComponent(r.commodity)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-[11px] transition-colors"
                        title={`Forecast prices for ${r.commodity}`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-500 group-hover:text-amber-300" />
                        <span>{isTa ? 'முன்கணிப்பு' : 'Forecast'}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Real Returned Records: Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRecords.map((r, i) => {
            const spread = Math.max(0, r.max_price - r.min_price);
            return (
              <div
                key={r.id || i}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all space-y-4"
              >
                {/* Card Top: Commodity & Variety */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-black text-slate-900">{r.commodity}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="inline-block text-[11px] font-bold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100">
                        {r.variety || 'Standard Grade'}
                      </span>
                      {r.grade && (
                        <span className="inline-block text-[10px] font-bold text-emerald-800 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                          {r.grade}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase">
                    {r.state || 'Tamil Nadu'}
                  </span>
                </div>

                {/* Mandi & Date metadata */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">{r.market}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{r.district}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{r.arrival_date}</span>
                    </div>
                  </div>
                </div>

                {/* Modal Price Highlight */}
                <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      {isTa ? 'சராசரி விலை (Modal Rate)' : 'Modal Benchmark Rate'}
                    </span>
                    <span className="text-xl font-black text-emerald-950">
                      ₹{r.modal_price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    ₹/Quintal
                  </span>
                </div>

                {/* Price Range Details: Min / Max / Spread */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">{isTa ? 'குறைந்தது' : 'Min'}</span>
                    <span className="font-bold text-slate-700">₹{r.min_price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">{isTa ? 'அதிகபட்சம்' : 'Max'}</span>
                    <span className="font-bold text-slate-700">₹{r.max_price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">{isTa ? 'வித்தியாசம்' : 'Spread'}</span>
                    <span className="font-bold text-amber-700">₹{spread.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <Link
                    href={`/prediction?crop=${encodeURIComponent(r.commodity)}`}
                    className="flex-1 py-2 rounded-xl text-center text-xs font-bold bg-slate-900 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isTa ? 'முன்கணிப்பு' : 'Forecast Price'}</span>
                  </Link>
                  <Link
                    href={`/dealers?crop=${encodeURIComponent(r.commodity)}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title={`Find buyers for ${r.commodity}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && total > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="text-slate-600 font-medium">
            {isTa
              ? `${total} பதிவுகளில் ${startRecord} முதல் ${endRecord} வரை காட்டப்படுகிறது`
              : `Showing ${startRecord.toLocaleString('en-IN')} – ${endRecord.toLocaleString('en-IN')} of ${total.toLocaleString('en-IN')} records`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isTa ? 'முந்தையது' : 'Previous'}</span>
            </button>

            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 font-black text-xs border border-emerald-200">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{isTa ? 'அடுத்தது' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScaleUnitBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-700/60 border border-emerald-500/40 text-[10px] font-black text-white">
      ₹/Quintal
    </span>
  );
}

function LoadingSkeleton({ viewMode }: { viewMode: 'cards' | 'table' }) {
  if (viewMode === 'table') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100">
            <div className="h-4 bg-slate-200 rounded w-1/5" />
            <div className="h-4 bg-slate-200 rounded w-1/6" />
            <div className="h-4 bg-slate-200 rounded w-1/6" />
            <div className="h-4 bg-slate-200 rounded w-1/8" />
            <div className="h-6 bg-emerald-100 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-3/4" />
          <div className="h-16 bg-emerald-50 rounded-2xl" />
          <div className="h-8 bg-slate-100 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

interface MandiErrorBannerProps {
  error: string;
  apiResponse: MarketPricesApiResponse | null;
  isTa: boolean;
  onRetry: () => void;
}

function MandiErrorBanner({ error, apiResponse, isTa, onRetry }: MandiErrorBannerProps) {
  const category = apiResponse?.errorCategory || (
    apiResponse?.statusCode === 401 || apiResponse?.statusCode === 403 || apiResponse?.status === 'AUTH_ERROR'
      ? 'AUTHENTICATION'
      : apiResponse?.statusCode === 429 || apiResponse?.status === 'RATE_LIMIT_ERROR'
      ? 'RATE_LIMIT'
      : apiResponse?.status === 'PARSE_ERROR'
      ? 'PARSING'
      : apiResponse?.status === 'CONFIG_ERROR'
      ? 'CONFIGURATION'
      : 'CONNECTION'
  );

  const isConnection = category === 'CONNECTION';
  const isAuth = category === 'AUTHENTICATION';
  const isParsing = category === 'PARSING';
  const isRateLimit = category === 'RATE_LIMIT';

  const containerClasses = isConnection
    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
    : isAuth
    ? 'bg-rose-50/90 border-rose-300 text-rose-950'
    : isParsing
    ? 'bg-purple-50/90 border-purple-300 text-purple-950'
    : isRateLimit
    ? 'bg-sky-50/90 border-sky-300 text-sky-950'
    : 'bg-rose-50/90 border-rose-300 text-rose-950';

  const iconBgClasses = isConnection
    ? 'bg-amber-100 text-amber-700 border border-amber-300'
    : isAuth
    ? 'bg-rose-100 text-rose-700 border border-rose-300'
    : isParsing
    ? 'bg-purple-100 text-purple-700 border border-purple-300'
    : isRateLimit
    ? 'bg-sky-100 text-sky-700 border border-sky-300'
    : 'bg-rose-100 text-rose-700 border border-rose-300';

  const badgeClasses = isConnection
    ? 'bg-amber-100/90 text-amber-900 border-amber-300'
    : isAuth
    ? 'bg-rose-100/90 text-rose-900 border-rose-300'
    : isParsing
    ? 'bg-purple-100/90 text-purple-900 border-purple-300'
    : isRateLimit
    ? 'bg-sky-100/90 text-sky-900 border-sky-300'
    : 'bg-rose-100/90 text-rose-900 border-rose-300';

  const buttonClasses = isConnection
    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
    : isAuth
    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
    : isParsing
    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
    : isRateLimit
    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20'
    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20';

  return (
    <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm space-y-5 transition-all ${containerClasses}`}>
      {/* Top Header with Distinct Icon & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${iconBgClasses}`}>
            {isConnection ? (
              <WifiOff className="w-6 h-6" />
            ) : isAuth ? (
              <KeyRound className="w-6 h-6" />
            ) : isParsing ? (
              <FileX className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${badgeClasses}`}>
                {isConnection ? (
                  <>
                    <Activity className="w-3 h-3 text-amber-600" />
                    <span>{isTa ? 'இணைப்பு நேரம் முடிந்தது (ETIMEDOUT)' : 'Connection Timeout (ETIMEDOUT)'}</span>
                  </>
                ) : isAuth ? (
                  <>
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    <span>{isTa ? 'அங்கீகாரப் பிழை (HTTP 401/403)' : 'Authentication Failure (HTTP 401/403)'}</span>
                  </>
                ) : isParsing ? (
                  <>
                    <FileX className="w-3 h-3 text-purple-600" />
                    <span>{isTa ? 'பதில் தரவு வடிவமைப்பு பிழை' : 'Response Parsing Error'}</span>
                  </>
                ) : isRateLimit ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-sky-600" />
                    <span>{isTa ? 'கோரிக்கை வரம்பு மீறப்பட்டது' : 'Rate Limit Exceeded (HTTP 429)'}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>{isTa ? 'அரசு சர்வர் பிழை' : 'Gateway Error'}</span>
                  </>
                )}
              </span>

              {apiResponse?.code && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/60 border border-slate-200 text-slate-700">
                  {apiResponse.code}
                </span>
              )}
            </div>

            <h4 className="text-lg sm:text-xl font-black tracking-tight">
              {isConnection
                ? isTa
                  ? 'அரசு data.gov.in சர்வர் இணைப்பு நேரம் முடிந்தது'
                  : 'data.gov.in Gateway Connection Timed Out'
                : isAuth
                ? isTa
                  ? 'data.gov.in API சாவி அங்கீகரிக்கப்படவில்லை'
                  : 'data.gov.in API Key Unauthorized'
                : isParsing
                ? isTa
                  ? 'data.gov.in இலிருந்து செல்லுபடியாகாத பதில் பெறப்பட்டது'
                  : 'Unexpected data.gov.in Response Format'
                : isRateLimit
                ? isTa
                  ? 'data.gov.in கோரிக்கை வரம்பு முடிந்தது'
                  : 'data.gov.in Request Quota Reached'
                : isTa
                ? 'மண்டி தகவலைப் பெற முடியவில்லை'
                : 'Unable to Retrieve data.gov.in Live Mandi Feed'}
            </h4>
          </div>
        </div>

        {apiResponse?.statusCode && (
          <div className="shrink-0 px-3 py-1.5 rounded-xl bg-white/70 border border-slate-200/80 text-xs font-mono font-bold text-slate-800">
            HTTP {apiResponse.statusCode}
          </div>
        )}
      </div>

      {/* Clear Distinction & Explanation Body */}
      <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-white/60 space-y-3 text-xs sm:text-sm">
        <div>
          <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500 block mb-1">
            {isTa ? 'பிழை விவரம்' : 'Diagnostic Summary'}
          </span>
          <p className="font-semibold text-slate-900 leading-relaxed">
            {error}
          </p>
        </div>

        {/* Clear user-facing distinction */}
        <div className="pt-2 border-t border-slate-200/60">
          <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500 block mb-1">
            {isTa ? 'பிழை வகை விளக்கம்' : 'Failure Classification & Root Cause'}
          </span>
          {isConnection ? (
            <p className="text-slate-700 leading-relaxed">
              {isTa
                ? 'இது ஒரு நெட்வொர்க் இணைப்பு தாமத பிழை ஆகும். மத்திய அரசின் data.gov.in இணையதளம் இயங்குகிறது, ஆனால் இந்த சர்வரிலிருந்து வெளிச்செல்லும் TCP பாக்கெட்டுகள் (api.data.gov.in:443) ஃபயர்வால், ISP ரவுட்டிங் அல்லது IPv6/NAT64 அமைப்பால் நேரம் முடிந்துவிட்டன. இது API சாவி அல்லது தரவு வடிவமைப்பு பிழை அல்ல.'
                : 'This is a network connectivity timeout, not an authentication or response-parsing error. The official data.gov.in platform is verified as operational, but outbound TCP packets to port 443 timed out before completing the handshake. This typically indicates local network firewall filtering, ISP routing to the National Informatics Centre (NIC), or IPv6/NAT64 translation stalls.'}
            </p>
          ) : isAuth ? (
            <p className="text-slate-700 leading-relaxed">
              {isTa
                ? 'அரசு சர்வருடன் நெட்வொர்க் இணைப்பு வெற்றிகரமாக அமைந்தது, ஆனால் வழங்கப்பட்ட API சாவி நிராகரிக்கப்பட்டது (HTTP 401/403). data.gov.in கணக்கில் சாவியின் நிலையை சரிபார்க்கவும்.'
                : 'The network connection succeeded, but data.gov.in rejected the API key with HTTP 401/403. This is an authentication failure rather than a connection failure. Please confirm that your DATA_GOV_IN_API_KEY is activated and has permission for this dataset.'}
            </p>
          ) : isParsing ? (
            <p className="text-slate-700 leading-relaxed">
              {isTa
                ? 'அரசு சர்வருடன் இணைப்பு மற்றும் சாவி அங்கீகாரம் வெற்றிகரமாக அமைந்தது, ஆனால் சர்வர் அனுப்பிய பதில் முறையான Agmarknet JSON வடிவில் இல்லை (எ.கா. HTML பராமரிப்பு பக்கம்).'
                : 'The network connection and authentication both succeeded, but the upstream server returned non-JSON data (such as an HTML error/maintenance page or truncated payload). This is a response-parsing error.'}
            </p>
          ) : (
            <p className="text-slate-700 leading-relaxed">
              {apiResponse?.errorResolution || (isTa
                ? 'அரசு சர்வரில் தற்காலிக கோளாறு ஏற்பட்டுள்ளது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
                : 'The upstream server returned a temporary error. Please try again later.')}
            </p>
          )}
        </div>

        {apiResponse?.errorResolution && isConnection && (
          <div className="pt-2 border-t border-slate-200/60 text-slate-600 text-[11px] sm:text-xs">
            <span className="font-bold text-slate-700">{isTa ? 'பரிந்துரை: ' : 'Recommended Action: '}</span>
            {apiResponse.errorResolution}
          </div>
        )}
      </div>

      {/* Footer Controls & Live Diagnostics Link */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/market-prices?diagnose=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isTa ? 'நேரடி நெட்வொர்க் சோதனை (?diagnose=true)' : 'View In-Depth Connection Probe'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <a
            href="https://data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs transition-colors"
          >
            <span>{isTa ? 'data.gov.in அசல் பட்டியல்' : 'Official Agmarknet Catalog'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        <button
          onClick={onRetry}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all ${buttonClasses}`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isTa ? 'மீண்டும் முயற்சிக்க' : 'Retry Query'}</span>
        </button>
      </div>
    </div>
  );
}
