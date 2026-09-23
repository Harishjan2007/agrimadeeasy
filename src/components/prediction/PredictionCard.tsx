'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Building2, 
  Calendar, 
  Clock,
  MapPin
} from 'lucide-react';
import { CropPrediction } from '@/types';
import { useLanguage } from '@/i18n';

interface PredictionCardProps {
  prediction: CropPrediction;
  onSelect?: (prediction: CropPrediction) => void;
}

export default function PredictionCard({ prediction, onSelect }: PredictionCardProps) {
  const { language, translations, translateCrop, translateCategory } = useLanguage();
  const isTa = language === 'ta';

  const isUp = prediction.trend === 'up';
  const isDown = prediction.trend === 'down';
  const isStable = !isUp && !isDown;

  const currentPrice = Number(prediction.current_price);
  const minPrice = Number(prediction.predicted_min);
  const maxPrice = Number(prediction.predicted_max);
  const avgPredicted = Math.round((minPrice + maxPrice) / 2);

  const diff = avgPredicted - currentPrice;
  const percentChange = currentPrice > 0 ? ((diff / currentPrice) * 100).toFixed(1) : '0.0';

  const formattedDate = (() => {
    try {
      const d = new Date(prediction.prediction_date);
      if (isNaN(d.getTime())) return prediction.prediction_date;
      return d.toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return prediction.prediction_date;
    }
  })();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-agri-300 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top: Crop Icon, Name & Trend Pill */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-agri-50 to-agri-100 border border-agri-200 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              {prediction.crop?.icon || '🌾'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-agri-700 transition-colors">
                {translateCrop(prediction.crop?.name)}
              </h3>
              <span className="text-[10px] font-medium text-slate-500 block">
                {translateCategory(prediction.crop?.category)}
              </span>
            </div>
          </div>

          {/* Trend Badge */}
          <div className="shrink-0">
            {isUp && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5" />
                {translations.prediction.increasing} ({Number(percentChange) > 0 ? `+${percentChange}%` : `${percentChange}%`})
              </span>
            )}
            {isDown && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <TrendingDown className="w-3.5 h-3.5" />
                {translations.prediction.decreasing} ({percentChange}%)
              </span>
            )}
            {isStable && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <Minus className="w-3.5 h-3.5" />
                {translations.prediction.stable}
              </span>
            )}
          </div>
        </div>

        {/* Current vs Predicted Price Box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 my-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">{translations.prediction.currentPrice}</span>
              <span className="text-lg font-black text-slate-800">
                ₹{currentPrice.toLocaleString('en-IN')}
                <span className="text-[10px] font-normal text-slate-500 ml-0.5">/{isTa ? 'குவிண்டால்' : 'Q'}</span>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-medium text-slate-500 block">{translations.prediction.predictedRange}</span>
                <span className="text-[9px] font-bold uppercase text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                  95% CI
                </span>
              </div>
              <span className="text-lg font-black text-blue-900">
                ₹{minPrice.toLocaleString('en-IN')} - ₹{maxPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Visual Range bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/70">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>{isTa ? 'எதிர்பார்க்கப்படும் சராசரி' : 'Expected Average'}</span>
              <span className="font-semibold text-slate-700">₹{avgPredicted.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isUp ? 'bg-emerald-500' : isDown ? 'bg-rose-500' : 'bg-blue-500'
                }`}
                style={{ width: isUp ? '80%' : isDown ? '40%' : '60%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Prediction Period & Market Info */}
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800">{translations.prediction.predictionPeriod}: {prediction.prediction_period}</span>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 truncate">{prediction.market?.name || 'APMC Mandi'}</span>
          </div>

          {prediction.market?.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 truncate">{prediction.market.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{translations.prediction.predictionDate}: {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 truncate">{translations.prediction.priceDirection}:</span>
        <button
          type="button"
          onClick={() => onSelect && onSelect(prediction)}
          className="text-blue-700 font-bold hover:text-blue-800 hover:underline flex items-center gap-1"
        >
          <span>{isTa ? 'ஆலோசனை விவரங்கள்' : 'Open Decision Support'}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
