'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  History,
  ShieldCheck
} from 'lucide-react';
import { CropPrice } from '@/types';
import { useLanguage } from '@/i18n';
import { getProvenanceBadgeConfig } from '@/lib/agmarknet';

interface CropPriceCardProps {
  item: CropPrice;
  bestDealerPrice?: number;
  highestPrice?: number;
  lowestPrice?: number;
  averagePrice?: number;
  priceDiff?: number;
}

export default function CropPriceCard({
  item,
  bestDealerPrice,
  highestPrice,
  lowestPrice,
  averagePrice,
  priceDiff
}: CropPriceCardProps) {
  const { language, translations, translateCrop, translateCategory } = useLanguage();
  const isTa = language === 'ta';
  const [showHistory, setShowHistory] = useState(false);

  const formattedDate = (() => {
    try {
      const dateStr = item.arrival_date || item.recorded_at;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return isTa ? 'சமீபத்திய குறிப்பு' : 'Recent quote';
      return date.toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isTa ? 'சமீபத்திய குறிப்பு' : 'Recent quote';
    }
  })();

  const unitDisplay = item.unit?.includes('/')
    ? item.unit.split('/')[1]
    : item.unit || (isTa ? 'குவிண்டால்' : 'Quintal');

  const badge = getProvenanceBadgeConfig(item.source_status);
  const history = item.historical_prices || [];

  // Calculate historical trend
  const trendDir = (() => {
    if (!history || history.length < 2) return 'stable';
    const first = history[0].price;
    const last = history[history.length - 1].price;
    if (last > first + 20) return 'up';
    if (last < first - 20) return 'down';
    return 'stable';
  })();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-card hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top bar: Icon, Crop Name & Category + Honest Provenance Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              {item.crop?.icon || '🌾'}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-agri-700 transition-colors">
                {translateCrop(item.crop?.name)}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {translateCategory(item.crop?.category)}
                </span>
                {item.variety && (
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[140px]">
                    {item.variety}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Honest Provenance Badge */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-2xs ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}
              title={isTa ? badge.descriptionTa : badge.descriptionEn}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`}></span>
              <span>{isTa ? badge.labelTa : badge.labelEn}</span>
            </span>
          </div>
        </div>

        {/* Dominant Price Display */}
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-100 my-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isTa ? 'மண்டி மாதிரி விலை (Modal Rate)' : 'Mandi Modal Rate'}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formattedDate}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{Number(item.modal_price || item.price).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                /{unitDisplay}
              </span>
            </div>

            {/* Price Trend Direction Indicator */}
            {history.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  trendDir === 'up'
                    ? 'bg-emerald-100 text-emerald-800'
                    : trendDir === 'down'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {trendDir === 'up' && <TrendingUp className="w-3 h-3 text-emerald-700" />}
                {trendDir === 'down' && <TrendingDown className="w-3 h-3 text-rose-700" />}
                {trendDir === 'stable' && <Minus className="w-3 h-3 text-slate-600" />}
                <span>{trendDir === 'up' ? (isTa ? 'உயர்வு' : '+Trend') : trendDir === 'down' ? (isTa ? 'சரிவு' : '-Trend') : (isTa ? 'நிலையானது' : 'Stable')}</span>
              </span>
            )}
          </div>

          {/* Min / Max Mandi Range */}
          {(item.min_price || item.max_price) && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{isTa ? 'குறைந்தது:' : 'Min:'}</span>
                <span className="font-bold text-slate-700">₹{(item.min_price || Math.round(item.price * 0.96)).toLocaleString('en-IN')}</span>
              </div>
              <div className="text-slate-300">|</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{isTa ? 'அதிகபட்சம்:' : 'Max:'}</span>
                <span className="font-bold text-emerald-700">₹{(item.max_price || Math.round(item.price * 1.04)).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Best Dealer Quote Alert if available */}
          {bestDealerPrice && bestDealerPrice > item.price && (
            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {isTa ? 'வியாபாரி கொள்முதல் விலை:' : 'Dealer Quote:'}
              </span>
              <span className="font-black text-emerald-700">
                ₹{bestDealerPrice.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>

        {/* Historical Price Sparkline / Micro View Toggle */}
        {history.length > 0 && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-agri-700 hover:text-agri-800 py-1"
            >
              <span className="flex items-center gap-1">
                <History className="w-3 h-3" />
                <span>{showHistory ? (isTa ? 'வரலாற்றை மறை' : 'Hide 30-Day History') : (isTa ? '30 நாள் விலை வரலாறு' : 'View 30-Day History')}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {history.length} {isTa ? 'பதிவுகள்' : 'data points'}
              </span>
            </button>

            {showHistory && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200 pb-1">
                  <span>{isTa ? 'தேதி' : 'Date'}</span>
                  <span>{isTa ? 'மாதிரி விலை' : 'Modal Price'}</span>
                </div>
                {history.map((pt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-700">
                    <span className="font-mono text-[10px]">{pt.date}</span>
                    <span className="font-bold text-slate-900">₹{pt.price.toLocaleString('en-IN')}/{unitDisplay}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Market & Location Metadata */}
        <div className="space-y-1.5 text-xs text-slate-600 mt-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold text-slate-800 truncate">
                {item.market?.name || (isTa ? 'உள்ளூர் மண்டி' : 'Local Mandi')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 truncate text-[11px]">
              {item.market?.location || (isTa ? 'ஒழுங்குமுறை சந்தை' : 'Regulated Market')}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate pt-0.5">
            {isTa ? 'ஆதாரம்:' : 'Source:'} <span className="font-medium text-slate-600">{item.source}</span>
          </div>
        </div>
      </div>

      {/* Primary Actions: Compare & View on Map */}
      <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          href={`/crop-price?crop=${item.crop_id}`}
          className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1 shadow-2xs"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{isTa ? 'மண்டிகளை ஒப்பிடு' : 'Compare Markets'}</span>
        </Link>

        {item.market_id && (
          <Link
            href={`/map?category=markets&id=${item.market_id}`}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
            title={translations.map?.viewOnMap || 'View on Map'}
          >
            <MapPin className="w-4 h-4 text-slate-600" />
          </Link>
        )}
      </div>
    </div>
  );
}
