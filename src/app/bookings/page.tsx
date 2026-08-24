'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  ArrowLeft,
  Clock,
  MapPin,
  Tractor,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar
} from 'lucide-react';
import { MOCK_BOOKINGS, MOCK_MACHINERY } from '@/lib/mock-data';
import { BookingStatus, MachineryBooking, Machinery } from '@/types';
import { useAuth } from '@/lib/supabase/useAuth';
import { getMachineryImageUrl, getMachineryAltText } from '@/lib/machinery-images';
import { useLanguage } from '@/i18n';

export default function MyBookingsPage() {
  const { user, role, loading, isConfigured } = useAuth();
  const { language, translations, translateMachineryType, translateBookingStatus, translateRole } = useLanguage();
  const isTa = language === 'ta';

  const [bookings, setBookings] = useState<MachineryBooking[]>(MOCK_BOOKINGS);
  const machinery = MOCK_MACHINERY;
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const cancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b
      )
    );
  };

  const filteredBookings = bookings.filter((b: MachineryBooking) => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-10 h-10 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 mt-4">{translations.common.loading}</p>
      </div>
    );
  }

  // 1. Signed Out Protection
  if (isConfigured && !user) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{translations.auth.loginRequiredTitle}</h1>
            <p className="text-xs text-slate-500 mt-2">
              {translations.auth.loginRequiredDescription}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link href="/login" className="btn-primary w-full py-2.5 text-center text-sm font-bold">
              {translations.auth.loginButton}
            </Link>
            <Link href="/signup" className="btn-secondary w-full py-2.5 text-center text-sm font-semibold">
              {translations.auth.signupTitle}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Role Restriction (Dealer / Provider)
  if (isConfigured && user && role !== 'farmer') {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{translations.myBookings.farmerAccountFeature}</h1>
            <p className="text-xs text-slate-500 mt-2">
              {translations.myBookings.signedInAsRole} <strong className="capitalize text-slate-800">{translateRole(role || 'farmer')}</strong>. {translations.myBookings.farmerFeatureNotice}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {role === 'dealer' && (
              <Link href="/dealer" className="btn-primary w-full py-2.5 text-center text-sm font-bold">
                {translations.nav.dealerPortal}
              </Link>
            )}
            {role === 'machinery_provider' && (
              <Link href="/machinery-provider" className="btn-primary w-full py-2.5 text-center text-sm font-bold">
                {translations.nav.machineryPortal}
              </Link>
            )}
            <Link href="/profile" className="btn-secondary w-full py-2.5 text-center text-sm font-semibold">
              {translations.nav.profile}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="badge-status-pending">
            <Clock className="w-3.5 h-3.5" />
            <span>{translateBookingStatus('pending')}</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="badge-status-accepted">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{translateBookingStatus('accepted')}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="badge-status-rejected">
            <XCircle className="w-3.5 h-3.5" />
            <span>{translateBookingStatus('rejected')}</span>
          </span>
        );
      case 'completed':
        return (
          <span className="badge-status-completed">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{translateBookingStatus('completed')}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge-status-cancelled">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{translateBookingStatus('cancelled')}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/machinery"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-agri-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{translations.myBookings.backToMachinery}</span>
          </Link>

          <Link
            href="/machinery"
            className="btn-primary text-xs py-1.5 px-3"
          >
            {translations.myBookings.rentAnother}
          </Link>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-agri-950 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-agri-500/20 text-agri-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-agri-500/30">
                <CalendarCheck className="w-3.5 h-3.5" />
                {isTa ? 'விவசாயி உபகரண முன்பதிவு நிலை' : 'Farmer Equipment Booking Status'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {translations.myBookings.title}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                {translations.myBookings.subtitle}
              </p>
            </div>

            <div className="text-xs bg-white/10 border border-white/15 rounded-2xl p-4 text-center sm:text-right backdrop-blur-xs">
              <span className="text-slate-300 block">{translations.myBookings.totalBookings}</span>
              <span className="text-2xl font-black text-white">{bookings.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6">
          {[
            { id: 'all', label: `${translations.myBookings.allBookings} (${bookings.length})` },
            { id: 'pending', label: `${translateBookingStatus('pending')} (${bookings.filter((b: MachineryBooking) => b.status === 'pending').length})` },
            { id: 'accepted', label: `${translateBookingStatus('accepted')} (${bookings.filter((b: MachineryBooking) => b.status === 'accepted').length})` },
            { id: 'completed', label: `${translateBookingStatus('completed')} (${bookings.filter((b: MachineryBooking) => b.status === 'completed').length})` },
            { id: 'cancelled', label: `${translateBookingStatus('cancelled')} (${bookings.filter((b: MachineryBooking) => b.status === 'cancelled').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${filterStatus === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <Tractor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">{translations.myBookings.noBookings}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {translations.myBookings.noBookingsDescription}
            </p>
            <Link
              href="/machinery"
              className="mt-4 inline-flex items-center gap-2 btn-primary text-xs py-2 px-4"
            >
              <Tractor className="w-4 h-4" />
              <span>{translations.myBookings.browseMachinery}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking: MachineryBooking) => {
              const machine = booking.machinery || machinery.find((m: Machinery) => m.id === booking.machinery_id) || machinery[0];

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left: Machine & Booking Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 overflow-hidden">
                      <img
                        src={getMachineryImageUrl(machine)}
                        alt={getMachineryAltText(machine)}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-base">
                          {machine?.name}
                        </h3>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {translateMachineryType(machine?.type || 'Farm Equipment')}
                        </span>
                      </div>

                      {/* Booking Date & Times */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-agri-600" />
                          {translations.booking.bookingDate}: {booking.booking_date}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {isTa ? 'நேரம்' : 'Slot'}: {booking.start_time} - {booking.end_time}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {machine?.location}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 pt-1">
                        {isTa ? 'முன்பதிவு எண்' : 'Booking ID'}: <span className="font-mono text-slate-600">{booking.id}</span> • {isTa ? 'பதிவு செய்யப்பட்ட தேதி' : 'Placed on'} {new Date(booking.created_at).toLocaleDateString(isTa ? 'ta-IN' : 'en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Badge, Amount & Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">{translations.booking.totalAmount}</span>
                      <span className="text-xl font-black text-slate-900">
                        ₹{booking.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Cancel action if pending/accepted */}
                    {(booking.status === 'pending' || booking.status === 'accepted') && (
                      <button
                        onClick={() => {
                          if (confirm(isTa ? 'இந்த முன்பதிவு கோரிக்கையை ரத்து செய்ய விரும்புகிறீர்களா?' : 'Are you sure you want to cancel this booking request?')) {
                            cancelBooking(booking.id);
                          }
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2"
                      >
                        {translations.myBookings.cancelBooking}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
