'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Filter,
  Search,
  RotateCcw,
  TrendingUp,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import type {
  FilterOptions,
  HistoricalQueryResult,
  HistoricalRecord,
  HistoricalChartPoint
} from '@/lib/historical-data';

export default function HistoricalDatasetSection() {
  const { language, translations } = useLanguage();
  const isTa = language === 'ta';

  // State: Filter Options metadata from server
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Active filter state
  const [selectedCrop, setSelectedCrop] = useState<string>('tomato');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>('2026-04-20');
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination & Sorting state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sortBy, setSortBy] = useState<'date' | 'modal_price' | 'min_price' | 'max_price'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Chart Metric state
  const [chartMetric, setChartMetric] = useState<'modal_price' | 'min_price' | 'max_price'>('modal_price');
  const [hoveredChartPoint, setHoveredChartPoint] = useState<HistoricalChartPoint | null>(null);

  // Query Results
  const [queryData, setQueryData] = useState<HistoricalQueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch Filter Options on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        setInitialLoading(true);
        const res = await fetch('/api/historical-prices?action=options');
        const json = await res.json();
        if (json.success && json.data) {
          setFilterOptions(json.data);
          // Default to first crop if available
          if (json.data.crops && json.data.crops.length > 0) {
            setSelectedCrop(json.data.crops[0].slug);
          }
        }
      } catch (err: any) {
        console.error('Failed to load filter options:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadOptions();
  }, []);

  // 2. Dependent markets for current district
  const availableMarketsForDistrict = useMemo(() => {
    if (!filterOptions) return [];
    if (selectedDistrict === 'all') {
      // All unique markets across all districts
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

  // When district changes, reset market if not valid in that district
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedMarket('all');
    setPage(1);
  };

  // 3. Execute Server-Side Query
  const fetchHistoricalData = useCallback(async () => {
    if (!selectedCrop) return;
    try {
      setQueryLoading(true);
      setQueryError(null);

      const params = new URLSearchParams({
        action: 'query',
        crop: selectedCrop,
        district: selectedDistrict,
        market: selectedMarket,
        start_date: startDate,
        end_date: endDate,
        variety: selectedVariety,
        grade: selectedGrade,
        search: searchTerm,
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      });

      const res = await fetch(`/api/historical-prices?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch historical data');
      }

      setQueryData(json.data);
    } catch (err: any) {
      console.error('Historical price query error:', err);
      setQueryError(err.message || 'Error executing query');
    } finally {
      setQueryLoading(false);
    }
  }, [
    selectedCrop,
    selectedDistrict,
    selectedMarket,
    startDate,
    endDate,
    selectedVariety,
    selectedGrade,
    searchTerm,
    page,
    pageSize,
    sortBy,
    sortOrder
  ]);

  // Trigger query on parameter changes
  useEffect(() => {
    if (filterOptions) {
      fetchHistoricalData();
    }
  }, [fetchHistoricalData, filterOptions]);

  // Reset Filters
  const handleResetFilters = () => {
    if (filterOptions?.crops?.[0]) {
      setSelectedCrop(filterOptions.crops[0].slug);
    }
    setSelectedDistrict('all');
    setSelectedMarket('all');
    setStartDate('2024-01-01');
    setEndDate('2026-04-20');
    setSelectedVariety('all');
    setSelectedGrade('all');
    setSearchTerm('');
    setPage(1);
  };

  // Handle Sort Change
  const handleSort = (field: 'date' | 'modal_price' | 'min_price' | 'max_price') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Handle Export CSV
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams({
        action: 'export',
        crop: selectedCrop,
        district: selectedDistrict,
        market: selectedMarket,
        start_date: startDate,
        end_date: endDate,
        variety: selectedVariety,
        grade: selectedGrade,
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      const response = await fetch(`/api/historical-prices?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agrime_historical_${selectedCrop}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Chart Rendering Calculations
  const chartPoints = queryData?.chartData || [];
  const chartMinPrice = useMemo(() => {
    if (chartPoints.length === 0) return 0;
    const minVal = Math.min(...chartPoints.map((p) => (chartMetric === 'modal_price' ? p.modal_price : chartMetric === 'min_price' ? p.min_price : p.max_price)));
    return Math.max(0, Math.floor(minVal * 0.9));
  }, [chartPoints, chartMetric]);

  const chartMaxPrice = useMemo(() => {
    if (chartPoints.length === 0) return 1000;
    const maxVal = Math.max(...chartPoints.map((p) => (chartMetric === 'modal_price' ? p.modal_price : chartMetric === 'min_price' ? p.min_price : p.max_price)));
    return Math.ceil(maxVal * 1.1);
  }, [chartPoints, chartMetric]);

  return (
    <div className="space-y-6">
      {/* 2. Interactive Filters */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm sm:text-base">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>{isTa ? 'வடிகட்டிகள் & தேடல்' : 'Interactive Filters'}</span>
          </div>

          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold px-2.5 py-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isTa ? 'மீட்டமைக்க' : 'Reset Filters'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Commodity / Crop Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{isTa ? 'பயிர் / விளைபொருள்' : 'Crop / Commodity'}</span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                {filterOptions?.crops?.length || 139} {isTa ? 'பயிர்கள்' : 'Crops'}
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedCrop}
                onChange={(e) => {
                  setSelectedCrop(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8 cursor-pointer"
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

          {/* District Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{isTa ? 'மாவட்டம்' : 'District'}</span>
              <span className="text-[10px] text-purple-700 font-semibold">
                {filterOptions?.districts?.length || 36} {isTa ? 'மாவட்டங்கள்' : 'Districts'}
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8 cursor-pointer"
              >
                <option value="all">{isTa ? 'அனைத்து மாவட்டங்களும்' : 'All Districts (36)'}</option>
                {filterOptions?.districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Market Dropdown (Dependent on District) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{isTa ? 'ஒழுங்குமுறை மண்டி' : 'APMC Market / Mandi'}</span>
              <span className="text-[10px] text-amber-700 font-semibold">
                {availableMarketsForDistrict.length} {isTa ? 'மண்டிகள்' : 'Mandis'}
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedMarket}
                onChange={(e) => {
                  setSelectedMarket(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8 cursor-pointer"
              >
                <option value="all">{isTa ? 'அனைத்து மண்டிகளும்' : 'All Mandis in Selection'}</option>
                {availableMarketsForDistrict.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search Term Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {isTa ? 'தேடல் (மண்டி / ரகம்)' : 'Text Search'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder={isTa ? 'மண்டி பெயர், ரகம்...' : 'Mandi name, variety...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Date Boundaries Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{isTa ? 'தொடக்கத் தேதி' : 'Start Date'}</span>
              <span className="text-[10px] text-slate-400">Min: 2016-04-20</span>
            </label>
            <input
              type="date"
              value={startDate}
              min="2016-04-20"
              max="2026-04-20"
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{isTa ? 'முடிவுத் தேதி' : 'End Date'}</span>
              <span className="text-[10px] text-slate-400">Max: 2026-04-20</span>
            </label>
            <input
              type="date"
              value={endDate}
              min="2016-04-20"
              max="2026-04-20"
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="sm:col-span-2 flex items-end gap-2 pb-0.5">
            <button
              type="button"
              onClick={() => {
                setStartDate('2025-01-01');
                setEndDate('2026-04-20');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {isTa ? 'கடைசி 1 வருடம்' : 'Last 1 Year'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate('2023-01-01');
                setEndDate('2026-04-20');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {isTa ? 'கடைசி 3 ஆண்டுகள்' : 'Last 3 Years'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate('2021-01-01');
                setEndDate('2026-04-20');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {isTa ? 'கடைசி 5 ஆண்டுகள்' : 'Last 5 Years'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate('2016-04-20');
                setEndDate('2026-04-20');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
            >
              {isTa ? 'முழு 10 ஆண்டுகள்' : 'Full 10 Years'}
            </button>
          </div>
        </div>
      </div>



      {/* 4. Historical Price Chart */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>{isTa ? 'காலவரிசை விலை வரைபடம்' : 'Historical Price Trend Over Time'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTa
                ? 'ஒரு தேதியில் பல ஏலங்கள் இருந்தால், கூட்டுச் சராசரி கொண்டு வரைபடம் கணக்கிடப்படுகிறது.'
                : 'Aggregated chronologically by arrival date. Tooltip displays exact mandi rate.'}
            </p>
          </div>

          {/* Metric Toggle: Modal / Min / Max */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMetric('modal_price')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                chartMetric === 'modal_price'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {isTa ? 'மாதிரி (Modal)' : 'Modal Price'}
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('min_price')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                chartMetric === 'min_price'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {isTa ? 'குறைந்தபட்சம்' : 'Min Price'}
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('max_price')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                chartMetric === 'max_price'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {isTa ? 'அதிகபட்சம்' : 'Max Price'}
            </button>
          </div>
        </div>

        {/* SVG Chart Area */}
        {chartPoints.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-semibold">{isTa ? 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளுக்கு பதிவுகள் இல்லை' : 'No historical observations match the selected criteria.'}</p>
            <p className="text-xs text-slate-500 mt-1">{isTa ? 'தேதி வரம்பை அல்லது மாவட்டத்தை மாற்றவும்.' : 'Try broadening the date range or choosing another market.'}</p>
          </div>
        ) : (
          <div className="relative pt-4">
            <div className="h-64 sm:h-72 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => (
                  <line
                    key={idx}
                    x1="0"
                    y1={240 * ratio}
                    x2="800"
                    y2={240 * ratio}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Area Fill */}
                <path
                  d={(() => {
                    const points = chartPoints.map((p, i) => {
                      const val = chartMetric === 'modal_price' ? p.modal_price : chartMetric === 'min_price' ? p.min_price : p.max_price;
                      const x = (i / (chartPoints.length - 1 || 1)) * 800;
                      const y = 240 - ((val - chartMinPrice) / (chartMaxPrice - chartMinPrice || 1)) * 220;
                      return `${x},${y}`;
                    });
                    return `M 0,240 L ${points.join(' L ')} L 800,240 Z`;
                  })()}
                  fill="url(#chartGradient)"
                />

                {/* Line Path */}
                <path
                  d={(() => {
                    const points = chartPoints.map((p, i) => {
                      const val = chartMetric === 'modal_price' ? p.modal_price : chartMetric === 'min_price' ? p.min_price : p.max_price;
                      const x = (i / (chartPoints.length - 1 || 1)) * 800;
                      const y = 240 - ((val - chartMinPrice) / (chartMaxPrice - chartMinPrice || 1)) * 220;
                      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                    });
                    return points.join(' ');
                  })()}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {chartPoints.map((p, i) => {
                  const val = chartMetric === 'modal_price' ? p.modal_price : chartMetric === 'min_price' ? p.min_price : p.max_price;
                  const x = (i / (chartPoints.length - 1 || 1)) * 800;
                  const y = 240 - ((val - chartMinPrice) / (chartMaxPrice - chartMinPrice || 1)) * 220;

                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-white stroke-emerald-600 stroke-2 hover:r-6 cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredChartPoint(p)}
                      onMouseLeave={() => setHoveredChartPoint(null)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Hover Tooltip */}
            {hoveredChartPoint && (
              <div className="absolute top-2 right-4 bg-slate-900 text-white rounded-xl px-3.5 py-2 text-xs shadow-lg pointer-events-none z-20 flex items-center gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">{hoveredChartPoint.date}</p>
                  <p className="font-extrabold text-emerald-400 text-sm">
                    ₹{hoveredChartPoint.modal_price.toLocaleString()} / Quintal
                  </p>
                </div>
                <div className="text-[10px] text-slate-300 border-l border-slate-700 pl-3">
                  <p>Min: ₹{hoveredChartPoint.min_price.toLocaleString()}</p>
                  <p>Max: ₹{hoveredChartPoint.max_price.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Timeline Axis Labels */}
            <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-400 font-semibold pt-2 border-t border-slate-100">
              <span>{chartPoints[0]?.date}</span>
              <span>
                {isTa ? 'அளவீட்டு அலகு: ₹ / குவிண்டால்' : 'Unit: ₹ / Quintal (INR per 100 kg)'}
              </span>
              <span>{chartPoints[chartPoints.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Historical Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {isTa ? 'வரலாற்று பதிவுகள் அட்டவணை' : 'Historical Observations Table'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTa ? 'பக்க அளவு மற்றும் வரிசைப்படுத்துதலை மாற்றலாம்.' : 'Server-side paginated and sorted. All units in ₹ / Quintal.'}
            </p>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-500">{isTa ? 'வரிசைகள்:' : 'Rows per page:'}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('date')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{isTa ? 'வரவுத் தேதி' : 'Arrival Date'}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">{isTa ? 'பயிர்' : 'Commodity'}</th>
                <th className="px-4 py-3">{isTa ? 'மாவட்டம்' : 'District'}</th>
                <th className="px-4 py-3">{isTa ? 'ஒழுங்குமுறை மண்டி' : 'Market / Mandi'}</th>
                <th className="px-4 py-3">{isTa ? 'ரகம்' : 'Variety'}</th>
                <th className="px-4 py-3">{isTa ? 'தரம்' : 'Grade'}</th>
                <th
                  onClick={() => handleSort('min_price')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{isTa ? 'குறைந்த விலை' : 'Min (₹/Q)'}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('max_price')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{isTa ? 'அதிக விலை' : 'Max (₹/Q)'}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('modal_price')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors text-emerald-800 bg-emerald-50/50"
                >
                  <div className="flex items-center justify-end gap-1.5 font-black">
                    <span>{isTa ? 'மாதிரி விலை' : 'Modal (₹/Q)'}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {queryLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>{isTa ? 'பதிவுகளை ஏற்றுகிறது...' : 'Loading records...'}</span>
                    </div>
                  </td>
                </tr>
              ) : (queryData?.records?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="text-xs font-bold">{isTa ? 'பதிவுகள் எதுவும் இல்லை' : 'No records found'}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{isTa ? 'வடிகட்டிகளை மாற்றவும்.' : 'Adjust the filters above.'}</p>
                  </td>
                </tr>
              ) : (
                queryData?.records?.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {r.arrival_date}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {r.crop}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {r.district}
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-semibold whitespace-nowrap">
                      {r.market}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {r.variety || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.grade || 'FAQ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 font-mono whitespace-nowrap">
                      ₹{r.min_price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 font-mono whitespace-nowrap">
                      ₹{r.max_price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-800 bg-emerald-50/30 whitespace-nowrap">
                      ₹{r.modal_price.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600 font-semibold">
            {isTa ? 'பக்கம்' : 'Page'}{' '}
            <span className="font-bold text-slate-900">{queryData?.pagination?.page || 1}</span>{' '}
            {isTa ? 'மொத்தம்' : 'of'}{' '}
            <span className="font-bold text-slate-900">{queryData?.pagination?.totalPages || 1}</span>{' '}
            ({(queryData?.pagination?.totalRecords || 0).toLocaleString()} {isTa ? 'பொருந்திய பதிவுகள்' : 'matching records'})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || queryLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isTa ? 'முந்தையது' : 'Previous'}</span>
            </button>

            <span className="text-xs font-bold text-slate-700 px-2">
              {page} / {queryData?.pagination?.totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() => setPage(Math.min(queryData?.pagination?.totalPages || 1, page + 1))}
              disabled={page >= (queryData?.pagination?.totalPages || 1) || queryLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>{isTa ? 'அடுத்தது' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
