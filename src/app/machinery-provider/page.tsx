'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Tractor,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Navigation,
  Play,
  Check,
  AlertCircle,
  Plus,
  RefreshCw,
  Activity,
  Layers,
  Calendar
} from 'lucide-react';
import { useAgri } from '@/context/AgriContext';
import { useAuth } from '@/lib/supabase/useAuth';
import { useLanguage } from '@/i18n';
import { BookingStatus, MachineryBooking, Machinery, MachineryType } from '@/types';
import { getMachineryImageUrl, getMachineryAltText } from '@/lib/machinery-images';
import { saveMachineryLocation } from '@/lib/supabase/machinery';
import { PageHeader } from '@/components/ui';

export default function MachineryProviderPortalPage() {
  const { user, role, loading, isConfigured } = useAuth();
  const {
    currentUser,
    userRole,
    switchRole,
    machinery,
    bookings,
    updateBookingStatus,
    updateMachineryLocation,
    getMachineryLocation,
    toggleMachineryAvailability,
    addMachinery
  } = useAgri();

  const { language, translations, translateMachineryType, translateBookingStatus, translateRole } = useLanguage();
  const isTa = language === 'ta';

  // Active tracking watchers stored per bookingId
  const watchIdsRef = useRef<Record<string, number>>({});
  const [activeTrackingBookingIds, setActiveTrackingBookingIds] = useState<string[]>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter tabs for bookings
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('active');

  // Add Machinery modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineType, setNewMachineType] = useState<MachineryType>('Tractor');
  const [newMachinePrice, setNewMachinePrice] = useState(750);
  const [newMachineLocation, setNewMachineLocation] = useState('Vellore');
  const [newMachineDesc, setNewMachineDesc] = useState('');

  // Clean up GPS watchers on unmount
  useEffect(() => {
    return () => {
      Object.values(watchIdsRef.current).forEach((watchId) => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchId);
        }
      });
    };
  }, []);

  // Filter provider bookings (for this provider or mock provider)
  const providerBookings = bookings.filter((b) => {
    // If signed in, match provider_id or machine's provider_id
    return true; // Shows all fleet bookings in demo/current context
  });

  const pendingBookings = providerBookings.filter((b) => b.status === 'pending');
  const activeBookings = providerBookings.filter((b) =>
    ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)
  );
  const completedBookings = providerBookings.filter((b) => b.status === 'completed');

  const displayedBookings = providerBookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'pending') return b.status === 'pending';
    if (bookingFilter === 'active') return ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status);
    if (bookingFilter === 'completed') return b.status === 'completed';
    return true;
  });

  // Start Trip: Initiate Real Geolocation Tracking
  const handleStartTrip = (bookingId: string) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError(translations.providerPortal.gpsError || 'Geolocation not supported on this device.');
      return;
    }

    setGpsError(null);
    setActionLoadingId(bookingId);

    // Initial position fetch
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading, accuracy } = pos.coords;

        // 1. Update state machine: accepted -> on_the_way
        updateBookingStatus(bookingId, 'on_the_way');

        // 2. Broadcast to Context
        updateMachineryLocation(bookingId, {
          booking_id: bookingId,
          provider_id: currentUser.id,
          latitude,
          longitude,
          speed: speed != null ? Math.round(speed * 3.6) : null, // convert m/s to km/h
          heading,
          accuracy,
          recorded_at: new Date().toISOString()
        });

        // 3. Save to Supabase machinery_tracking
        try {
          await saveMachineryLocation({
            booking_id: bookingId,
            provider_id: currentUser.id,
            latitude,
            longitude,
            speed: speed != null ? Math.round(speed * 3.6) : null,
            heading,
            accuracy,
            recorded_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Could not sync tracking to Supabase:', e);
        }

        // 4. Start persistent watchPosition
        const watchId = navigator.geolocation.watchPosition(
          async (watchPos) => {
            const wCoords = watchPos.coords;
            updateMachineryLocation(bookingId, {
              booking_id: bookingId,
              provider_id: currentUser.id,
              latitude: wCoords.latitude,
              longitude: wCoords.longitude,
              speed: wCoords.speed != null ? Math.round(wCoords.speed * 3.6) : null,
              heading: wCoords.heading,
              accuracy: wCoords.accuracy,
              recorded_at: new Date().toISOString()
            });

            try {
              await saveMachineryLocation({
                booking_id: bookingId,
                provider_id: currentUser.id,
                latitude: wCoords.latitude,
                longitude: wCoords.longitude,
                speed: wCoords.speed != null ? Math.round(wCoords.speed * 3.6) : null,
                heading: wCoords.heading,
                accuracy: wCoords.accuracy,
                recorded_at: new Date().toISOString()
              });
            } catch (e) {}
          },
          (err) => {
            console.warn('GPS watch error:', err.message);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );

        watchIdsRef.current[bookingId] = watchId;
        setActiveTrackingBookingIds((prev) => [...prev, bookingId]);
        setActionLoadingId(null);
      },
      (err) => {
        console.error('Geolocation failed:', err.message);
        setGpsError(err.message || 'GPS access denied.');
        setActionLoadingId(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Stop tracking helper
  const stopTrackingForBooking = (bookingId: string) => {
    const watchId = watchIdsRef.current[bookingId];
    if (watchId != null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      delete watchIdsRef.current[bookingId];
      setActiveTrackingBookingIds((prev) => prev.filter((id) => id !== bookingId));
    }
  };

  // State Transition Handlers
  const handleAccept = (bookingId: string) => {
    updateBookingStatus(bookingId, 'accepted');
  };

  const handleReject = (bookingId: string) => {
    if (confirm(isTa ? 'இந்த முன்பதிவை நிராகரிக்க விரும்புகிறீர்களா?' : 'Are you sure you want to reject this booking?')) {
      updateBookingStatus(bookingId, 'rejected');
    }
  };

  const handleMarkArrived = (bookingId: string) => {
    updateBookingStatus(bookingId, 'arrived');
  };

  const handleStartWork = (bookingId: string) => {
    updateBookingStatus(bookingId, 'in_progress');
  };

  const handleCompleteWork = (bookingId: string) => {
    stopTrackingForBooking(bookingId);
    updateBookingStatus(bookingId, 'completed');
  };

  // Add Machine Submit
  const handleAddMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineName.trim()) return;

    addMachinery({
      provider_id: currentUser.id,
      name: newMachineName.trim(),
      type: newMachineType,
      description: newMachineDesc.trim() || 'Equipped for farm plowing and harvesting.',
      price_per_hour: Number(newMachinePrice) || 600,
      location: newMachineLocation.trim() || 'Vellore',
      available: true,
      latitude: 12.9165,
      longitude: 79.1325
    });

    setNewMachineName('');
    setNewMachineDesc('');
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 mt-4">{translations.common.loading}</p>
      </div>
    );
  }

  // 1. Signed-Out Protection Guard
  if (isConfigured && !user) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
            <Tractor className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full mb-2">
              {isTa ? 'இயந்திர உரிமையாளர் அங்கீகாரம்' : 'Machinery Host Authentication'}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">{translations.auth.loginRequiredTitle}</h1>
            <p className="text-xs text-slate-500 mt-2">
              {isTa
                ? 'டிராக்டர்களைப் பட்டியலிட மற்றும் முன்பதிவுகளை நிர்வகிக்க உங்கள் இயந்திர உரிமையாளர் கணக்கில் உள்நுழையவும்.'
                : 'Please sign in with your registered Machinery Provider account to list tractors, manage fleet tariffs, and review farmer bookings.'}
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

  // 2. Role Restriction Guard with friendly switcher
  if (isConfigured && user && role !== 'machinery_provider' && userRole !== 'machinery_provider') {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full mb-2">
              {isTa ? 'அணுகல் கட்டுப்படுத்தப்பட்டது' : 'Access Restricted'}
            </span>
            <h1 className="text-xl font-extrabold text-slate-900">
              {isTa ? 'இயந்திர உரிமையாளர் பாத்திரம் தேவை' : 'Machinery Provider Role Required'}
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              {isTa
                ? `உங்கள் கணக்கு பாத்திரம் ${translateRole(role || 'farmer')}. இயந்திர போர்ட்டல் பதிவு செய்யப்பட்ட விவசாய இயந்திர உரிமையாளர்களுக்கு மட்டுமே.`
                : `Your active account role is ${translateRole(role || 'farmer')}. The Machinery Provider Portal is strictly reserved for tractor and heavy equipment rental owners.`}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => switchRole('machinery_provider')}
              className="btn-primary w-full py-2.5 text-center text-sm font-bold"
            >
              {isTa ? 'இயந்திர உரிமையாளராக தொடரவும்' : 'Switch Role to Machinery Provider'}
            </button>
            <Link href="/" className="btn-secondary w-full py-2.5 text-center text-sm font-semibold">
              {isTa ? 'முகப்புக்குச் செல்' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Modern Page Header */}
      <PageHeader
        title={translations.providerPortal.title}
        subtitle={translations.providerPortal.subtitle}
        badge={translations.providerPortal.welcomeBadge}
        icon={Tractor}
        iconColor="text-blue-700"
        iconBg="bg-blue-50 border-blue-200"
        backHref="/"
        backLabel={isTa ? 'முகப்புக்குச் செல்' : 'Back to Home'}
        stats={[
          { label: translations.providerPortal.fleetManagement, value: machinery.length },
          { label: translations.providerPortal.pendingRequests, value: pendingBookings.length },
          { label: translations.providerPortal.activeJobs, value: activeBookings.length }
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/map?category=machinery"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-agri-600" />
              <span>{isTa ? 'வரைபடத்தில் பார்க்க' : 'View on Map'}</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{translations.providerPortal.addMachineryBtn}</span>
            </button>
          </div>
        }
      />

      {/* GPS Warning Banner if any */}
      {gpsError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span><strong>{translations.providerPortal.gpsError}:</strong> {gpsError}</span>
            </div>
            <button
              onClick={() => setGpsError(null)}
              className="text-rose-500 hover:text-rose-800 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bookings Operations (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {translations.providerPortal.bookingRequests}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTa
                  ? 'விவசாயிகளின் இயந்திர முன்பதிவுகளை நிர்வகிக்கவும் மற்றும் நேரடி ஜிபிஎஸ் பயணங்களைத் தொடங்கவும்.'
                  : 'Manage farmer bookings, accept rentals, and broadcast live transit GPS.'}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'active', label: `${translations.providerPortal.activeJobs} (${activeBookings.length})` },
                { id: 'pending', label: `${translations.providerPortal.pendingRequests} (${pendingBookings.length})` },
                { id: 'completed', label: `${translations.providerPortal.complete} (${completedBookings.length})` },
                { id: 'all', label: `${translations.providerPortal.allBookings} (${providerBookings.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBookingFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    bookingFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          {displayedBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs">
              <Tractor className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">
                {isTa ? 'முன்பதிவுகள் எதுவும் இல்லை' : 'No Bookings in this Category'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isTa
                  ? 'விவசாயிகள் உங்கள் இயந்திரங்களை முன்பதிவு செய்யும் போது அவை இங்கே தோன்றும்.'
                  : 'Incoming rental bookings from farmers will appear here for your review and GPS dispatch.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedBookings.map((booking: MachineryBooking) => {
                const machine = booking.machinery || machinery.find((m) => m.id === booking.machinery_id) || machinery[0];
                const tracking = getMachineryLocation(booking.id);
                const isTrackingActive = activeTrackingBookingIds.includes(booking.id) || booking.status === 'on_the_way';
                const isLoading = actionLoadingId === booking.id;

                return (
                  <div
                    key={booking.id}
                    className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                      booking.status === 'on_the_way'
                        ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20'
                        : booking.status === 'pending'
                        ? 'border-blue-300'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left: Machine & Farmer details */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          <img
                            src={getMachineryImageUrl(machine)}
                            alt={getMachineryAltText(machine)}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-sm">
                              {machine?.name}
                            </h3>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {translateMachineryType(machine?.type || 'Tractor')}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              {booking.booking_date} ({booking.start_time} - {booking.end_time})
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {machine?.location}
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 pt-1 flex items-center gap-2">
                            <span>
                              {isTa ? 'விவசாயி' : 'Farmer'}: <strong>{booking.farmer?.name || 'Murugan R.'}</strong>
                            </span>
                            {booking.farmer?.phone && (
                              <a
                                href={`tel:${booking.farmer.phone}`}
                                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold ml-2"
                              >
                                <Phone className="w-3 h-3" />
                                {booking.farmer.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Status Badge */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {translations.booking.totalAmount}
                          </span>
                          <span className="text-lg font-black text-slate-900">
                            ₹{booking.total_amount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            booking.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : booking.status === 'accepted'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : booking.status === 'on_the_way'
                              ? 'bg-amber-500 text-white animate-pulse'
                              : booking.status === 'arrived'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : booking.status === 'in_progress'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : booking.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {translateBookingStatus(booking.status)}
                        </span>
                      </div>
                    </div>

                    {/* Active GPS Broadcasting Indicator */}
                    {isTrackingActive && tracking && (
                      <div className="mt-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-amber-900">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                          </span>
                          <span className="font-bold">
                            {translations.providerPortal.gpsActive || 'Broadcasting Live GPS'}:
                          </span>
                          <span className="text-slate-600">
                            Lat {tracking.latitude.toFixed(4)}, Lon {tracking.longitude.toFixed(4)}
                            {tracking.speed != null ? ` • ${tracking.speed} km/h` : ''}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(tracking.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {/* Action Bar (State Machine Transition Buttons) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                      {/* State: Pending -> [Accept] / [Reject] */}
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReject(booking.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                          >
                            {translations.providerPortal.rejectBooking}
                          </button>
                          <button
                            onClick={() => handleAccept(booking.id)}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                          >
                            {translations.providerPortal.acceptBooking}
                          </button>
                        </>
                      )}

                      {/* State: Accepted -> [Start Trip] (Trigger Live GPS) */}
                      {booking.status === 'accepted' && (
                        <button
                          onClick={() => handleStartTrip(booking.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
                        >
                          <Navigation className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>
                            {isLoading
                              ? (isTa ? 'ஜிபிஎஸ் தொடங்குகிறது...' : 'Starting GPS...')
                              : translations.providerPortal.startTrip}
                          </span>
                        </button>
                      )}

                      {/* State: On The Way -> [Mark Arrived] */}
                      {booking.status === 'on_the_way' && (
                        <button
                          onClick={() => handleMarkArrived(booking.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{translations.providerPortal.markArrived}</span>
                        </button>
                      )}

                      {/* State: Arrived -> [Start Work] */}
                      {booking.status === 'arrived' && (
                        <button
                          onClick={() => handleStartWork(booking.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{translations.providerPortal.startWork}</span>
                        </button>
                      )}

                      {/* State: In Progress -> [Complete Work] */}
                      {booking.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteWork(booking.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{translations.providerPortal.complete}</span>
                        </button>
                      )}

                      {/* Completed indicator */}
                      {booking.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isTa ? 'பணி வெற்றிகரமாக முடிந்தது' : 'Job Completed'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Fleet Management & Quick Actions (1 Col on lg) */}
        <div className="space-y-4">
          {/* Fleet Overview Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {translations.providerPortal.fleetManagement}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {machinery.length} {isTa ? 'இயந்திரங்கள் பட்டியலிடப்பட்டுள்ளன' : 'Machines listed'}
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{translations.providerPortal.addNewMachine}</span>
              </button>
            </div>

            {/* Machinery Fleet Cards */}
            <div className="space-y-2.5">
              {machinery.map((m: Machinery) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{m.name}</h4>
                    <p className="text-slate-500 text-[11px]">
                      ₹{m.price_per_hour}/{isTa ? 'மணி' : 'hr'} • {m.location}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleMachineryAvailability(m.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors shrink-0 ${
                      m.available
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    }`}
                  >
                    {m.available ? (isTa ? 'கிடைக்கும்' : 'Available') : (isTa ? 'முன்பதிவு செய்யப்பட்டுள்ளது' : 'Busy')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Provider Portal Feature Highlights */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-100 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{translations.providerPortal.featuresTitle}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              ✓ {translations.providerPortal.feature1}
            </p>
            <p className="text-slate-600 leading-relaxed">
              ✓ {translations.providerPortal.feature2}
            </p>
            <p className="text-slate-600 leading-relaxed">
              ✓ {translations.providerPortal.feature3}
            </p>
          </div>
        </div>
      </div>

      {/* Add Machinery Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {translations.providerPortal.addNewMachine}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMachine} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'இயந்திரத்தின் பெயர்' : 'Machine Name & Model'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mahindra 575 DI 45HP Tractor"
                  value={newMachineName}
                  onChange={(e) => setNewMachineName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {translations.providerPortal.equipmentType || 'Type'}
                  </label>
                  <select
                    value={newMachineType}
                    onChange={(e) => setNewMachineType(e.target.value as MachineryType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="Tractor">Tractor</option>
                    <option value="Paddy Harvester">Paddy Harvester</option>
                    <option value="Power Tiller">Power Tiller</option>
                    <option value="Rotavator">Rotavator</option>
                    <option value="Sprayer">Sprayer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {translations.providerPortal.hourlyRate} (₹/hr)
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={newMachinePrice}
                    onChange={(e) => setNewMachinePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'இடம் / தாலுகா' : 'Base Location (Town / Taluk)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Katpadi, Vellore"
                  value={newMachineLocation}
                  onChange={(e) => setNewMachineLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'விளக்கம்' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  placeholder="Specification, attachments, horsepower..."
                  value={newMachineDesc}
                  onChange={(e) => setNewMachineDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  {translations.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  {translations.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
