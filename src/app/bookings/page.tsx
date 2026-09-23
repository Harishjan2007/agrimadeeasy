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
  Calendar,
  Navigation
} from 'lucide-react';
import { useAgri } from '@/context/AgriContext';
import { BookingStatus, MachineryBooking, Machinery } from '@/types';
import { useAuth } from '@/lib/supabase/useAuth';
import { getMachineryImageUrl, getMachineryAltText } from '@/lib/machinery-images';
import { useLanguage } from '@/i18n';
import { getMachineryBookings, cancelMachineryBooking } from '@/lib/supabase/machinery';
import MachineryTrackingModal from '@/components/machinery/MachineryTrackingModal';
import { PageHeader, EmptyState, StatusBadge } from '@/components/ui';

export default function MyBookingsPage() {
  const { user, role, loading, isConfigured } = useAuth();
  const { language, translations, translateMachineryType, translateBookingStatus, translateRole } = useLanguage();
  const { bookings: contextBookings, machinery: contextMachinery, cancelBooking: contextCancelBooking } = useAgri();
  const isTa = language === 'ta';

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState<MachineryBooking | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const bookings = contextBookings;
  const machinery = contextMachinery;

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    setCancelError(null);
    try {
      await cancelMachineryBooking(bookingId);
      contextCancelBooking(bookingId);
    } catch (err: any) {
      console.error('Cancel booking error:', err);
      // Still update context so user gets immediate responsive UX
      contextCancelBooking(bookingId);
    } finally {
      setCancellingId(null);
    }
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

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Modern AgriME Page Header */}
      <PageHeader
        title={translations.myBookings.title}
        subtitle={translations.myBookings.subtitle}
        badge={isTa ? 'இயந்திர முன்பதிவு மையம்' : 'Machinery Booking Center'}
        icon={CalendarCheck}
        iconColor="text-agri-700"
        iconBg="bg-agri-50 border-agri-200"
        backHref="/machinery"
        backLabel={translations.myBookings.backToMachinery}
        stats={[
          { label: isTa ? 'மொத்த முன்பதிவுகள்' : 'Total Bookings', value: bookings.length },
          { label: isTa ? 'செயலில் உள்ளவை' : 'Active', value: bookings.filter((b: MachineryBooking) => ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)).length },
          { label: isTa ? 'நிறைவடைந்தவை' : 'Completed', value: bookings.filter((b: MachineryBooking) => b.status === 'completed').length }
        ]}
        actions={
          <Link
            href="/machinery"
            className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 shadow-xs"
          >
            <Tractor className="w-4 h-4" />
            <span>{translations.myBookings.rentAnother}</span>
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {[
            { id: 'all', label: `${translations.myBookings.allBookings} (${bookings.length})` },
            { id: 'pending', label: `${translateBookingStatus('pending')} (${bookings.filter((b: MachineryBooking) => b.status === 'pending').length})` },
            { id: 'accepted', label: `${translateBookingStatus('accepted')} (${bookings.filter((b: MachineryBooking) => b.status === 'accepted').length})` },
            { id: 'on_the_way', label: `${translateBookingStatus('on_the_way')} (${bookings.filter((b: MachineryBooking) => b.status === 'on_the_way').length})` },
            { id: 'arrived', label: `${translateBookingStatus('arrived')} (${bookings.filter((b: MachineryBooking) => b.status === 'arrived').length})` },
            { id: 'in_progress', label: `${translateBookingStatus('in_progress')} (${bookings.filter((b: MachineryBooking) => b.status === 'in_progress').length})` },
            { id: 'completed', label: `${translateBookingStatus('completed')} (${bookings.filter((b: MachineryBooking) => b.status === 'completed').length})` },
            { id: 'cancelled', label: `${translateBookingStatus('cancelled')} (${bookings.filter((b: MachineryBooking) => b.status === 'cancelled').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-2xs ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <EmptyState
            title={translations.myBookings.noBookings}
            description={translations.myBookings.noBookingsDescription}
            actionLabel={translations.myBookings.browseMachinery}
            actionHref="/machinery"
          />
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
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div>
                      <StatusBadge status={booking.status} size="sm" />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">{translations.booking.totalAmount}</span>
                      <span className="text-xl font-black text-slate-900">
                        ₹{booking.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Live Track Machinery Button for active statuses */}
                    {['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(booking.status) && (
                      <button
                        onClick={() => {
                          setSelectedTrackingBooking(booking);
                          setIsTrackingModalOpen(true);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          booking.status === 'on_the_way'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5 text-amber-300" />
                        <span>{translations.tracking.trackMachinery || (isTa ? 'கண்காணிக்கவும்' : 'Track Machinery')}</span>
                      </button>
                    )}

                    {/* Cancel action if pending/accepted */}
                    {(booking.status === 'pending' || booking.status === 'accepted') && (
                      <button
                        onClick={() => {
                          if (confirm(isTa ? 'இந்த முன்பதிவு கோரிக்கையை ரத்து செய்ய விரும்புகிறீர்களா?' : 'Are you sure you want to cancel this booking request?')) {
                            handleCancel(booking.id);
                          }
                        }}
                        disabled={cancellingId === booking.id}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2 disabled:opacity-50"
                      >
                        {cancellingId === booking.id
                          ? (isTa ? 'ரத்து செய்யப்படுகிறது...' : 'Cancelling...')
                          : translations.myBookings.cancelBooking}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Machinery Tracking Modal */}
        <MachineryTrackingModal
          booking={selectedTrackingBooking}
          isOpen={isTrackingModalOpen}
          onClose={() => {
            setIsTrackingModalOpen(false);
            setSelectedTrackingBooking(null);
          }}
        />
      </div>
    </div>
  );
}
