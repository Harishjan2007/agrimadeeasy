'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Store, 
  Tractor, 
  Landmark, 
  ArrowRight, 
  Check, 
  MapPin, 
  Phone 
} from 'lucide-react';
import { MOCK_DEALERS, MOCK_MACHINERY, MOCK_SCHEMES } from '@/lib/mock-data';
import { useLanguage } from '@/i18n';

export default function Recommendations() {
  const topDealer = MOCK_DEALERS[0];
  const topMachinery = MOCK_MACHINERY[0];
  const topScheme = MOCK_SCHEMES[1]; // SMAM Machinery Subsidy
  const { language, translations, translateCrop } = useLanguage();

  const isTa = language === 'ta';

  return (
    <section className="py-14 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-harvest-700 uppercase tracking-wider bg-harvest-100/70 px-3 py-1 rounded-full">
            {translations.home.recommendationsTitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {isTa ? 'இந்த வாரத்திற்கான பரிந்துரைகள்' : 'Recommended For You This Week'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {isTa
              ? 'உயர் கொள்முதல் விலை வழங்கும் வியாபாரிகள், சரிபார்க்கப்பட்ட இயந்திரங்கள் மற்றும் அரசு மானியங்கள்.'
              : 'Top local buyers offering premium prices, verified equipment hosts, and active subsidy schemes.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Verified Buyer Highlight */}
          <div className="agri-card p-6 bg-gradient-to-b from-agri-50/40 to-white border-agri-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-agri-800 bg-agri-100 px-2.5 py-0.5 rounded-full">
                  <Store className="w-3.5 h-3.5" />
                  <span>{isTa ? 'முதன்மை பயிர் வாங்குபவர்' : 'Top Crop Buyer'}</span>
                </span>
                <span className="text-xs font-semibold text-agri-700">
                  {isTa ? 'நெல் & விதைகள் கொள்முதல்' : 'Buying Paddy & Seeds'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {topDealer.shop_name}
              </h3>
              
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{topDealer.address}</span>
              </p>

              <div className="my-4 p-3 bg-white rounded-xl border border-agri-200 shadow-2xs space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">{translateCrop('Paddy')} (Basmati):</span>
                  <span className="font-bold text-agri-700">₹3,520 / {isTa ? 'குவிண்டால்' : 'Quintal'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">{translateCrop('Paddy')} (Common):</span>
                  <span className="font-bold text-agri-700">₹2,420 / {isTa ? 'குவிண்டால்' : 'Quintal'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-agri-600" />
                <span>{topDealer.phone}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                href={`/dealers/${topDealer.id}`}
                className="btn-primary w-full text-xs py-2"
              >
                <span>{translations.dealers.viewDealer}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Featured Machinery Rental */}
          <div className="agri-card p-6 bg-gradient-to-b from-harvest-50/40 to-white border-harvest-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-harvest-800 bg-harvest-100 px-2.5 py-0.5 rounded-full">
                  <Tractor className="w-3.5 h-3.5" />
                  <span>{isTa ? 'முன்பதிவுக்கு தயார்' : 'Ready for Booking'}</span>
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {translations.machinery.available}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {topMachinery.name}
              </h3>

              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{topMachinery.location}</span>
              </p>

              <div className="my-4 p-3 bg-white rounded-xl border border-harvest-200 shadow-2xs flex items-baseline justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  {translations.machinery.rentalRate}:
                </span>
                <div>
                  <span className="text-xl font-black text-harvest-800">₹{topMachinery.price_per_hour}</span>
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    /{isTa ? 'மணிநேரம்' : 'hour'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {topMachinery.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                href="/machinery"
                className="btn-accent w-full text-xs py-2"
              >
                <span>{translations.machinery.bookNow}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Government Scheme Subsidy Highlight */}
          <div className="agri-card p-6 bg-gradient-to-b from-blue-50/40 to-white border-blue-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>{translations.schemes.machinerySubsidy}</span>
                </span>
                <span className="text-xs font-semibold text-blue-700">40% - 50% {isTa ? 'மானியம்' : 'Subsidy'}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {topScheme.name}
              </h3>

              <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                {topScheme.description}
              </p>

              <div className="my-4 p-3 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-agri-600 shrink-0" />
                  <span className="font-medium">{isTa ? 'நேரடி வங்கி பரிவர்த்தனை (DBT)' : 'Direct Bank Account Transfer'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-agri-600 shrink-0" />
                  <span className="font-medium">{isTa ? 'சிறு & குறு விவசாயிகளுக்கு முன்னுரிமை' : 'For Small & Marginal Farmers'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                href="/schemes"
                className="btn-secondary w-full text-xs py-2"
              >
                <span>{translations.schemes.viewDetails}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
