'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  Tractor,
  MapPin,
  Clock,
  Phone,
  Navigation,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { MachineryBooking, MachineryTracking } from '@/types';
import { useAgri } from '@/context/AgriContext';
import { useLanguage } from '@/i18n';
import {
  calculateDistanceKm,
  formatDistance,
  calculateMachineryETA,
  formatTimeElapsed,
  getDirectionsUrl
} from '@/lib/location';
import { subscribeToMachineryTracking, getMachineryLocation as fetchSupabaseTracking } from '@/lib/supabase/machinery';
import InteractiveMap, { MapItem } from '@/components/map/InteractiveMap';
import { getMachineryImageUrl, getMachineryAltText } from '@/lib/machinery-images';

interface MachineryTrackingModalProps {
  booking: MachineryBooking | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MachineryTrackingModal({
  booking,
  isOpen,
  onClose
}: MachineryTrackingModalProps) {
  const { language, translations, translateBookingStatus, translateMachineryType } = useLanguage();
  const { getMachineryLocation, updateMachineryLocation, machinery } = useAgri();
  const isTa = language === 'ta';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Current tracking data from context
  const trackingData: MachineryTracking | null = booking
    ? getMachineryLocation(booking.id)
    : null;

  // Realtime subscription to tracking updates
  useEffect(() => {
    if (!isOpen || !booking?.id) return;

    // Initial fetch from Supabase
    fetchSupabaseTracking(booking.id).then((data) => {
      if (data) {
        updateMachineryLocation(booking.id, data);
        setLastRefreshedAt(new Date());
      }
    }).catch(() => {});

    // Subscribe to Realtime postgres_changes with 10s polling fallback
    const unsubscribe = subscribeToMachineryTracking(booking.id, (newData) => {
      updateMachineryLocation(booking.id, newData);
      setLastRefreshedAt(new Date());
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, booking?.id, updateMachineryLocation]);

  // Periodic re-render ticker every 5s so elapsed time updates
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Manual Refresh
  const handleManualRefresh = async () => {
    if (!booking?.id) return;
    setIsRefreshing(true);
    try {
      const fresh = await fetchSupabaseTracking(booking.id);
      if (fresh) {
        updateMachineryLocation(booking.id, fresh);
      }
      setLastRefreshedAt(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  if (!isOpen || !booking) return null;

  const machine = booking.machinery || machinery.find((m) => m.id === booking.machinery_id) || machinery[0];

  // Destination (Farmer's location / farm coordinates)
  // Default to Katpadi / Vellore farm if user GPS unavailable
  const destinationCoords = {
    latitude: 12.9698,
    longitude: 79.1384,
    name: booking.farmer?.location || 'Katpadi Farm, Vellore'
  };

  // Calculate live distance & ETA if provider GPS is available
  const hasLiveGps = Boolean(trackingData?.latitude && trackingData?.longitude);
  const distanceKm = hasLiveGps
    ? calculateDistanceKm(
        trackingData!.latitude,
        trackingData!.longitude,
        destinationCoords.latitude,
        destinationCoords.longitude
      )
    : null;

  const etaMinutes = distanceKm != null ? calculateMachineryETA(distanceKm) : null;
  const elapsedText = trackingData?.recorded_at
    ? formatTimeElapsed(trackingData.recorded_at)
    : null;

  // Active tracking payload for InteractiveMap
  const activeTrackingProp = hasLiveGps
    ? {
        providerLocation: {
          latitude: trackingData!.latitude,
          longitude: trackingData!.longitude,
          speed: trackingData!.speed,
          heading: trackingData!.heading,
          recordedAt: trackingData!.recorded_at
        },
        farmerLocation: {
          latitude: destinationCoords.latitude,
          longitude: destinationCoords.longitude,
          label: destinationCoords.name
        },
        status: booking.status
      }
    : null;

  // Map markers to display
  const mapItems: MapItem[] = [];
  if (hasLiveGps) {
    mapItems.push({
      id: `live-${booking.id}`,
      type: 'machinery',
      title: machine?.name || 'Live Machinery',
      subtitle: `${trackingData!.speed ? `${trackingData!.speed} km/h` : 'Moving'}`,
      category: 'In Transit',
      latitude: trackingData!.latitude,
      longitude: trackingData!.longitude,
      phone: machine?.provider?.phone
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 sm:py-4 bg-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  {translations.tracking.trackingModalTitle || 'Live Machinery Tracking'}
                </h3>
                {hasLiveGps && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs">
                {booking.id} • {machine?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title={translations.tracking.refreshLocation || 'Refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          {/* Status & ETA Banner Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {isTa ? 'தற்போதைய நிலை' : 'Current Status'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      booking.status === 'on_the_way'
                        ? 'bg-amber-500 text-white animate-pulse'
                        : booking.status === 'arrived'
                        ? 'bg-indigo-600 text-white'
                        : booking.status === 'in_progress'
                        ? 'bg-purple-600 text-white'
                        : booking.status === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {translateBookingStatus(booking.status)}
                  </span>
                </div>
              </div>

              {/* Real Distance & Honest ETA */}
              <div className="flex items-center gap-4 text-right">
                {distanceKm != null ? (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {isTa ? 'தொலைவு' : 'Distance'}
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {formatDistance(distanceKm)}
                      </span>
                    </div>
                    <div className="pl-4 border-l border-slate-200">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {translations.tracking.eta} (~25 km/h)
                      </span>
                      <span className="text-base font-black text-emerald-600">
                        {etaMinutes != null ? `${etaMinutes} mins` : translations.tracking.etaUnavailable}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {booking.status === 'accepted'
                        ? (isTa ? 'பயணம் விரைவில் தொடங்கும்' : 'Trip not started yet')
                        : translations.tracking.liveLocationUnavailable}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {isTa ? 'இயந்திரம் புறப்பட்டதும் நேரடி நேரம் தோன்றும்' : 'Awaiting provider GPS dispatch'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Last Updated Timestamp & Speed */}
            {hasLiveGps && (
              <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  {translations.tracking.lastUpdated}: <strong>{elapsedText || 'Just now'}</strong>
                </span>
                {trackingData?.speed != null && (
                  <span className="font-mono">
                    Speed: <strong>{trackingData.speed} km/h</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Interactive Live Map Section */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-64 sm:h-72 relative">
            <InteractiveMap
              items={mapItems}
              activeTracking={activeTrackingProp}
              userLocation={{
                latitude: destinationCoords.latitude,
                longitude: destinationCoords.longitude,
                name: destinationCoords.name
              }}
              zoom={12}
            />
          </div>

          {/* Machine & Driver Information Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                <img
                  src={getMachineryImageUrl(machine)}
                  alt={getMachineryAltText(machine)}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{machine?.name}</h4>
                <p className="text-xs text-slate-500">
                  {translateMachineryType(machine?.type || 'Tractor')} • ₹{machine?.price_per_hour}/{isTa ? 'மணி' : 'hr'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {machine?.location}
                </p>
              </div>
            </div>

            {/* Call Provider Button */}
            {machine?.provider?.phone && (
              <a
                href={`tel:${machine.provider.phone}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{translations.tracking.callDriver}</span>
              </a>
            )}
          </div>

          {/* Data Honesty Disclaimer */}
          <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>{isTa ? 'உண்மைத் தரவு உறுதிமொழி' : 'Real-World Data Assurance'}:</strong>{' '}
              {isTa
                ? 'நேரடி ஜிபிஎஸ் ஒருங்கிணைப்புகள் இயந்திர உரிமையாளரின் சாதனத்திலிருந்து நேரடியாகப் பெறப்படுகின்றன. செயற்கையான அல்லது போலி இயக்கங்கள் எதுவும் உருவாக்கப்படவில்லை.'
                : 'GPS coordinates and vehicle transit updates are broadcast directly from the equipment provider’s device in real-time. No mock or fabricated movement is used.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {isTa ? 'முன்பதிவு தேதி' : 'Scheduled'}: <strong>{booking.booking_date} ({booking.start_time} - {booking.end_time})</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            {translations.common.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
