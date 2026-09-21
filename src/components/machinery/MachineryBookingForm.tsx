'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Tractor
} from 'lucide-react';
import { Machinery } from '@/types';
import { useLanguage } from '@/i18n';
import { useAgri } from '@/context/AgriContext';
import { useAuth } from '@/lib/supabase/useAuth';
import { createMachineryBooking } from '@/lib/supabase/machinery';

interface MachineryBookingFormProps {
  machinery: Machinery;
  onClose: () => void;
  onSuccess?: () => void;
  onBook?: (data: {
    machineryId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
  }) => void;
}

export default function MachineryBookingForm({
  machinery,
  onClose,
  onSuccess,
  onBook
}: MachineryBookingFormProps) {
  const { language, translations } = useLanguage();
  const { bookMachinery } = useAgri();
  const { user } = useAuth();
  const isTa = language === 'ta';

  // Tomorrow as default date in YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [bookingDate, setBookingDate] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate duration in hours
  const { durationHours, totalAmount, isValid } = useMemo(() => {
    if (!startTime || !endTime) {
      return { durationHours: 0, totalAmount: 0, isValid: false };
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const diffMinutes = endMinutes - startMinutes;
    if (diffMinutes <= 0) {
      return { durationHours: 0, totalAmount: 0, isValid: false };
    }

    const hours = diffMinutes / 60;
    const total = Math.round(hours * machinery.price_per_hour);

    return {
      durationHours: hours,
      totalAmount: total,
      isValid: true
    };
  }, [startTime, endTime, machinery.price_per_hour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!bookingDate) {
      setErrorMessage(isTa ? 'தயவுசெய்து சரியான முன்பதிவு தேதியைத் தேர்ந்தெடுக்கவும்.' : 'Please select a valid booking date.');
      return;
    }

    if (!isValid || durationHours <= 0) {
      setErrorMessage(isTa ? 'முடிவு நேரம் தொடக்க நேரத்தை விட அதிகமாக இருக்க வேண்டும்.' : 'End time must be later than start time (positive duration required).');
      return;
    }

    const payload = {
      machineryId: machinery.id,
      bookingDate,
      startTime,
      endTime,
      totalAmount
    };

    // 1. Persist to AgriContext / localStorage
    bookMachinery(payload);

    // 2. Persist to Supabase if authenticated
    if (user?.id) {
      await createMachineryBooking({
        farmerId: user.id,
        machineryId: machinery.id,
        bookingDate,
        startTime,
        endTime,
        totalAmount
      });
    }

    // 3. Trigger callback if passed
    if (onBook) {
      onBook(payload);
    }

    setSubmitted(true);
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Tractor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {translations.booking.modalTitle}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {machinery.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-900">
              {translations.booking.bookingSubmitted}
            </h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              {isTa 
                ? `${machinery.name} இயந்திரத்திற்கான உங்கள் முன்பதிவு கோரிக்கை (${bookingDate}, ${startTime} - ${endTime}) வெற்றிகரமாகப் பதிவுசெய்யப்பட்டது.`
                : `Your rental request for ${machinery.name} on ${bookingDate} (${startTime} - ${endTime}) has been recorded.`}
            </p>
            <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {isTa ? 'நேரலை நிலையை "என் முன்பதிவுகள்" பக்கத்தில் பார்க்கலாம்' : 'Check "My Bookings" to track live approval status'}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            
            {/* Machinery summary strip */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">{translations.machinery.rentalRate}:</span>
              <span className="font-bold text-slate-900 text-sm">
                ₹{machinery.price_per_hour.toLocaleString('en-IN')}/{isTa ? 'மணிநேரம்' : 'hour'}
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Booking Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-agri-600" />
                <span>{translations.booking.bookingDate}</span>
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
              />
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{translations.booking.startTime}</span>
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{translations.booking.endTime}</span>
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Calculated Breakdown */}
            <div className="bg-agri-50/70 rounded-2xl p-4 border border-agri-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{translations.booking.duration}:</span>
                <span className="font-bold text-slate-900">
                  {isValid ? `${durationHours} ${isTa ? 'மணிநேரம்' : 'hours'}` : (isTa ? 'தவறான நேர இடைவெளி' : 'Invalid time range')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{isTa ? 'கட்டண கணக்கீடு' : 'Rate Computation'}:</span>
                <span>
                  {durationHours} {isTa ? 'மணி' : 'hrs'} × ₹{machinery.price_per_hour}/{isTa ? 'மணி' : 'hr'}
                </span>
              </div>

              <div className="pt-2 border-t border-agri-200/70 flex items-center justify-between">
                <span className="text-xs font-bold text-agri-900">{translations.booking.totalAmount}:</span>
                <span className="text-lg font-black text-agri-800">
                  ₹{isValid ? totalAmount.toLocaleString('en-IN') : '0'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary w-1/2 text-xs py-2.5"
              >
                {translations.common.cancel}
              </button>
              <button
                type="submit"
                disabled={!isValid || durationHours <= 0}
                className="btn-primary w-1/2 text-xs py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{translations.booking.requestBooking}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
