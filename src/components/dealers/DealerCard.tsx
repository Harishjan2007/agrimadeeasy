'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Store, 
  MapPin, 
  Phone, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Navigation,
  Scale,
  Package
} from 'lucide-react';
import { Dealer, DealerCropPrice } from '@/types';
import { useLanguage } from '@/i18n';
import { getGoogleMapsUrl, formatDistance } from '@/lib/location';

interface DealerCardProps {
  dealer: Dealer;
  cropPrices?: DealerCropPrice[];
  selectedCropId?: string;
  mandiBenchmarkPrice?: number | null;
  mandiName?: string;
  distanceKm?: number | null;
  onDemoContactClick?: (dealer: Dealer) => void;
}

export default function DealerCard({ 
  dealer, 
  cropPrices = [],
  selectedCropId,
  mandiBenchmarkPrice,
  mandiName,
  distanceKm,
  onDemoContactClick
}: DealerCardProps) {
  const { language, translations, translateCrop } = useLanguage();
  const isTa = language === 'ta';

  const activePrices = (dealer.crop_prices || cropPrices).filter((cp) => cp.active);

  // Find if dealer buys the specifically filtered crop
  const filteredCropPrice = selectedCropId && selectedCropId !== 'all'
    ? activePrices.find((cp) => cp.crop_id === selectedCropId)
    : null;

  const benchmarkDiff = filteredCropPrice && mandiBenchmarkPrice && mandiBenchmarkPrice > 0
    ? Number(filteredCropPrice.buying_price) - mandiBenchmarkPrice
    : null;

  const mapUrl = getGoogleMapsUrl(
    dealer.latitude,
    dealer.longitude,
    dealer.address ? `${dealer.shop_name}, ${dealer.address}${dealer.district ? `, ${dealer.district}` : ''}` : dealer.shop_name
  );

  return (
    <div className={`bg-white rounded-2xl p-6 border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group ${
      dealer.isDemo 
        ? 'border-amber-200/90 hover:border-amber-400' 
        : 'border-slate-200 hover:border-emerald-400'
    }`}>
      <div>
        {/* Header: Shop Name, Badges & Distance */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
              dealer.isDemo
                ? 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-300 text-amber-800'
                : 'bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-300 text-emerald-800'
            }`}>
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-800 transition-colors">
                  {dealer.shop_name}
                </h3>
              </div>
              
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {dealer.isDemo ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>{translations.dealers.demoDealerBadge}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{translations.dealers.directBuyerBadge}</span>
                  </span>
                )}

                {dealer.buyer_type && (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {dealer.buyer_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Distance Indicator */}
          {distanceKm !== undefined && (
            <div className="shrink-0 text-right">
              {distanceKm !== null ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                  <Navigation className="w-3 h-3 text-emerald-600" />
                  <span>{formatDistance(distanceKm, isTa)}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{isTa ? 'தூரம் தெரியவில்லை' : 'Distance unknown'}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Demo Notice Banner for Fictional Profile */}
        {dealer.isDemo && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{translations.dealers.demoNotice}</span>
          </div>
        )}

        {/* Contact Info & Location */}
        <div className="space-y-2 text-xs text-slate-600 my-4 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-slate-700 font-medium">{dealer.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900">{dealer.phone}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500">{dealer.opening_hours}</span>
          </div>
        </div>

        {/* Benchmark Highlight Banner (When crop is actively filtered) */}
        {filteredCropPrice && (
          <div className="mb-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
              <span className="flex items-center gap-1.5">
                <span>{filteredCropPrice.crop?.icon || '🌾'}</span>
                <span>{translateCrop(filteredCropPrice.crop?.name)} Offered Quote:</span>
              </span>
              <span className="text-base font-black text-amber-950">
                ₹{Number(filteredCropPrice.buying_price).toLocaleString('en-IN')}{' '}
                <span className="text-[10px] font-normal text-slate-600">/Q</span>
              </span>
            </div>

            {/* Quantity constraints */}
            {(filteredCropPrice.min_quantity || filteredCropPrice.max_capacity) && (
              <div className="flex items-center gap-3 text-[11px] text-slate-700 my-1.5 py-1 border-t border-b border-amber-200/60">
                {filteredCropPrice.min_quantity && (
                  <span className="flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-700" />
                    <span className="font-semibold">{translations.dealers.minQuantity}:</span> {filteredCropPrice.min_quantity} Q
                  </span>
                )}
                {filteredCropPrice.max_capacity && (
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-amber-700" />
                    <span className="font-semibold">{translations.dealers.maxCapacity}:</span> {filteredCropPrice.max_capacity.toLocaleString('en-IN')} Q
                  </span>
                )}
              </div>
            )}

            {/* Grading / Payment Terms */}
            {(filteredCropPrice.grading_terms || filteredCropPrice.payment_terms) && (
              <p className="text-[10px] text-slate-600 mb-1.5 italic">
                {filteredCropPrice.grading_terms || filteredCropPrice.payment_terms}
              </p>
            )}
            
            {benchmarkDiff !== null && (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-amber-200/60">
                <span className="text-slate-600 truncate">
                  Mandi ({mandiName || 'APMC'}): ₹{mandiBenchmarkPrice?.toLocaleString('en-IN')}
                </span>
                <span className={`font-bold flex items-center gap-1 ${
                  benchmarkDiff > 0 ? 'text-emerald-700' : benchmarkDiff < 0 ? 'text-amber-800' : 'text-blue-700'
                }`}>
                  {benchmarkDiff > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      <span>+₹{benchmarkDiff} {translations.dealers.aboveBenchmark}</span>
                    </>
                  ) : benchmarkDiff < 0 ? (
                    <>
                      <TrendingDown className="w-3 h-3" />
                      <span>-₹{Math.abs(benchmarkDiff)} {translations.dealers.belowBenchmark}</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-3 h-3" />
                      <span>{translations.dealers.matchesBenchmark}</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* General Purchase Conditions */}
        {dealer.purchase_conditions && (
          <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3">
            <span className="font-bold text-slate-700">{isTa ? 'நிபந்தனைகள்: ' : 'Terms: '}</span>
            <span>{dealer.purchase_conditions}</span>
          </div>
        )}

        {/* Crops They Buy & Buying Prices */}
        <div className="mt-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>{translations.dealers.cropsWeBuy}:</span>
          </h4>

          {activePrices.length > 0 ? (
            <div className="space-y-1.5">
              {activePrices.map((cp) => {
                const isSelected = selectedCropId && selectedCropId !== 'all' && cp.crop_id === selectedCropId;
                return (
                  <div
                    key={cp.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      isSelected 
                        ? 'bg-amber-100/90 border-2 border-amber-500 font-bold shadow-2xs'
                        : 'bg-slate-50 border border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium text-slate-900">
                      <span>{cp.crop?.icon || '🌾'}</span>
                      <span>{translateCrop(cp.crop?.name)}</span>
                      {cp.min_quantity && (
                        <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">
                          (Min: {cp.min_quantity}Q)
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900">
                      ₹{Number(cp.buying_price).toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-slate-500">
                        {isTa ? '₹/குவிண்டால்' : cp.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {isTa ? 'தினசரி கொள்முதல் விலைக்கு கடை உரிமையாளரை நேரடியாக அழைக்கவும்.' : 'Call merchant directly for daily custom buying quotes.'}
            </p>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {dealer.isDemo ? (
            <button
              type="button"
              onClick={() => onDemoContactClick?.(dealer)}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl border border-amber-300 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-amber-700" />
              <span>{translations.dealers.contactDealer} (Demo)</span>
            </button>
          ) : (
            <a
              href={`tel:${dealer.phone.replace(/\s+/g, '')}`}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>{translations.dealers.contactDealer}</span>
            </a>
          )}

          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-slate-700 hover:text-agri-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
              title={isTa ? 'கூகுள் வரைபடத்தில் பார்க்க (Google Maps)' : 'Open in Google Maps'}
            >
              <MapPin className="w-3.5 h-3.5 text-agri-600" />
              <span className="hidden sm:inline">{translations.map?.viewOnMap || 'Map'}</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-200 opacity-60 cursor-not-allowed flex items-center gap-1"
              title={isTa ? 'இட விவரங்கள் கிடைக்கவில்லை' : 'Location unavailable'}
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{translations.map?.viewOnMap || 'Map'}</span>
            </button>
          )}
        </div>

        <Link
          href={`/dealers/${dealer.id}`}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1 font-bold ml-auto"
        >
          <span>{translations.dealers.viewDealer}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
