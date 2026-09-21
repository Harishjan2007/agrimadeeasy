'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Scale, 
  Building2, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Info, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { CropPrice, Crop, Market } from '@/types';
import { useLanguage } from '@/i18n';

interface CropPriceComparisonProps {
  cropPrices: CropPrice[];
  crops: Crop[];
  markets: Market[];
  loading?: boolean;
}

export default function CropPriceComparison({
  cropPrices,
  crops,
  markets,
  loading = false
}: CropPriceComparisonProps) {
  const { language, translations, translateCrop, translateCategory } = useLanguage();
  const isTa = language === 'ta';
  const t = translations.cropPrices;

  // Selected crop ID (defaults to first available crop that has prices, or crops[0])
  const [selectedCropId, setSelectedCropId] = useState<string>(() => {
    const cropWithPrices = crops.find(c => cropPrices.some(p => p.crop_id === c.id));
    return cropWithPrices?.id || crops[0]?.id || '';
  });

  // Market filter ('all' to compare all markets for this crop, or specific market ID)
  const [selectedMarketFilter, setSelectedMarketFilter] = useState<string>('all');

  // Quantity in Quintals for gross revenue estimate
  const [quantity, setQuantity] = useState<number>(25);

  // Selected crop entity
  const selectedCrop = useMemo(() => {
    return crops.find(c => c.id === selectedCropId) || {
      id: selectedCropId,
      name: 'Crop',
      category: 'Cereals',
      icon: '🌾'
    };
  }, [crops, selectedCropId]);

  // All available prices for the selected crop across all markets
  const allPricesForCrop = useMemo(() => {
    if (!selectedCropId) return [];
    return cropPrices.filter(p => p.crop_id === selectedCropId);
  }, [cropPrices, selectedCropId]);

  // Available markets that specifically have price records for this crop
  const marketsForThisCrop = useMemo(() => {
    const marketMap = new Map<string, Market>();
    allPricesForCrop.forEach(p => {
      if (p.market && !marketMap.has(p.market_id)) {
        marketMap.set(p.market_id, p.market);
      }
    });
    return Array.from(marketMap.values());
  }, [allPricesForCrop]);

  // Filtered prices based on market selection
  const displayedPrices = useMemo(() => {
    if (selectedMarketFilter === 'all') {
      return allPricesForCrop;
    }
    return allPricesForCrop.filter(p => p.market_id === selectedMarketFilter || p.market?.id === selectedMarketFilter);
  }, [allPricesForCrop, selectedMarketFilter]);

  // Comparison metrics (derived only when prices exist)
  const comparisonStats = useMemo(() => {
    if (displayedPrices.length === 0) return null;

    const priceValues = displayedPrices.map(p => Number(p.price));
    const highest = Math.max(...priceValues);
    const lowest = Math.min(...priceValues);
    const difference = highest - lowest;
    const sum = priceValues.reduce((acc, curr) => acc + curr, 0);
    const average = Math.round(sum / priceValues.length);

    const highestItem = displayedPrices.find(p => Number(p.price) === highest);
    const lowestItem = displayedPrices.find(p => Number(p.price) === lowest);

    return {
      highest,
      lowest,
      difference,
      average,
      highestItem,
      lowestItem,
      count: displayedPrices.length,
      isMultiple: displayedPrices.length > 1
    };
  }, [displayedPrices]);

  // Reset filter
  const handleResetFilters = () => {
    setSelectedMarketFilter('all');
    setQuantity(25);
  };

  // Format date helper (honest: only formatted if valid date string exists)
  const formatRecordedDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Purpose Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-emerald-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-300/80">
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.compareBadge}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t.compareTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {t.compareSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Link
              href="/prediction"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.viewPredictionsBtn}</span>
            </Link>
          </div>
        </div>

        {/* 2. Interactive Selection Form (Crop, Market, Quantity) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          
          {/* Step 1: Select Crop */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
              <span>{t.selectCropLabel}</span>
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => {
                setSelectedCropId(e.target.value);
                setSelectedMarketFilter('all'); // Reset market filter on crop switch
              }}
              disabled={crops.length === 0 || loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            >
              {crops.length === 0 ? (
                <option value="">{t.noPricesFound}</option>
              ) : (
                crops.map((c) => {
                  const hasPrices = cropPrices.some(p => p.crop_id === c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.icon || '🌾'} {translateCrop(c.name)} {hasPrices ? '' : `(${isTa ? 'விலை தகவல் இல்லை' : 'No data'})`}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Step 2: Filter Market / Location */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
              <span>{t.filterMarketLabel}</span>
            </label>
            <select
              value={selectedMarketFilter}
              onChange={(e) => setSelectedMarketFilter(e.target.value)}
              disabled={allPricesForCrop.length === 0 || loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            >
              <option value="all">
                {t.allAvailableMarkets} ({marketsForThisCrop.length})
              </option>
              {marketsForThisCrop.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.location})
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Enter Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">3</span>
                <span>{t.enterQuantityLabel}</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {t.unitQuintals}
              </span>
            </label>
            <input
              type="number"
              min="1"
              max="100000"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              placeholder={t.quantityPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
          </div>

        </div>

      </div>

      {/* 3. Output Section: Loading, Empty, Single Market, or Multi-Market Comparison */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded-full w-28"></div>
              <div className="h-7 bg-slate-200 rounded-lg w-1/2"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="h-12 bg-slate-50 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : displayedPrices.length === 0 ? (
        /* State 1: NO PRICE DATA (TEST 3) */
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {t.noPriceDataNotice}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {t.noPriceDataDesc}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                const cropWithData = crops.find(c => cropPrices.some(p => p.crop_id === c.id));
                if (cropWithData) setSelectedCropId(cropWithData.id);
                setSelectedMarketFilter('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isTa ? 'விலை உள்ள பயிரைத் தேர்ந்தெடுக்கவும்' : 'Select Crop with Available Prices'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* State 2: ONLY ONE MARKET PRICE (TEST 2) */}
          {!comparisonStats?.isMultiple && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-start gap-3 text-blue-900 text-xs">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{t.onlyOnePriceNotice}</span>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  {t.onlyOnePriceDesc}
                </p>
              </div>
            </div>
          )}

          {/* State 3: MULTIPLE MARKETS SIDE-BY-SIDE SUMMARY (TEST 1) */}
          {comparisonStats?.isMultiple && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Stat 1: Highest Available Price */}
              <div className="bg-white rounded-2xl p-4 border border-emerald-200/90 shadow-2xs">
                <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    {t.highestAvailablePrice}
                  </span>
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-black text-slate-900">
                  ₹{comparisonStats.highest.toLocaleString('en-IN')}
                  <span className="text-xs font-semibold text-slate-500 ml-1">/Q</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-600 truncate font-medium">
                  {comparisonStats.highestItem?.market?.name || 'Mandi'}
                </p>
                <p className="text-[10px] text-emerald-700 italic mt-0.5 font-medium">
                  {t.highestPriceNotice}
                </p>
              </div>

              {/* Stat 2: Lowest Available Price */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
                    {t.lowestAvailablePrice}
                  </span>
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-black text-slate-800">
                  ₹{comparisonStats.lowest.toLocaleString('en-IN')}
                  <span className="text-xs font-semibold text-slate-500 ml-1">/Q</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-600 truncate font-medium">
                  {comparisonStats.lowestItem?.market?.name || 'Mandi'}
                </p>
                <p className="text-[10px] text-slate-500 italic mt-0.5 font-medium">
                  {t.lowestPriceNotice}
                </p>
              </div>

              {/* Stat 3: Price Difference */}
              <div className="bg-white rounded-2xl p-4 border border-amber-200/90 shadow-2xs">
                <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    {t.priceDifference}
                  </span>
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-black text-amber-900">
                  ₹{comparisonStats.difference.toLocaleString('en-IN')}
                  <span className="text-xs font-semibold text-slate-500 ml-1">/Q</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-800 leading-tight">
                  {comparisonStats.difference > 0 ? (
                    <span>
                      {Math.round((comparisonStats.difference / comparisonStats.lowest) * 100)}% {isTa ? 'சந்தைகளுக்கு இடையே வித்தியாசம்' : 'spread across markets'}
                    </span>
                  ) : (
                    <span>{isTa ? 'விலை சமமாக உள்ளது' : 'Uniform pricing across markets'}</span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {t.priceDifferenceDesc}
                </p>
              </div>

              {/* Stat 4: Average Available Price */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  <span>{t.averageAvailablePrice}</span>
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-black text-slate-900">
                  ₹{comparisonStats.average.toLocaleString('en-IN')}
                  <span className="text-xs font-semibold text-slate-500 ml-1">/Q</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-600 font-medium">
                  {isTa ? `${comparisonStats.count} சந்தைகளின் சராசரி` : `Computed across ${comparisonStats.count} markets`}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {t.availableMarketsCount}: {comparisonStats.count}
                </p>
              </div>

            </div>
          )}

          {/* 4. Side-by-Side Market Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{isTa ? `${translateCrop(selectedCrop.name)} - சந்தை வாரியான ஒப்பீடு` : `${selectedCrop.name} - Available Market Prices`}</span>
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  {displayedPrices.length} {isTa ? 'சந்தைகள்' : 'Markets'}
                </span>
              </h3>
              {selectedMarketFilter !== 'all' && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isTa ? 'அனைத்து சந்தைகளையும் காண்க' : 'Show All Markets'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedPrices.map((item) => {
                const itemPrice = Number(item.price);
                const isHighest = comparisonStats?.isMultiple && itemPrice === comparisonStats.highest;
                const isLowest = comparisonStats?.isMultiple && itemPrice === comparisonStats.lowest && comparisonStats.difference > 0;
                const recordedDateStr = formatRecordedDate(item.recorded_at);
                const estimatedGrossValue = Math.round(quantity * itemPrice);

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      isHighest
                        ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-sm'
                        : 'border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Card Header: Market & Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{item.market?.name || (isTa ? 'ஒழுங்குமுறை சந்தை' : 'Regulated Market')}</span>
                          </h4>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.market?.location || (isTa ? 'தமிழ்நாடு' : 'Tamil Nadu')}</span>
                          </div>
                        </div>

                        {/* High/Low Status Badges */}
                        {isHighest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                            <TrendingUp className="w-3 h-3" />
                            <span>{isTa ? 'அதிகபட்ச விலை' : 'Highest'}</span>
                          </span>
                        )}
                        {isLowest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                            <TrendingDown className="w-3 h-3" />
                            <span>{isTa ? 'குறைந்தபட்ச விலை' : 'Lowest'}</span>
                          </span>
                        )}
                      </div>

                      {/* Price Box */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-50/90 border border-slate-100">
                        <div className="text-[11px] font-semibold text-slate-500">
                          {t.latestAvailablePrice}
                        </div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black text-slate-900">
                            ₹{itemPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            /{item.unit || 'Quintal'}
                          </span>
                        </div>

                        {/* Difference vs Average */}
                        {comparisonStats?.isMultiple && (
                          <div className="mt-1.5 text-[11px] font-medium flex items-center gap-1">
                            {itemPrice >= comparisonStats.average ? (
                              <span className="text-emerald-700">
                                +₹{(itemPrice - comparisonStats.average).toLocaleString('en-IN')} {t.differenceFromAvg}
                              </span>
                            ) : (
                              <span className="text-rose-600">
                                -₹{(comparisonStats.average - itemPrice).toLocaleString('en-IN')} {t.differenceFromAvg}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Estimated Gross Value Box */}
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                        <div className="text-[11px] font-bold text-emerald-900">
                          {t.estimatedGrossValueFor} {quantity} {t.quintals}
                        </div>
                        <div className="text-lg font-black text-emerald-900 mt-0.5">
                          ₹{estimatedGrossValue.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-emerald-800/80 mt-0.5">
                          {quantity} Q × ₹{itemPrice.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Recorded Date & Source */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                      {recordedDateStr && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{t.updatedOn}: {recordedDateStr}</span>
                        </div>
                      )}
                      {item.source && (
                        <div className="truncate text-slate-400">
                          <span>{t.sourceLabel}: {item.source}</span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Neutral Decision Support & Cost Disclaimer Callouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* Neutral Decision Support */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.decisionSupportTitle}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{t.neutralAdviceCompare}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{t.neutralAdviceTransport}</span>
                </li>
                {comparisonStats?.isMultiple && (
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>
                      {isTa
                        ? `தற்போதைய தகவல்களில் ${comparisonStats.highestItem?.market?.name} சந்தையில் அதிகபட்ச விலை (₹${comparisonStats.highest.toLocaleString('en-IN')}) பதிவாகியுள்ளது.`
                        : `Highest available price in selected data is at ${comparisonStats.highestItem?.market?.name} (₹${comparisonStats.highest.toLocaleString('en-IN')}).`}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Cost Disclaimer */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{isTa ? 'முக்கிய விற்பனைச் செலவு குறிப்பு' : 'Important Selling Cost Note'}</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-950 font-medium">
                {t.costDisclaimer}
              </p>
              <p className="text-[11px] text-amber-800/80 italic">
                {isTa
                  ? 'AgriME உத்தேச மதிப்பீட்டை மட்டுமே வழங்குகிறது; இறுதி நிகர லாபம் விவசாயியின் உண்மையான செலவுகளைப் பொறுத்தது.'
                  : 'AgriME provides gross price estimates only. Actual net realizations depend on individual logistics and mandi charges.'}
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
