'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  MapPin,
  Calendar,
  ArrowRight,
  Info,
  CalendarDays,
  Scale
} from 'lucide-react';
import { CropPrice } from '@/types';
import { getCropPrices } from '@/lib/supabase/crops';
import { useLanguage } from '@/i18n';

interface SeasonalCropMeta {
  seasonKey: 'kharif_kuruvai' | 'rabi_samba' | 'horticultural';
  seasonNameEn: string;
  seasonNameTa: string;
  seasonMonths: string;
  seasonBadgeColor: string;
}

// Supported Tamil Nadu Department of Agriculture cropping calendar classifications
const SEASONAL_CLASSIFICATIONS: Record<string, SeasonalCropMeta> = {
  paddy: {
    seasonKey: 'rabi_samba',
    seasonNameEn: 'Samba / Rabi Season',
    seasonNameTa: 'சம்பா / தாளடி பருவம்',
    seasonMonths: 'Oct – Feb',
    seasonBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  rice: {
    seasonKey: 'rabi_samba',
    seasonNameEn: 'Samba / Rabi Season',
    seasonNameTa: 'சம்பா / தாளடி பருவம்',
    seasonMonths: 'Oct – Feb',
    seasonBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  wheat: {
    seasonKey: 'rabi_samba',
    seasonNameEn: 'Rabi Season Grain',
    seasonNameTa: 'ரபி பருவ தானியம்',
    seasonMonths: 'Nov – Mar',
    seasonBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  maize: {
    seasonKey: 'kharif_kuruvai',
    seasonNameEn: 'Kuruvai / Kharif Season',
    seasonNameTa: 'குறுவை / காரீப் பருவம்',
    seasonMonths: 'Jun – Oct',
    seasonBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  groundnut: {
    seasonKey: 'kharif_kuruvai',
    seasonNameEn: 'Kuruvai / Kharif Season',
    seasonNameTa: 'குறுவை / காரீப் பருவம்',
    seasonMonths: 'Jul – Oct',
    seasonBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  cotton: {
    seasonKey: 'kharif_kuruvai',
    seasonNameEn: 'Kharif Harvest Season',
    seasonNameTa: 'காரீப் அறுவடை பருவம்',
    seasonMonths: 'Aug – Nov',
    seasonBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  soybean: {
    seasonKey: 'kharif_kuruvai',
    seasonNameEn: 'Kharif Oilseed',
    seasonNameTa: 'காரீப் எண்ணெய் வித்து',
    seasonMonths: 'Jul – Oct',
    seasonBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  tomato: {
    seasonKey: 'horticultural',
    seasonNameEn: 'Continuous Horticulture',
    seasonNameTa: 'ஆண்டு முழுமை காய்கறி',
    seasonMonths: 'Year-Round Harvest',
    seasonBadgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  onion: {
    seasonKey: 'horticultural',
    seasonNameEn: 'Continuous Horticulture',
    seasonNameTa: 'வணிக காய்கறி வரத்து',
    seasonMonths: 'Year-Round Arrivals',
    seasonBadgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  sugarcane: {
    seasonKey: 'horticultural',
    seasonNameEn: 'Annual Commercial Crop',
    seasonNameTa: 'வருடாந்திர வணிகப் பயிர்',
    seasonMonths: '10–12 Month Cycle',
    seasonBadgeColor: 'bg-teal-100 text-teal-800 border-teal-200'
  }
};

function getSeasonMeta(cropName?: string): SeasonalCropMeta {
  if (!cropName) {
    return {
      seasonKey: 'horticultural',
      seasonNameEn: 'Seasonal Crop',
      seasonNameTa: 'பருவகால பயிர்',
      seasonMonths: 'Current Season',
      seasonBadgeColor: 'bg-slate-100 text-slate-800 border-slate-200'
    };
  }
  const lower = cropName.toLowerCase();
  for (const [key, meta] of Object.entries(SEASONAL_CLASSIFICATIONS)) {
    if (lower.includes(key)) return meta;
  }
  return {
    seasonKey: 'horticultural',
    seasonNameEn: 'Seasonal Crop',
    seasonNameTa: 'பருவகால பயிர்',
    seasonMonths: 'Current Season',
    seasonBadgeColor: 'bg-slate-100 text-slate-800 border-slate-200'
  };
}

export default function HomeCommandCenter() {
  const { language, translations, translateCrop } = useLanguage();
  const isTa = language === 'ta';

  const [prices, setPrices] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<'all' | 'rabi_samba' | 'kharif_kuruvai' | 'horticultural'>('all');

  useEffect(() => {
    async function loadPrices() {
      try {
        setLoading(true);
        const res = await getCropPrices();
        if (res.data && res.data.length > 0) {
          setPrices(res.data);
        }
      } catch (err) {
        console.error('Failed to load seasonal crop prices for home page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPrices();
  }, []);

  // Filter seasonal crops based on supported classification
  const seasonalCrops = useMemo(() => {
    return prices.map((item) => {
      const meta = getSeasonMeta(item.crop?.name);
      return {
        ...item,
        seasonMeta: meta
      };
    });
  }, [prices]);

  const displayedSeasonalCrops = useMemo(() => {
    if (selectedSeason === 'all') return seasonalCrops;
    return seasonalCrops.filter((c) => c.seasonMeta.seasonKey === selectedSeason);
  }, [seasonalCrops, selectedSeason]);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Simple, Concise Introduction to AgriME */}
      <section className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                {isTa ? 'தமிழ்நாடு விவசாய தளம்' : 'Tamil Nadu Farmers Portal'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isTa ? 'AgriME — நேரடி விவசாய சேவைகள் & மண்டி தகவல்' : 'AgriME — Direct Agricultural Services & Mandi Intelligence'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isTa
                ? 'AgriME விவசாயிகள் துல்லியமான மண்டி பயிர் விலைகள், எதிர்கால விலை முன்னறிவிப்புகள் மற்றும் விவசாய உபகரண வாடகை, நேரடி வியாபாரிகள் மற்றும் அரசு நலத்திட்டங்கள் போன்ற அத்தியாவசிய சேவைகளை எளிதாகப் பெற உதவுகிறது.'
                : 'AgriME helps farmers across Tamil Nadu access authentic crop prices, predictive market price forecasts, and essential agricultural services including verified buyers, machinery rentals, and welfare schemes.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/crop-price"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
            >
              <TrendingUp className="w-4 h-4 text-emerald-100" />
              <span>{translations.nav.cropPrices}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/prediction"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 transition-all"
            >
              <span>{translations.nav.predictions}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Seasonal Crops and Their Relevant Price Information */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌾</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isTa ? 'பருவகால பயிர்கள் மற்றும் சந்தை விலைகள்' : 'Seasonal Crops & Mandi Prices'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isTa
                ? 'தமிழ்நாட்டின் நடப்பு பருவ சாகுபடி பயிர்களுக்கான அதிகாரப்பூர்வ மண்டி மாதிரி, குறைந்தபட்ச மற்றும் அதிகபட்ச விலைகள்.'
                : 'Current seasonal crop rates, modal benchmarks, and price ranges recorded across Tamil Nadu APMC mandis.'}
            </p>
          </div>

          {/* Quick Season Classification Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedSeason('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSeason === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {isTa ? 'அனைத்து பயிர்களும்' : 'All Seasonal Crops'} ({seasonalCrops.length})
            </button>
            <button
              onClick={() => setSelectedSeason('rabi_samba')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSeason === 'rabi_samba'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {isTa ? 'சம்பா / ரபி' : 'Samba / Rabi'}
            </button>
            <button
              onClick={() => setSelectedSeason('kharif_kuruvai')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSeason === 'kharif_kuruvai'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {isTa ? 'குறுவை / காரீப்' : 'Kuruvai / Kharif'}
            </button>
            <button
              onClick={() => setSelectedSeason('horticultural')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSeason === 'horticultural'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {isTa ? 'காய்கறி / வணிகம்' : 'Horticultural'}
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-5 bg-slate-200 rounded-full w-20"></div>
                </div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedSeasonalCrops.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">
              {isTa ? 'தேர்ந்தெடுக்கப்பட்ட பருவத்திற்கான பயிர்கள் எதுவும் இல்லை' : 'No seasonal crop records found for the selected season.'}
            </p>
          </div>
        ) : (
          /* Seasonal Crop Price Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedSeasonalCrops.map((item) => {
              const cropName = item.crop?.name || 'Crop';
              const modalRate = item.modal_price || item.price;
              const minRate = item.min_price || Math.round(Number(item.price) * 0.96);
              const maxRate = item.max_price || Math.round(Number(item.price) * 1.04);
              const unit = item.unit || '₹/Quintal';
              const obsDate = item.arrival_date || item.recorded_at?.split('T')[0] || 'Recorded';
              const isLive = item.source_status === 'LIVE';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Crop Name, Icon & Seasonal Classification */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{item.crop?.icon || '🌾'}</span>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-base leading-snug truncate">
                            {translateCrop(cropName)}
                          </h3>
                          {item.variety && (
                            <span className="text-[11px] font-semibold text-slate-500 block truncate">
                              {item.variety}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Season Tag */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${item.seasonMeta.seasonBadgeColor}`}
                        title={`${item.seasonMeta.seasonNameEn} (${item.seasonMeta.seasonMonths})`}
                      >
                        {isTa ? item.seasonMeta.seasonNameTa : item.seasonMeta.seasonNameEn}
                      </span>
                    </div>

                    {/* Price Rate Box */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                          {isTa ? 'நடப்பு / சமீபத்திய விலை:' : 'Current / Latest Rate:'}
                        </span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-slate-900">
                            ₹{Number(item.price).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-bold text-slate-500 ml-1">
                            /{unit.includes('/') ? unit.split('/')[1] : unit}
                          </span>
                        </div>
                      </div>

                      {/* Modal, Min & Max Range Breakdown */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/80 text-center text-xs">
                        <div className="bg-white/80 rounded-lg py-1.5 px-1 border border-slate-200/60">
                          <span className="text-[10px] font-medium text-slate-500 block">
                            {isTa ? 'குறைந்தபட்சம்' : 'Min'}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            ₹{Number(minRate).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="bg-white/80 rounded-lg py-1.5 px-1 border border-emerald-200/80 text-emerald-800">
                          <span className="text-[10px] font-bold text-emerald-700 block">
                            {isTa ? 'மாதிரி (Modal)' : 'Modal'}
                          </span>
                          <span className="font-extrabold text-emerald-900 text-xs">
                            ₹{Number(modalRate).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="bg-white/80 rounded-lg py-1.5 px-1 border border-slate-200/60">
                          <span className="text-[10px] font-medium text-slate-500 block">
                            {isTa ? 'அதிகபட்சம்' : 'Max'}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            ₹{Number(maxRate).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Market Location and Observation Date (Clearly Distinguishing Live vs Historical) */}
                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{item.market?.name || 'Tamil Nadu APMC Mandi'}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
                        <div className="flex items-center gap-1 text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {isTa ? 'பதிவு தேதி:' : 'Observed Date:'} <strong className="text-slate-700">{obsDate}</strong>
                          </span>
                        </div>

                        {/* Distinction badge: Live Mandi Arrival vs Recorded APMC Benchmark */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isLive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isLive
                            ? (isTa ? 'நேரலை சந்தை' : 'Live Mandi Price')
                            : (isTa ? 'பதிவான மண்டி விலை' : 'Recorded APMC Rate')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/crop-price?crop=${item.crop_id}`}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>{isTa ? 'மண்டி விலை ஒப்பீடு' : 'View Mandi Rate'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.unit || '₹/Q'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
