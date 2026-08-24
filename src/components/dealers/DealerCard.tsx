'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Store, 
  MapPin, 
  Phone, 
  Clock, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Dealer, DealerCropPrice } from '@/types';
import { useLanguage } from '@/i18n';

interface DealerCardProps {
  dealer: Dealer;
  cropPrices?: DealerCropPrice[];
}

export default function DealerCard({ dealer, cropPrices = [] }: DealerCardProps) {
  const { language, translations, translateCrop } = useLanguage();
  const isTa = language === 'ta';

  const activePrices = (dealer.crop_prices || cropPrices).filter((cp) => cp.active);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-agri-300 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Header: Shop Name & Verified Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-agri-700 transition-colors">
                  {dealer.shop_name}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200/60">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {translations.dealers.directBuyerBadge}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info & Location */}
        <div className="space-y-2 text-xs text-slate-600 my-4 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-slate-700">{dealer.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-900">{dealer.phone}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500">{dealer.opening_hours}</span>
          </div>
        </div>

        {/* Crops They Buy & Buying Prices */}
        <div className="mt-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>{translations.dealers.cropsWeBuy}:</span>
          </h4>

          {activePrices.length > 0 ? (
            <div className="space-y-1.5">
              {activePrices.map((cp) => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-agri-50/70 border border-agri-200/80 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-medium text-slate-900">
                    <span>{cp.crop?.icon || '🌾'}</span>
                    <span>{translateCrop(cp.crop?.name)}</span>
                  </div>
                  <div className="font-bold text-agri-800">
                    ₹{Number(cp.buying_price).toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] font-normal text-slate-500">
                      {isTa ? '₹/குவிண்டால்' : cp.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {isTa ? 'தினசரி கொள்முதல் விலைக்கு கடை உரிமையாளரை நேரடியாக அழைக்கவும்.' : 'Call merchant directly for daily custom buying quotes.'}
            </p>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
        <a
          href={`tel:${dealer.phone.replace(/\s+/g, '')}`}
          className="text-xs font-semibold text-slate-600 hover:text-agri-700 flex items-center gap-1"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{translations.dealers.contactDealer}</span>
        </a>

        <Link
          href={`/dealers/${dealer.id}`}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1"
        >
          <span>{translations.dealers.viewDealer}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
