'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Crosshair, CheckCircle2, AlertCircle } from 'lucide-react';
import { TAMIL_NADU_DISTRICTS } from '@/lib/location';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  district?: string;
  isTa?: boolean;
}

// Fallback coordinate: Central Tamil Nadu (Vellore region)
const DEFAULT_COORDS: [number, number] = [12.9165, 79.1325];

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
  district,
  isTa = false
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [leafletReady, setLeafletReady] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Dynamically load Leaflet script & CSS from unpkg CDN
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.L) {
      setLeafletReady(true);
      return;
    }

    // Inject CSS
    const existingCss = document.querySelector('link[href*="leaflet"]');
    if (!existingCss) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Inject JS
    const existingScript = document.querySelector('script[src*="leaflet"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setLeafletReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.async = true;

    script.onload = () => {
      setLeafletReady(true);
    };

    script.onerror = () => {
      setGpsError('Could not load map engine. You can enter coordinates or use GPS.');
    };

    document.head.appendChild(script);
  }, []);

  // Center coordinate
  const currentCenter: [number, number] = latitude && longitude 
    ? [latitude, longitude] 
    : DEFAULT_COORDS;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        center: currentCenter,
        zoom: 12,
        zoomControl: true
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;

      // Handle map click to drop / move pin
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        const roundedLat = parseFloat(lat.toFixed(5));
        const roundedLng = parseFloat(lng.toFixed(5));
        onChange({ latitude: roundedLat, longitude: roundedLng });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletReady]);

  // Update marker position when latitude/longitude change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !latitude || !longitude) return;

    const latLng = [latitude, longitude];

    if (markerRef.current) {
      markerRef.current.setLatLng(latLng);
    } else {
      const pinIcon = window.L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: #059669; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); border: 3px solid white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      markerRef.current = window.L.marker(latLng, { icon: pinIcon }).addTo(mapInstanceRef.current);
    }

    mapInstanceRef.current.panTo(latLng);
  }, [latitude, longitude]);

  // Center on district preset if district changes and coordinates are not set
  useEffect(() => {
    if (!district || !mapInstanceRef.current) return;
    const match = TAMIL_NADU_DISTRICTS.find(
      d => d.name.toLowerCase() === district.toLowerCase() || d.nameTa === district
    );
    if (match) {
      if (!latitude || !longitude) {
        onChange({ latitude: match.latitude, longitude: match.longitude });
      }
      mapInstanceRef.current.setView([match.latitude, match.longitude], 12);
    }
  }, [district]);

  // Handle GPS location fetch
  const handleGetGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError(isTa ? 'உங்கள் உலாவியில் ஜிபிஎஸ் வசதி இல்லை.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        onChange({ latitude: lat, longitude: lng });
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.message || (isTa ? 'இருப்பிடத்தைப் பெற முடியவில்லை.' : 'Unable to acquire GPS position.'));
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isTa ? 'வரைபடத்தில் துல்லியமான இருப்பிடத்தைக் குறிக்கவும்' : 'Pinpoint Location on Map'} *</span>
        </label>

        <button
          type="button"
          onClick={handleGetGPS}
          disabled={gpsLoading}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
          <span>{gpsLoading ? (isTa ? 'பெறுகிறது...' : 'Detecting...') : (isTa ? 'ஜிபிஎஸ் இருப்பிடம்' : 'Use Current GPS')}</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500">
        {isTa
          ? 'வரைபடத்தில் கிளிக் செய்து உங்கள் வணிக இடத்தை தேர்வு செய்யவும்.'
          : 'Click anywhere on the map to set your business location coordinates.'}
      </p>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner h-52 sm:h-60 w-full">
        <div ref={mapContainerRef} className="w-full h-full" />

        {!leafletReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 text-slate-500 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{isTa ? 'வரைபடம் ஏற்றப்படுகிறது...' : 'Loading interactive map...'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Coordinate Status Display */}
      {latitude && longitude ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              {isTa ? 'தேர்வு செய்யப்பட்ட ஆயத்தொலைவுகள்:' : 'Selected Coordinates:'}
            </span>
          </div>
          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{isTa ? 'தயவுசெய்து வரைபடத்தில் ஒரு இடத்தைக் கிளிக் செய்யவும்.' : 'Please click on the map to select coordinates.'}</span>
        </div>
      )}

      {gpsError && (
        <p className="text-[11px] text-rose-600 font-semibold">{gpsError}</p>
      )}
    </div>
  );
}
