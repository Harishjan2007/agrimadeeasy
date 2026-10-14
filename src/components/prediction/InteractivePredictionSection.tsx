'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar,
  Building2,
  MapPin,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Database,
  SlidersHorizontal,
  ChevronDown,
  Info
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import type { FilterOptions } from '@/lib/historical-data';

export default function InteractivePredictionSection() {
  const { language, translations } = useLanguage();
  const isTa = language === 'ta';

  // Filter options from historical dataset
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Form selections
  const [selectedCrop, setSelectedCrop] = useState<string>('tomato');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [selectedHorizon, setSelectedHorizon] = useState<'7 Days' | '15 Days' | '30 Days'>('15 Days');
  const [customPrice, setCustomPrice] = useState<string>('');

  // Prediction inference result
  const [predictionData, setPredictionData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch filter options on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        setOptionsLoading(true);
        const res = await fetch('/api/historical-prices?action=options');
        const json = await res.json();
        if (json.success && json.data) {
          setFilterOptions(json.data);
          // Set default crop
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

  // 2. Dependent markets for current district
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

  // Handle District Change
  const handleDistrictChange = (d: string) => {
    setSelectedDistrict(d);
    setSelectedMarket('all');
  };

  // 3. Submit Prediction
  const handleGeneratePrediction = async () => {
    if (!selectedCrop) return;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        crop: selectedCrop,
        district: selectedDistrict,
        market: selectedMarket,
        horizon: selectedHorizon
      });

      if (customPrice && Number(customPrice) > 0) {
        params.set('current_price', customPrice);
      }

      const res = await fetch(`/api/predictions/predict?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Prediction generation failed');
      }

      setPredictionData(json.data);
    } catch (err: any) {
      console.error('Prediction submission error:', err);
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run first prediction once options load
  useEffect(() => {
    if (filterOptions && !predictionData && !loading) {
      handleGeneratePrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOptions]);

  // Trend color & icon helper
  const renderTrendBadge = (trend: string) => {
    if (trend === 'up') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isTa ? 'ஏறும் போக்கு (Up)' : 'Rising (+)'}</span>
        </span>
      );
    }
    if (trend === 'down') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>{isTa ? 'இறங்கும் போக்கு (Down)' : 'Falling (-)'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-300">
        <Minus className="w-3.5 h-3.5" />
        <span>{isTa ? 'நிலையானது (Stable)' : 'Stable (=)'}</span>
      </span>
    );
  };

  // Chart computation: Combine actual historical context + prediction point
  const chartData = useMemo(() => {
    if (!predictionData) return null;

    const histPoints: { date: string; price: number; isActual: boolean }[] = (
      predictionData.historicalContext || []
    ).map((p: any) => ({
      date: p.date,
      price: p.modal_price,
      isActual: true
    }));

    const forecastPoints: { date: string; price: number; isActual: boolean }[] = [
      {
        date: predictionData.forecastDate,
        price: predictionData.predictedPrice,
        isActual: false
      }
    ];

    const allPoints = [...histPoints, ...forecastPoints];
    if (allPoints.length === 0) return null;

    const prices = allPoints.map((p) => p.price);
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    const chartMin = Math.max(0, Math.floor(minVal * 0.9));
    const chartMax = Math.ceil(maxVal * 1.1);

    return {
      allPoints,
      histPoints,
      forecastPoints,
      chartMin,
      chartMax
    };
  }, [predictionData]);

  return (
    <div id="interactive-prediction-section" className="space-y-6">
      {/* Interactive Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isTa ? 'இயந்திர கற்றல் விலை கணிப்பு இயந்திரம்' : 'Interactive ML Prediction Engine'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {isTa ? 'பயிர் விலை மதிப்பீடு உள்ளீடுகள்' : 'Generate Real ML Crop Price Forecast'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isTa
                ? 'தமிழ்நாடு Agmarknet வரலாற்று தரவுகளில் பயிற்றுவிக்கப்பட்ட Gradient Boosted Time-Series மாதிரி மூலம் துல்லியமான எதிர்கால விலை கணிப்பு.'
                : 'Calibrated on 3.78M authentic Tamil Nadu Agmarknet APMC observations using Gradient-Boosted Time-Series regression.'}
            </p>
          </div>

          <button
            onClick={handleGeneratePrediction}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition-all shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{loading ? (isTa ? 'கணிக்கிறது...' : 'Calculating ML Forecast...') : (isTa ? 'விலையை கணிக்க' : 'Submit Prediction')}</span>
          </button>
        </div>

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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 cursor-pointer"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 cursor-pointer"
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

          {/* 3. Market Dropdown (Dependent) */}
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 cursor-pointer"
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
                <option value="15 Days">15 Days (Harvest Forecast - Calibrated)</option>
                <option value="30 Days">30 Days (Monthly Trend)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Optional Custom Current Price Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {isTa
                ? 'தற்போதைய விலை காலியாக இருந்தால், 10 ஆண்டு வரலாற்று தரவுத்தொகுப்பின் சமீபத்திய மாதிரி விலை தானாகவே பயன்படுத்தப்படும்.'
                : 'Current price automatically populates from the latest historical auction rate in the selected market.'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-slate-700">{isTa ? 'தனிப்பயன் விலை:' : 'Override Base Price:'}</span>
            <div className="relative w-32">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                placeholder="Auto-fetch"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-sm font-bold">{isTa ? 'கணிப்பு பிழை' : 'Prediction Error'}</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 2. Prediction Results Display */}
      {predictionData && (
        <div className="space-y-6">
          {/* Main Forecast Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Summary & Main Predicted Rate */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {predictionData.selectedCrop.name}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                    {predictionData.selectedMarket} • {predictionData.selectedDistrict}
                  </span>
                  {renderTrendBadge(predictionData.trend)}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isTa ? 'கணிக்கப்பட்ட சந்தை விலை (Predicted Modal Price)' : 'Predicted APMC Modal Price'}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      ₹{predictionData.predictedPrice.toLocaleString()}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-blue-300">/ Quintal</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {isTa ? 'கணிப்பு இலக்கு தேதி:' : 'Forecast Horizon Target:'}{' '}
                    <span className="font-bold text-white">{predictionData.forecastDate}</span> (
                    {predictionData.horizon})
                  </p>
                </div>

                {/* 95% Confidence Interval Band */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">
                      {isTa ? '95% நம்பிக்கை இடைவெளி (Confidence Band)' : '95% Calibrated Confidence Interval'}
                    </p>
                    <p className="text-sm font-black text-emerald-400 mt-0.5">
                      ₹{predictionData.predictedMin.toLocaleString()} — ₹{predictionData.predictedMax.toLocaleString()} / Quintal
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 sm:text-right">
                    <p>{isTa ? 'அளவீடு:' : 'Calibrated test error:'} ±₹{Math.round(predictionData.mlMetrics.rmse * 1.96)}</p>
                    <p>{isTa ? 'அடிப்படை விலை:' : 'Baseline rate:'} ₹{predictionData.currentPrice.toLocaleString()} ({predictionData.currentPriceDate})</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Explore Historical Dataset Quick Jump */}
              <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xs space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Database className="w-4 h-4" />
                  <span>{isTa ? 'வரலாற்று தரவு பின்னணி' : 'Historical Data Context'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isTa
                    ? `${predictionData.selectedCrop.name} பயிருக்கான முந்தைய 10 ஆண்டு அசல் ஏலப் பதிவுகளை ஆராயவும்.`
                    : `View and audit all 10-year auction records for ${predictionData.selectedCrop.name} in Tamil Nadu APMC mandis.`}
                </p>

                <Link
                  href={`/crop-price?tab=historical&crop=${predictionData.selectedCrop.slug}&district=${encodeURIComponent(
                    predictionData.selectedDistrict
                  )}&market=${encodeURIComponent(predictionData.selectedMarket)}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  <Database className="w-4 h-4" />
                  <span>{isTa ? '10 ஆண்டு பதிவுகளை ஆராய்க' : 'Explore Historical Prices for this Crop'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Actual vs Predicted Visual Chart */}
          {chartData && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>{isTa ? 'அசல் வரலாறு vs கணிக்கப்பட்ட போக்கு' : 'Actual Historical Observations vs Predicted Value'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isTa
                      ? 'பச்சை நிறக் கோடு அசல் சந்தை ஏலங்களைக் குறிக்கிறது; நீல நிறப் புள்ளி இயந்திரக் கற்றல் கணிப்பைக் குறிக்கிறது.'
                      : 'Solid emerald line represents authentic APMC historical records; dashed blue extension denotes ML prediction.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-600" />
                    <span className="text-slate-700">{isTa ? 'அசல் பதிவுகள்' : 'Actual Historical'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-slate-700">{isTa ? 'கணிப்பு' : 'Predicted Forecast'}</span>
                  </div>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="h-64 sm:h-72 w-full pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0.25, 0.5, 0.75].map((r, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={240 * r}
                      x2="800"
                      y2={240 * r}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Historical Actual Line */}
                  <path
                    d={(() => {
                      const total = chartData.allPoints.length;
                      const points = chartData.histPoints.map((p, i) => {
                        const x = (i / (total - 1 || 1)) * 800;
                        const y = 240 - ((p.price - chartData.chartMin) / (chartData.chartMax - chartData.chartMin || 1)) * 220;
                        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                      });
                      return points.join(' ');
                    })()}
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Forecast Extension Line (Dashed) */}
                  <path
                    d={(() => {
                      const total = chartData.allPoints.length;
                      const lastHistIdx = chartData.histPoints.length - 1;
                      const lastHist = chartData.histPoints[lastHistIdx];
                      const forecast = chartData.forecastPoints[0];

                      if (!lastHist || !forecast) return '';

                      const x1 = (lastHistIdx / (total - 1 || 1)) * 800;
                      const y1 = 240 - ((lastHist.price - chartData.chartMin) / (chartData.chartMax - chartData.chartMin || 1)) * 220;

                      const x2 = ((total - 1) / (total - 1 || 1)) * 800;
                      const y2 = 240 - ((forecast.price - chartData.chartMin) / (chartData.chartMax - chartData.chartMin || 1)) * 220;

                      return `M ${x1},${y1} L ${x2},${y2}`;
                    })()}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                  />

                  {/* Actual Points (Emerald) */}
                  {chartData.histPoints.map((p, i) => {
                    const total = chartData.allPoints.length;
                    const x = (i / (total - 1 || 1)) * 800;
                    const y = 240 - ((p.price - chartData.chartMin) / (chartData.chartMax - chartData.chartMin || 1)) * 220;
                    return (
                      <circle
                        key={`hist-${i}`}
                        cx={x}
                        cy={y}
                        r="3.5"
                        className="fill-white stroke-emerald-600 stroke-2"
                      />
                    );
                  })}

                  {/* Predicted Point (Indigo / Glowing) */}
                  {(() => {
                    const total = chartData.allPoints.length;
                    const forecast = chartData.forecastPoints[0];
                    if (!forecast) return null;
                    const x = 800;
                    const y = 240 - ((forecast.price - chartData.chartMin) / (chartData.chartMax - chartData.chartMin || 1)) * 220;
                    return (
                      <g>
                        <circle cx={x} cy={y} r="8" className="fill-blue-500/30 animate-ping" />
                        <circle cx={x} cy={y} r="6" className="fill-blue-600 stroke-white stroke-2" />
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Bottom Timeline Labels */}
              <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-400 font-semibold pt-2 border-t border-slate-100">
                <span>{chartData.histPoints[0]?.date} (Actual)</span>
                <span className="text-slate-500">
                  {isTa ? 'அளவீடு: ₹ / குவிண்டால்' : 'Unit: ₹ / Quintal'}
                </span>
                <span className="text-blue-600 font-bold">{predictionData.forecastDate} (Forecast)</span>
              </div>
            </div>
          )}

          {/* Multi-Date Forecast Horizon Projections Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {isTa ? 'கால எல்லை கணிப்பு ஒப்பீடு' : 'Multi-Horizon Forecast Projections'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTa
                  ? '7 நாள், 15 நாள் மற்றும் 30 நாள் கணிப்பு ஒப்பீடு.'
                  : 'Point forecasts and calibrated bounds across 7-day, 15-day, and 30-day horizons.'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">{isTa ? 'கால எல்லை' : 'Horizon'}</th>
                    <th className="px-5 py-3">{isTa ? 'இலக்கு தேதி' : 'Forecast Date'}</th>
                    <th className="px-5 py-3 text-right">{isTa ? 'கணிக்கப்பட்ட விலை' : 'Predicted Price'}</th>
                    <th className="px-5 py-3 text-right">{isTa ? '95% நம்பிக்கை வரம்பு' : '95% Confidence Band'}</th>
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
                          ₹{proj.predictedPrice.toLocaleString()} / Q
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-slate-600 whitespace-nowrap">
                          ₹{proj.predictedMin.toLocaleString()} – ₹{proj.predictedMax.toLocaleString()}
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

          {/* Model Information, Metrics, and Limitations */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>{isTa ? 'மாதிரி வெளிப்படைத்தன்மை & துல்லியம்' : 'Model Transparency & Verification Metrics'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Model Architecture</p>
                <p className="text-xs sm:text-sm font-bold text-white mt-1">HistGradientBoosting</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Scikit-Learn v3.2.0</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Training Dataset</p>
                <p className="text-xs sm:text-sm font-bold text-white mt-1">3,781,229 Records</p>
                <p className="text-[10px] text-slate-400 mt-0.5">TN Mandis (2016–2026)</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Test MAE</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-1">
                  ₹{predictionData.mlMetrics.mae.toLocaleString()} / Quintal
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Mean Absolute Error</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Test RMSE & R²</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-1">
                  ₹{predictionData.mlMetrics.rmse} (R²: {predictionData.mlMetrics.r2_score})
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Out-of-sample evaluated</p>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 border-t border-slate-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-300">Features Used:</strong>{' '}
                {predictionData.mlMetrics.features_used.join(', ')}. {predictionData.mlMetrics.limitations}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
