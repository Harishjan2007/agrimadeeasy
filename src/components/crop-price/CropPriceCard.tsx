'use client';

import React from 'react';
import { Building2, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { CropPrice } from '@/types';
import { useLanguage } from '@/i18n';

interface CropPriceCardProps {
  item: CropPrice;
  bestDealerPrice?: number;
}

export default function CropPriceCard({ item, bestDealerPrice }: CropPriceCardProps) {
  const { language, translations, translateCrop, translateCategory } = useLanguage();
  const isTa = language === 'ta';

  const formattedDate = (() => {
    try {
      const date = new Date(item.recorded_at);
      if (isNaN(date.getTime())) return isTa ? 'சமீபத்தில்' : 'Recently';
      return date.toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isTa ? 'சமீபத்தில்' : 'Recently';
    }
  })();

  const unitDisplay = item.unit?.includes('/') ? item.unit.split('/')[1] : item.unit || (isTa ? 'குவிண்டால்' : 'Quintal');

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-agri-300 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top bar: Icon, Crop Name & Category */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-agri-50 to-agri-100 border border-agri-200 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              {item.crop?.icon || '🌾'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-agri-700 transition-colors">
                {translateCrop(item.crop?.name)}
              </h3>
              <span className="inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 mt-0.5">
                {translateCategory(item.crop?.category)}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-medium bg-agri-50 text-agri-800 border border-agri-200/80 px-2 py-0.5 rounded-md shrink-0">
            {isTa ? 'ஒழுங்குமுறை மண்டி' : 'APMC Mandi'}
          </span>
        </div>

        {/* Price Display */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 my-3">
          <div className="text-[11px] font-medium text-slate-500">
            {translations.cropPrices.currentRate}
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-slate-900">
              ₹{Number(item.price).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              /{unitDisplay}
            </span>
          </div>

          {bestDealerPrice && bestDealerPrice > item.price && (
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {isTa ? 'வியாபாரி கொள்முதல் விலை:' : 'Dealer Buy Quote:'}
              </span>
              <span className="font-bold text-emerald-700">
                ₹{bestDealerPrice.toLocaleString('en-IN')}/{unitDisplay}
              </span>
            </div>
          )}
        </div>

        {/* Market & Location Metadata */}
        <div className="space-y-1.5 text-xs text-slate-600 mt-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800 truncate">{item.market?.name || (isTa ? 'உள்ளூர் மண்டி' : 'Local Mandi')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 truncate">{item.market?.location || (isTa ? 'ஒழுங்குமுறை சந்தை' : 'Regulated Market')}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{isTa ? 'புதுப்பிக்கப்பட்டது' : 'Updated'}: {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Footer: Source */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[180px]">{translations.common.source}: {item.source || 'APMC Market'}</span>
        <span className="text-agri-600 font-medium group-hover:underline">{translations.common.viewDetails} →</span>
      </div>
    </div>
  );
}
