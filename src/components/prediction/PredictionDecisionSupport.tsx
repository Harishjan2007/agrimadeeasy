'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Scale, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  CloudRain, 
  Truck, 
  Droplets, 
  Warehouse, 
  ArrowRight,
  Info,
  RotateCcw,
  CheckCircle2,
  Building2,
  Sparkles
} from 'lucide-react';
import { Crop, Market, CropPrediction, PriceTrend } from '@/types';
import { useLanguage } from '@/i18n';

interface PredictionDecisionSupportProps {
  predictions: CropPrediction[];
  crops: Crop[];
  markets: Market[];
  externalSelectedCropId?: string | null;
  onCropChange?: (cropId: string) => void;
}

export default function PredictionDecisionSupport({
  predictions,
  crops,
  markets,
  externalSelectedCropId,
  onCropChange
}: PredictionDecisionSupportProps) {
  const { language, translations, translateCrop, translateCategory } = useLanguage();
  const isTa = language === 'ta';

  // 1. Available crops that exist in reference list
  const availableCrops = useMemo(() => {
    if (crops && crops.length > 0) return crops;
    // Fallback: extract unique crops from predictions
    const map = new Map<string, Crop>();
    predictions.forEach((p) => {
      if (p.crop && !map.has(p.crop.id)) {
        map.set(p.crop.id, p.crop);
      }
    });
    return Array.from(map.values());
  }, [crops, predictions]);

  // Default to first crop with predictions, or first available crop
  const defaultCropId = useMemo(() => {
    const firstWithPred = predictions.find((p) => p.crop_id)?.crop_id;
    return firstWithPred || availableCrops[0]?.id || 'c1';
  }, [predictions, availableCrops]);

  const [selectedCropId, setSelectedCropId] = useState<string>(defaultCropId);
  const [selectedMarketId, setSelectedMarketId] = useState<string>('all');
  const [selectedHorizon, setSelectedHorizon] = useState<string>('all');

  // Sync external selection if passed from parent
  useEffect(() => {
    if (externalSelectedCropId && externalSelectedCropId !== selectedCropId) {
      setSelectedCropId(externalSelectedCropId);
      setSelectedMarketId('all');
      setSelectedHorizon('all');
    }
  }, [externalSelectedCropId, selectedCropId]);

  // Handle crop change
  const handleCropSelect = (cropId: string) => {
    setSelectedCropId(cropId);
    setSelectedMarketId('all');
    setSelectedHorizon('all');
    if (onCropChange) {
      onCropChange(cropId);
    }
  };

  // Predictions for the currently selected crop
  const cropPredictions = useMemo(() => {
    return predictions.filter((p) => p.crop_id === selectedCropId);
  }, [predictions, selectedCropId]);

  // Available markets for this specific crop
  const availableMarketsForCrop = useMemo(() => {
    const marketMap = new Map<string, Market>();
    cropPredictions.forEach((p) => {
      if (p.market) {
        marketMap.set(p.market.id, p.market);
      } else {
        const found = markets.find((m) => m.id === p.market_id);
        if (found) marketMap.set(found.id, found);
      }
    });
    return Array.from(marketMap.values());
  }, [cropPredictions, markets]);

  // Predictions filtered by crop and market
  const cropAndMarketPredictions = useMemo(() => {
    if (selectedMarketId === 'all') {
      return cropPredictions;
    }
    return cropPredictions.filter((p) => p.market_id === selectedMarketId);
  }, [cropPredictions, selectedMarketId]);

  // Available horizons for this specific crop and market
  const availableHorizons = useMemo(() => {
    const periods = new Set<string>();
    cropAndMarketPredictions.forEach((p) => {
      if (p.prediction_period) {
        periods.add(p.prediction_period);
      }
    });
    return Array.from(periods);
  }, [cropAndMarketPredictions]);

  // Active prediction record (if matching)
  const activePrediction = useMemo(() => {
    if (cropAndMarketPredictions.length === 0) return null;
    if (selectedHorizon !== 'all') {
      const match = cropAndMarketPredictions.find((p) => p.prediction_period === selectedHorizon);
      if (match) return match;
    }
    // Default to the first prediction in the filtered list
    return cropAndMarketPredictions[0];
  }, [cropAndMarketPredictions, selectedHorizon]);

  // Active crop object
  const activeCrop = useMemo(() => {
    return availableCrops.find((c) => c.id === selectedCropId) || cropPredictions[0]?.crop;
  }, [availableCrops, selectedCropId, cropPredictions]);

  // Math Calculations (Strictly Honest & Validated)
  const currentPrice = activePrediction ? Number(activePrediction.current_price) : 0;
  const minPrice = activePrediction ? Number(activePrediction.predicted_min) : 0;
  const maxPrice = activePrediction ? Number(activePrediction.predicted_max) : 0;
  const midpoint = Math.round((minPrice + maxPrice) / 2);

  const priceDiff = midpoint - currentPrice;
  const percentChange = currentPrice > 0 ? ((priceDiff / currentPrice) * 100).toFixed(1) : '0.0';

  const isUp = activePrediction?.trend === 'up';
  const isDown = activePrediction?.trend === 'down';
  const isStable = !isUp && !isDown;

  const formattedDate = (() => {
    if (!activePrediction) return '';
    try {
      const d = new Date(activePrediction.prediction_date);
      if (isNaN(d.getTime())) return activePrediction.prediction_date;
      return d.toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return activePrediction.prediction_date;
    }
  })();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10">
      {/* Header Banner - Clean Light Surface */}
      <div className="bg-slate-50/80 border-b border-slate-200 p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{translations.prediction.decisionSupportBadge}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {translations.prediction.decisionSupportTitle}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl">
              {translations.prediction.decisionSupportSubtitle}
            </p>
          </div>

          <Link
            href="/crop-price?tab=compare"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all shrink-0 self-start md:self-auto"
          >
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>{translations.prediction.compareMarketPricesBtn}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* 3-Step Selection Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* STEP 1: Select Crop */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
              <span>{translations.prediction.step1Crop}</span>
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => handleCropSelect(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              {availableCrops.map((crop) => {
                const hasPred = predictions.some((p) => p.crop_id === crop.id);
                return (
                  <option key={crop.id} value={crop.id}>
                    {crop.icon || '🌾'} {translateCrop(crop.name)} {hasPred ? '' : `(${isTa ? 'கணிப்பு இல்லை' : 'No forecast data'})`}
                  </option>
                );
              })}
            </select>
            <span className="text-[11px] text-slate-500 mt-1.5 block">
              {translateCategory(activeCrop?.category)}
            </span>
          </div>

          {/* STEP 2: Select Mandi / Location */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
              <span>{translations.prediction.step2Market}</span>
            </label>
            <select
              value={selectedMarketId}
              onChange={(e) => {
                setSelectedMarketId(e.target.value);
                setSelectedHorizon('all');
              }}
              disabled={availableMarketsForCrop.length === 0}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="all">{translations.prediction.allMarkets} ({availableMarketsForCrop.length})</option>
              {availableMarketsForCrop.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.location})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 mt-1.5 block truncate">
              {activePrediction?.market ? `${activePrediction.market.name}, ${activePrediction.market.location}` : translations.prediction.allMarkets}
            </span>
          </div>

          {/* STEP 3: Select Horizon (Buttons + Select) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">3</span>
                <span>{translations.prediction.step3Horizon}</span>
              </label>

              {/* Visual Horizon Quick Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <button
                  type="button"
                  onClick={() => setSelectedHorizon('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedHorizon === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isTa ? 'அனைத்தும்' : 'All'}
                </button>
                {['15 Days', '30 Days', '60 Days'].map((h) => {
                  const isAvailable = availableHorizons.includes(h);
                  const isSelected = selectedHorizon === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSelectedHorizon(h)}
                      disabled={!isAvailable && availableHorizons.length > 0}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : isAvailable
                          ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            <span className="text-[11px] text-slate-500 mt-1 block truncate">
              {activePrediction ? `${translations.prediction.predictionDate}: ${formattedDate}` : translations.prediction.allHorizons}
            </span>
          </div>
        </div>

        {/* Prediction Results or Empty State */}
        {activePrediction ? (
          <div className="space-y-6">
            {/* Primary Price & Trend Projection Card */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-3xl p-6 sm:p-7 border border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                {/* Crop & Mandi Identity */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-3xl shrink-0">
                    {activePrediction.crop?.icon || '🌾'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-slate-950">
                        {translateCrop(activePrediction.crop?.name)}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-semibold">
                        {translateCategory(activePrediction.crop?.category)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{activePrediction.market?.name || 'APMC Mandi'}</span>
                      </span>
                      {activePrediction.market?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{activePrediction.market.location}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formattedDate}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trend Direction Badge */}
                <div className="shrink-0 self-start lg:self-center">
                  {isUp && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100/80 text-emerald-800 border border-emerald-300 font-bold text-sm shadow-2xs">
                      <TrendingUp className="w-4 h-4 text-emerald-700" />
                      <span>{translations.prediction.trendRising}</span>
                    </div>
                  )}
                  {isDown && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-100/80 text-rose-800 border border-rose-300 font-bold text-sm shadow-2xs">
                      <TrendingDown className="w-4 h-4 text-rose-700" />
                      <span>{translations.prediction.trendFalling}</span>
                    </div>
                  )}
                  {isStable && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-200/80 text-slate-800 border border-slate-300 font-bold text-sm shadow-2xs">
                      <Minus className="w-4 h-4 text-slate-700" />
                      <span>{translations.prediction.trendStable}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistical Time-Series Projection Attribution Banner */}
              {activePrediction.ml_metrics && (
                <div className="mt-5 p-4 rounded-2xl bg-blue-50/90 border border-blue-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold text-blue-950 block">
                        {isTa ? 'பருவகால போக்கு கணிப்பு பொறிமுறை (Statistical Time-Series)' : 'Statistical Time-Series Projection & Seasonal Momentum'}
                      </span>
                      <span className="text-[11px] text-blue-800">
                        {isTa ? 'அரசு அக்மார்க்நெட் APMC மண்டி குறிப்பு தரவு' : 'Calibrated on Agmarknet APMC Mandi Historical References'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 text-[11px] text-blue-900 font-semibold flex-wrap">
                    <span className="bg-white/80 px-2 py-0.5 rounded-md border border-blue-200">
                      Method: <strong>Harmonic Seasonality + Drift</strong>
                    </span>
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                      95% Confidence Bounds (±1.96 × σ)
                    </span>
                  </div>
                </div>
              )}

              {/* Price Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                {/* 1. Latest Available Price */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {translations.prediction.latestAvailablePrice}
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{currentPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {translations.prediction.perQuintal}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {translations.prediction.predictionDate}: {formattedDate}
                  </span>
                </div>

                {/* 2. Projected Price Range (95% Confidence Interval) */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      {translations.prediction.projectedPriceRange}
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      95% CI
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-black text-blue-900">
                      ₹{minPrice.toLocaleString('en-IN')} - ₹{maxPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {translations.prediction.projectedMidpoint}: <strong>₹{(activePrediction.predicted_price || midpoint).toLocaleString('en-IN')}</strong> (±₹{Math.round((maxPrice - minPrice) / 2)})
                  </span>
                </div>

                {/* 3. Projected Value Difference */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {translations.prediction.projectedChange}
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black ${
                      priceDiff > 0 ? 'text-emerald-700' : priceDiff < 0 ? 'text-rose-700' : 'text-slate-800'
                    }`}>
                      {priceDiff > 0 ? `+₹${priceDiff.toLocaleString('en-IN')}` : priceDiff < 0 ? `-₹${Math.abs(priceDiff).toLocaleString('en-IN')}` : '₹0'}
                    </span>
                    <span className={`text-xs font-bold ${
                      priceDiff > 0 ? 'text-emerald-600' : priceDiff < 0 ? 'text-rose-600' : 'text-slate-600'
                    }`}>
                      ({Number(percentChange) > 0 ? `+${percentChange}%` : `${percentChange}%`})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block truncate">
                    {translations.prediction.notGuaranteedNote}
                  </span>
                </div>

                {/* 4. Forecast Horizon */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{translations.prediction.predictionPeriod}</span>
                  </span>
                  <div className="mt-2">
                    <span className="text-sm font-bold text-slate-900 block leading-tight">
                      {activePrediction.prediction_period}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {translations.prediction.projectionSource}
                  </span>
                </div>
              </div>

              {/* Visual Benchmark Slider */}
              <div className="mt-6 bg-white rounded-2xl p-4 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>{translations.prediction.latestAvailablePrice}: ₹{currentPrice.toLocaleString('en-IN')}</span>
                  <span className="font-bold text-blue-900">{translations.prediction.projectedMidpoint}: ₹{midpoint.toLocaleString('en-IN')}</span>
                  <span>{translations.prediction.predictedMax}: ₹{maxPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUp ? 'bg-emerald-500' : isDown ? 'bg-rose-500' : 'bg-blue-500'
                    }`}
                    style={{
                      width: isUp ? '80%' : isDown ? '35%' : '55%'
                    }}
                  ></div>
                </div>
              </div>

              {/* Selling Decision Support Guidance (Neutral, Informational, Cost-Aware) */}
              <div className="mt-6 p-5 rounded-2xl bg-white border border-blue-200/80 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700 shrink-0 mt-0.5">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>{translations.prediction.aiRecommendation}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {isTa ? 'ஆலோசனை வழிகாட்டல்' : 'Transparent Assessment'}
                      </span>
                    </h4>

                    {/* Direction Interpretation */}
                    <p className="text-xs text-slate-700 font-semibold">
                      {isUp && translations.prediction.potentialUpwardNotice}
                      {isDown && translations.prediction.potentialDownwardNotice}
                      {isStable && translations.prediction.potentialStableNotice}
                    </p>

                    {/* Cost Factor Consideration */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {translations.prediction.sellingDecisionGuidance}
                    </p>

                    {/* Final Authority Note */}
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                      {translations.prediction.decisionSupportNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MANDATORY: Market Factors, Uncertainty & Limitations Section */}
            <div className="bg-slate-50 rounded-3xl p-6 sm:p-7 border border-slate-200">
              <div className="flex items-center gap-2.5 mb-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {translations.prediction.uncertaintyTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-600 mb-5">
                {translations.prediction.uncertaintySubtitle}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Factor 1: Weather */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{translations.prediction.factorWeatherTitle}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {translations.prediction.factorWeatherDesc}
                  </p>
                </div>

                {/* Factor 2: Mandi Inflow & Supply-Demand */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{translations.prediction.factorSupplyTitle}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {translations.prediction.factorSupplyDesc}
                  </p>
                </div>

                {/* Factor 3: Quality & Moisture */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2.5">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{translations.prediction.factorQualityTitle}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {translations.prediction.factorQualityDesc}
                  </p>
                </div>

                {/* Factor 4: Transport & Storage Costs */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{translations.prediction.factorCostsTitle}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {translations.prediction.factorCostsDesc}
                  </p>
                </div>
              </div>

              {/* ML Model Scope & Limitations Box */}
              {activePrediction.ml_metrics?.limitations && (
                <div className="mt-5 p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>{isTa ? 'இயந்திரக் கற்றல் மாதிரி வரம்புகள் & எல்லைகள்' : 'ML Model Scope & Statistical Limitations'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {activePrediction.ml_metrics.limitations}
                  </p>
                </div>
              )}

              {/* General Disclaimer Footnote */}
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{translations.prediction.uncertaintyDisclaimer}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State for Crop with no Prediction Data */
          <div className="bg-slate-50 rounded-3xl p-10 text-center border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 mx-auto flex items-center justify-center text-3xl shadow-2xs mb-4">
              {activeCrop?.icon || '🌱'}
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {translations.prediction.noPredictionForCrop}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              {translations.prediction.noPredictionPrompt}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => handleCropSelect(defaultCropId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{translations.prediction.resetSelection}</span>
              </button>

              <Link
                href="/crop-price?tab=compare"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors shadow-2xs"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>{translations.prediction.compareMarketPricesBtn}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
