'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  Calendar,
  Edit3,
  Wrench,
  Settings,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useAgri } from '@/context/AgriContext';
import { useAuth } from '@/lib/supabase/useAuth';
import { useLanguage } from '@/i18n';
import { BookingStatus, MachineryBooking, Machinery, MachineryType, Profile } from '@/types';
import { getMachineryImageUrl, getMachineryAltText } from '@/lib/machinery-images';
import { saveMachineryLocation, updateMachineryRecord, updateProviderProfile } from '@/lib/supabase/machinery';
import { PageHeader } from '@/components/ui';
import { getGoogleMapsUrl } from '@/lib/location';
import LocationPicker from '@/components/common/LocationPicker';
import { INDIAN_STATES_AND_UTS, getDistrictsForState } from '@/lib/indian-geography';

function MachineryProviderPortalContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams ? searchParams.get('filter') : null;
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
    addMachinery,
    updateMachinery,
    updateCurrentUser
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

  // Synchronize filter query parameter from navigation (e.g. ?filter=pending or ?filter=completed)
  useEffect(() => {
    if (filterParam === 'pending') {
      setBookingFilter('pending');
    } else if (filterParam === 'completed') {
      setBookingFilter('completed');
    } else if (filterParam === 'active') {
      setBookingFilter('active');
    } else if (filterParam === 'all') {
      setBookingFilter('all');
    }
  }, [filterParam]);

  // Notice banner (supports success, info, error)
  const [feedbackNotice, setFeedbackNotice] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showFeedback = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackNotice({ message, type });
    setTimeout(() => setFeedbackNotice(null), 4500);
  };

  // Add Machinery modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineType, setNewMachineType] = useState<MachineryType>('Tractor');
  const [newMachinePrice, setNewMachinePrice] = useState(750);
  const [newMachineLocation, setNewMachineLocation] = useState('Vellore');
  const [newMachineDesc, setNewMachineDesc] = useState('');

  // Edit Machinery modal
  const [editingMachine, setEditingMachine] = useState<Machinery | null>(null);
  const [editMachineName, setEditMachineName] = useState('');
  const [editMachineType, setEditMachineType] = useState<MachineryType>('Tractor');
  const [editMachinePrice, setEditMachinePrice] = useState<number | ''>(750);
  const [editMachineLocation, setEditMachineLocation] = useState('');
  const [editMachineDesc, setEditMachineDesc] = useState('');
  const [editMachineAvailable, setEditMachineAvailable] = useState(true);

  // Edit Provider Profile modal
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProviderName, setEditProviderName] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editProviderPhone, setEditProviderPhone] = useState('');
  const [editProviderAddress, setEditProviderAddress] = useState('');
  const [editProviderState, setEditProviderState] = useState('Tamil Nadu');
  const [editProviderDistrict, setEditProviderDistrict] = useState('Vellore');
  const [editProviderLat, setEditProviderLat] = useState<number | null>(12.9165);
  const [editProviderLng, setEditProviderLng] = useState<number | null>(79.1325);
  const [editMachineryTypes, setEditMachineryTypes] = useState<string[]>(['Tractor']);
  const [editRentalTerms, setEditRentalTerms] = useState('');


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
    showFeedback(isTa ? 'புதிய இயந்திரம் வெற்றிகரமாக சேர்க்கப்பட்டது!' : 'New equipment added to fleet successfully!');
  };

  // Open Edit Machine modal
  const openEditMachineModal = (m: Machinery) => {
    setEditingMachine(m);
    setEditMachineName(m.name);
    setEditMachineType(m.type);
    setEditMachinePrice(m.price_per_hour);
    setEditMachineLocation(m.location || 'Vellore');
    setEditMachineDesc(m.description || '');
    setEditMachineAvailable(m.available);
  };

  // Submit Edit Machine
  const handleEditMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachine || !editMachineName.trim()) return;

    const updates: Partial<Machinery> = {
      name: editMachineName.trim(),
      type: editMachineType,
      price_per_hour: Number(editMachinePrice) || 600,
      location: editMachineLocation.trim() || 'Vellore',
      description: editMachineDesc.trim() || 'Equipped for farm plowing and harvesting.',
      available: editMachineAvailable
    };

    // If Supabase is configured, persist to database first and verify success
    if (isConfigured) {
      const { error } = await updateMachineryRecord(editingMachine.id, updates);
      if (error) {
        console.error('Failed to update machinery in database:', error);
        showFeedback(
          isTa
            ? `இயந்திர விவரங்களை சேமிப்பதில் பிழை: ${error.message}`
            : `Failed to update equipment: ${error.message}`,
          'error'
        );
        return;
      }
    }

    // Only update local state if DB update succeeded (or offline mode)
    updateMachinery(editingMachine.id, updates);
    setEditingMachine(null);
    showFeedback(isTa ? 'இயந்திர விவரங்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன!' : 'Equipment details updated successfully!');
  };

  // Open Edit Provider Profile modal
  const openEditProfileModal = () => {
    setEditProviderName(currentUser.provider_name || currentUser.name || '');
    setEditContactName(currentUser.full_name || currentUser.name || '');
    setEditProviderPhone(currentUser.phone || '');
    setEditProviderAddress(currentUser.business_address || currentUser.location || '');
    setEditProviderState(currentUser.state || 'Tamil Nadu');
    setEditProviderDistrict(currentUser.district || 'Vellore');
    setEditProviderLat(currentUser.latitude ?? 12.9165);
    setEditProviderLng(currentUser.longitude ?? 79.1325);
    setEditMachineryTypes(
      currentUser.machinery_types && currentUser.machinery_types.length > 0
        ? currentUser.machinery_types
        : ['Tractor']
    );
    setEditRentalTerms(currentUser.rental_terms || '');
    setShowEditProfileModal(true);
  };

  // Submit Edit Provider Profile
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates = {
      provider_name: editProviderName.trim() || editContactName.trim(),
      full_name: editContactName.trim() || editProviderName.trim(),
      name: editContactName.trim() || editProviderName.trim(),
      phone: editProviderPhone.trim(),
      location: editProviderAddress.trim() || `${editProviderDistrict}, ${editProviderState}`,
      business_address: editProviderAddress.trim(),
      state: editProviderState,
      district: editProviderDistrict,
      latitude: editProviderLat ?? undefined,
      longitude: editProviderLng ?? undefined,
      machinery_types: editMachineryTypes,
      rental_terms: editRentalTerms.trim()
    };

    // If Supabase is configured and user logged in, persist to database first
    if (isConfigured && user) {
      const { error } = await updateProviderProfile(user.id, updates);
      if (error) {
        console.error('Failed to update provider profile in database:', error);
        showFeedback(
          isTa
            ? `சேவை வழங்குநர் சுயவிவரத்தை சேமிப்பதில் பிழை: ${error.message}`
            : `Failed to save provider profile: ${error.message}`,
          'error'
        );
        return;
      }
      try {
        localStorage.setItem(`agrime_profile_${user.id}`, JSON.stringify({ ...currentUser, ...updates }));
      } catch {}
    }

    // Only update local UI state if database update succeeded (or offline mode)
    updateCurrentUser(updates);
    setShowEditProfileModal(false);
    showFeedback(isTa ? 'இயந்திர உரிமையாளர் சுயவிவரம் புதுப்பிக்கப்பட்டது!' : 'Provider profile updated successfully!');
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

  const fleetLocationName = machinery[0]?.location || currentUser?.location || 'Tamil Nadu';
  const fleetMapUrl = getGoogleMapsUrl(
    machinery[0]?.latitude,
    machinery[0]?.longitude,
    `${fleetLocationName}, Tamil Nadu`
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Modern Page Header - Simplified to retain essential left-side identity */}
      <PageHeader
        title={translations.providerPortal.title}
        subtitle={translations.providerPortal.subtitle}
        badge={translations.providerPortal.welcomeBadge}
        icon={Tractor}
        iconColor="text-blue-700"
        iconBg="bg-blue-50 border-blue-200"
        backHref="/"
        backLabel={isTa ? 'முகப்புக்குச் செல்' : 'Back to Home'}
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

      {/* Feedback Notice Banner */}
      {feedbackNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`rounded-2xl p-4 flex items-center justify-between text-xs font-semibold shadow-xs ${
              feedbackNotice.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : feedbackNotice.type === 'info'
                ? 'bg-blue-50 border border-blue-200 text-blue-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackNotice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{feedbackNotice.message}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className={`font-bold ml-2 ${
                feedbackNotice.type === 'error'
                  ? 'text-rose-400 hover:text-rose-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TASK 6B: PENDING TAB (Only Pending Bookings) */}
      {/* ========================================================================= */}
      {filterParam === 'pending' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  {translations.providerPortal.pendingRequests}
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {pendingBookings.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTa
                  ? 'விவசாயிகளிடமிருந்து வந்துள்ள புதிய வாடகை முன்பதிவு கோரிக்கைகள். இவற்றை பரிசீலித்து ஏற்கவும்.'
                  : 'Pending machinery rental requests from farmers. Review job details and process approvals.'}
              </p>
            </div>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">
                {isTa ? 'நிலுவையில் உள்ள முன்பதிவுகள் எதுவும் இல்லை' : 'No Pending Bookings'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isTa
                  ? 'விவசாயிகள் உங்கள் இயந்திரங்களை முன்பதிவு செய்யும் போது அவை இங்கே தோன்றும்.'
                  : 'Incoming rental bookings from farmers will appear here for your review and approval.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((booking: MachineryBooking) => {
                const machine = booking.machinery || machinery.find((m) => m.id === booking.machinery_id) || machinery[0];

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl p-5 border border-amber-300 shadow-xs space-y-3 hover:border-amber-400 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {translations.booking.totalAmount}
                          </span>
                          <span className="text-lg font-black text-slate-900">
                            ₹{booking.total_amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                          {translateBookingStatus('pending')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReject(booking.id)}
                        className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                      >
                        {translations.providerPortal.rejectBooking}
                      </button>
                      <button
                        onClick={() => handleAccept(booking.id)}
                        className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                      >
                        {translations.providerPortal.acceptBooking}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TASK 6C: COMPLETED TAB (Only Completed Bookings) */}
      {/* ========================================================================= */}
      {filterParam === 'completed' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  {translations.nav.completed}
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {completedBookings.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTa
                  ? 'வெற்றிகரமாக முடிவடைந்த இயந்திர வாடகை பணிகள் மற்றும் வருவாய் பதிவுகள்.'
                  : 'Historical record of completed farm operations and finalized rentals.'}
              </p>
            </div>
          </div>

          {completedBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">
                {isTa ? 'முடிந்த பணிகள் எதுவும் இல்லை' : 'No Completed Jobs Yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isTa
                  ? 'முடிவடைந்த வேலைகள் விவசாயிகளுக்கு சேவை வழங்கிய பிறகு இங்கே ஆவணப்படுத்தப்படும்.'
                  : 'Completed jobs will appear here once farm machinery services have concluded.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedBookings.map((booking: MachineryBooking) => {
                const machine = booking.machinery || machinery.find((m) => m.id === booking.machinery_id) || machinery[0];

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
                              <span className="text-slate-500 text-xs ml-2">
                                {booking.farmer.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {translations.booking.totalAmount}
                          </span>
                          <span className="text-lg font-black text-emerald-700">
                            ₹{booking.total_amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{translateBookingStatus('completed')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TASK 6A: MAIN MACHINERY TAB (filterParam !== 'pending' && filterParam !== 'completed') */}
      {/* Must contain: 1. My Equipment, 2. Incoming Bookings, 3. Features, 4. Profile */}
      {/* ========================================================================= */}
      {(filterParam !== 'pending' && filterParam !== 'completed') && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: My Equipment, Incoming Bookings, and Provider Profile (2 Cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. MY EQUIPMENT SECTION */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Tractor className="w-4 h-4 text-blue-600" />
                    <span>{translations.providerPortal.fleetManagement}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {machinery.length} {isTa ? 'இயந்திரங்கள் பதிவு செய்யப்பட்டுள்ளன' : 'Registered machines available for booking'}
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

              {/* Machinery Fleet Cards with Edit details option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {machinery.map((m: Machinery) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                        <img
                          src={getMachineryImageUrl(m)}
                          alt={getMachineryAltText(m)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 truncate text-sm">{m.name}</h4>
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 mt-0.5 inline-block">
                          {translateMachineryType(m.type)}
                        </span>
                        <p className="text-slate-600 text-xs font-semibold mt-1">
                          ₹{m.price_per_hour}/{isTa ? 'மணி' : 'hr'} • <span className="text-slate-500 font-normal">{m.location}</span>
                        </p>
                      </div>
                    </div>

                    {m.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                        "{m.description}"
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openEditMachineModal(m)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors inline-flex items-center gap-1 shadow-xs"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>{isTa ? 'திருத்து' : 'Edit Details'}</span>
                      </button>

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
                  </div>
                ))}
              </div>
            </div>

            {/* 2. INCOMING BOOKINGS SECTION */}
            <div id="incomingBookings" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
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

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'active', label: `${translations.providerPortal.activeJobs} (${activeBookings.length})` },
                    { id: 'pending', label: `${translations.providerPortal.pendingRequests} (${pendingBookings.length})` },
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
                <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
                  <Tractor className="w-10 h-10 text-slate-300 mx-auto mb-2" />
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

                        {/* Active GPS Indicator */}
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

                        {/* Action Bar */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
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

                          {booking.status === 'on_the_way' && (
                            <button
                              onClick={() => handleMarkArrived(booking.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{translations.providerPortal.markArrived}</span>
                            </button>
                          )}

                          {booking.status === 'arrived' && (
                            <button
                              onClick={() => handleStartWork(booking.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>{translations.providerPortal.startWork}</span>
                            </button>
                          )}

                          {booking.status === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteWork(booking.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{translations.providerPortal.complete}</span>
                            </button>
                          )}

                          {booking.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isTa ? 'பணி முடிந்தது' : 'Job Completed'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. TASK 7B: MACHINERY PROVIDER PROFILE SECTION */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {isTa ? 'இயந்திர சேவை சுயவிவரம்' : 'Machinery Provider Profile'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isTa ? 'உங்கள் வணிக முகவரி, தொடர்புகள் மற்றும் வாடகை விதிமுறைகள்' : 'Business details, service location, and rental policies'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={openEditProfileModal}
                  className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{translations.profile.editProfile}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {isTa ? 'நிறுவனம் / பட்டறை பெயர்' : 'Provider / Business Name'}
                  </span>
                  <span className="font-black text-slate-900 text-sm">
                    {currentUser.provider_name || currentUser.name}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {isTa ? 'தொடர்பு நபர்' : 'Contact Person'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentUser.full_name || currentUser.name}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {isTa ? 'தொலைபேசி எண்' : 'Phone'}
                  </span>
                  <span className="font-bold text-slate-800">{currentUser.phone}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {isTa ? 'மாநிலம் & மாவட்டம்' : 'State & District'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentUser.district || 'Vellore'}, {currentUser.state || 'Tamil Nadu'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {isTa ? 'பட்டறை முகவரி' : 'Workshop / Base Address'}
                  </span>
                  <span className="font-medium text-slate-700">
                    {currentUser.business_address || currentUser.location}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      {isTa ? 'வரைபட இடம் & ஆயத்தொலைவுகள்' : 'Map Location & Coordinates'}
                    </span>
                    <span className="font-mono text-xs text-slate-700">
                      Lat: {currentUser.latitude ? currentUser.latitude.toFixed(4) : '12.9165'}, Lng: {currentUser.longitude ? currentUser.longitude.toFixed(4) : '79.1325'}
                    </span>
                  </div>
                  <a
                    href={getGoogleMapsUrl(currentUser.latitude || 12.9165, currentUser.longitude || 79.1325, currentUser.location) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
                  >
                    <span>{isTa ? 'வரைபடத்தில் பார்க்க' : 'View on Google Maps'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    {isTa ? 'வழங்கப்படும் இயந்திர வகைகள்' : 'Machinery Types Offered'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(currentUser.machinery_types && currentUser.machinery_types.length > 0
                      ? currentUser.machinery_types
                      : ['Tractor', 'Rotavator']
                    ).map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                        {translateMachineryType(t as any)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    {isTa ? 'வாடகை விதிமுறைகள் & நிபந்தனைகள்' : 'Rental Terms & Conditions'}
                  </span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {currentUser.rental_terms ||
                      (isTa
                        ? 'இயக்கநர் கட்டணம் மற்றும் டீசல் செலவு மணி நேர வாடகையில் உள்ளடங்கும். முன்பதிவு செய்த நாளில் நேரத்திற்கு சேவை வழங்கப்படும்.'
                        : 'Operator fees included. Diesel usage verified per hour. Transit tracking starts upon trip acceptance.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: TASK 6A.3 Available Provider Features ONLY on Main Page (1 Col on lg) */}
          <div id="availableProviderFeatures" className="space-y-4">
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
              <div className="pt-2 border-t border-blue-200/50 text-[11px] text-slate-500">
                {isTa
                  ? 'விவசாயிகளுக்கு விரைவான சேவையை வழங்க ஜிபிஎஸ் கண்காணிப்பை தொடர்ந்து புதுப்பிக்கவும்.'
                  : 'Maintain updated hourly rates and equipment availability for optimal farmer matching.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD MACHINERY MODAL */}
      {/* ========================================================================= */}
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
                  {isTa ? 'இயந்திரத்தின் பெயர்' : 'Machine Name & Model'} *
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
                    {translations.providerPortal.hourlyRate} (₹/hr) *
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

      {/* ========================================================================= */}
      {/* MODAL 2: TASK 7B EDIT MACHINERY MODAL (Single Equipment) */}
      {/* ========================================================================= */}
      {editingMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {isTa ? 'இயந்திர விவரங்களைத் திருத்தவும்' : 'Edit Equipment Details'}
                </h3>
              </div>
              <button
                onClick={() => setEditingMachine(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditMachineSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'இயந்திரத்தின் பெயர் & மாதிரி' : 'Equipment Name & Model'} *
                </label>
                <input
                  type="text"
                  required
                  value={editMachineName}
                  onChange={(e) => setEditMachineName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {translations.providerPortal.equipmentType || 'Type'} *
                  </label>
                  <select
                    value={editMachineType}
                    onChange={(e) => setEditMachineType(e.target.value as MachineryType)}
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
                    {translations.providerPortal.hourlyRate} (₹/hr) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={editMachinePrice}
                    onChange={(e) => setEditMachinePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'இயந்திரம் இருக்கும் இடம்' : 'Base Location (Town / District)'} *
                </label>
                <input
                  type="text"
                  required
                  value={editMachineLocation}
                  onChange={(e) => setEditMachineLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'விளக்கம் & இணைப்புகள்' : 'Description / Attachments'}
                </label>
                <textarea
                  rows={2}
                  value={editMachineDesc}
                  onChange={(e) => setEditMachineDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'வாடகைக்கு கிடைக்கும் நிலை' : 'Availability Status'}
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="machineAvailable"
                      checked={editMachineAvailable}
                      onChange={() => setEditMachineAvailable(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-emerald-800 font-bold">{isTa ? 'கிடைக்கும் (Available)' : 'Available for Booking'}</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="machineAvailable"
                      checked={!editMachineAvailable}
                      onChange={() => setEditMachineAvailable(false)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-800 font-bold">{isTa ? 'முன்பதிவு செய்யப்பட்டுள்ளது (Busy)' : 'Currently Busy / Rented'}</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMachine(null)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  {translations.common.cancel}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5 font-bold"
                >
                  {translations.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TASK 7B EDIT MACHINERY PROVIDER PROFILE MODAL */}
      {/* ========================================================================= */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {isTa ? 'இயந்திர சேவை சுயவிவரத்தை திருத்து' : 'Edit Machinery Provider Profile'}
                </h3>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isTa ? 'நிறுவனம் / பட்டறை பெயர்' : 'Provider / Business Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editProviderName}
                    onChange={(e) => setEditProviderName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isTa ? 'தொடர்பு நபர் பெயர்' : 'Contact Person Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editContactName}
                    onChange={(e) => setEditContactName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'அதிகாரப்பூர்வ தொலைபேசி எண்' : 'Official Phone'} *
                </label>
                <input
                  type="tel"
                  required
                  value={editProviderPhone}
                  onChange={(e) => setEditProviderPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isTa ? 'மாநிலம்' : 'State'} *
                  </label>
                  <select
                    value={editProviderState}
                    onChange={(e) => {
                      setEditProviderState(e.target.value);
                      const districts = getDistrictsForState(e.target.value);
                      if (districts.length > 0) setEditProviderDistrict(districts[0]);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    {INDIAN_STATES_AND_UTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isTa ? 'மாவட்டம்' : 'District'} *
                  </label>
                  <select
                    value={editProviderDistrict}
                    onChange={(e) => setEditProviderDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    {getDistrictsForState(editProviderState).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'பட்டறை / பணிமனை முகவரி' : 'Workshop / Business Address'} *
                </label>
                <input
                  type="text"
                  required
                  value={editProviderAddress}
                  onChange={(e) => setEditProviderAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Map Coordinates with LocationPicker */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'வரைபட இடம் (துல்லியமான ஆயத்தொலைவுகள்)' : 'Map Location & GPS Coordinates'}
                </label>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <LocationPicker
                    latitude={editProviderLat}
                    longitude={editProviderLng}
                    onChange={({ latitude, longitude }) => {
                      setEditProviderLat(latitude);
                      setEditProviderLng(longitude);
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isTa ? 'விவசாயிகள் தொலைவைக் கணக்கிட வரைபடத்தில் உங்கள் பட்டறையைக் குறிக்கவும்.' : 'Click map or drag marker to set exact dispatch coordinates.'}
                </p>
              </div>

              {/* Machinery Types Offered */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'வழங்கப்படும் இயந்திர வகைகள்' : 'Machinery Types Offered'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {['Tractor', 'Paddy Harvester', 'Power Tiller', 'Rotavator', 'Sprayer', 'Other'].map((type) => {
                    const checked = editMachineryTypes.includes(type);
                    return (
                      <label
                        key={type}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          checked
                            ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditMachineryTypes([...editMachineryTypes, type]);
                            } else {
                              setEditMachineryTypes(editMachineryTypes.filter((t) => t !== type));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'வாடகை விதிமுறைகள் & நிபந்தனைகள்' : 'Rental Terms & Conditions'}
                </label>
                <textarea
                  rows={2}
                  value={editRentalTerms}
                  onChange={(e) => setEditRentalTerms(e.target.value)}
                  placeholder="e.g. Fuel and operator included. Minimum 2 hours booking."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  {translations.common.cancel}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5 font-bold"
                >
                  {translations.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


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

export default function MachineryProviderPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <MachineryProviderPortalContent />
    </Suspense>
  );
}
