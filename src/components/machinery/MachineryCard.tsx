'use client';

import React from 'react';
import { 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  User, 
  CalendarCheck 
} from 'lucide-react';
import { Machinery } from '@/types';
import { getMachineryImageUrl, getMachineryAltText } from '@/lib/machinery-images';
import { useLanguage } from '@/i18n';

interface MachineryCardProps {
  machinery: Machinery;
  onBook: (machinery: Machinery) => void;
}

export default function MachineryCard({ machinery, onBook }: MachineryCardProps) {
  const { language, translations, translateMachineryType } = useLanguage();
  const isTa = language === 'ta';

  const imageUrl = getMachineryImageUrl(machinery);
  const altText = getMachineryAltText(machinery);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-agri-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Machinery Image */}
        <div className="relative h-48 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt={altText}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Type Badge */}
          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white/95 text-slate-800 border border-slate-200 shadow-xs backdrop-blur-xs">
            {translateMachineryType(machinery.type)}
          </span>

          {/* Availability Badge */}
          <div className="absolute top-3 right-3">
            {machinery.available ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                <CheckCircle2 className="w-3 h-3" />
                {translations.machinery.available}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-white shadow-xs">
                <XCircle className="w-3 h-3 text-rose-400" />
                {translations.machinery.unavailable}
              </span>
            )}
          </div>
        </div>

        {/* Machinery Content */}
        <div className="p-5">
          <h3 className="font-bold text-slate-900 text-base group-hover:text-agri-700 transition-colors line-clamp-1">
            {machinery.name}
          </h3>

          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {machinery.description}
          </p>

          {/* Location & Provider Info */}
          <div className="space-y-1.5 text-xs text-slate-600 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-700 font-medium">{machinery.location}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">
                {translations.machinery.provider}: <strong className="text-slate-800 font-semibold">{machinery.provider?.name || (isTa ? 'உள்ளூர் விவசாயி' : 'Local Farm Provider')}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Rate & Booking Button */}
      <div className="px-5 pb-5 pt-0 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-medium text-slate-400 block">{translations.machinery.rentalRate}</span>
          <div className="text-xl font-black text-slate-900">
            ₹{machinery.price_per_hour.toLocaleString('en-IN')}
            <span className="text-xs font-semibold text-slate-500 ml-0.5">/{isTa ? 'மணிநேரம்' : 'hr'}</span>
          </div>
        </div>

        <button
          onClick={() => onBook(machinery)}
          disabled={!machinery.available}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
            machinery.available
              ? 'btn-primary'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>{machinery.available ? translations.machinery.bookNow : translations.machinery.unavailable}</span>
        </button>
      </div>
    </div>
  );
}
