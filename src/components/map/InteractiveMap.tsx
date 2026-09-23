'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Phone,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Layers,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { getDirectionsUrl, formatDistance } from '@/lib/location';

export type MapItemType = 'dealer' | 'machinery' | 'market' | 'farmer';

export interface MapItem {
  id: string;
  type: MapItemType;
  title: string;
  subtitle?: string;
  category?: string;
  latitude: number;
  longitude: number;
  price?: string | number;
  phone?: string;
  address?: string;
  available?: boolean;
  distanceKm?: number;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface TrackingPoint {
  latitude: number;
  longitude: number;
  label?: string;
  heading?: number | null;
  speed?: number | null;
  recordedAt?: string;
}

interface InteractiveMapProps {
  items: MapItem[];
  userLocation?: { latitude: number; longitude: number; name?: string } | null;
  selectedItemId?: string | null;
  onSelectItem?: (item: MapItem | null) => void;
  activeTracking?: {
    providerLocation: TrackingPoint;
    farmerLocation?: TrackingPoint | null;
    status: string;
  } | null;
  className?: string;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
}

// Global declaration for Leaflet loaded via CDN
declare global {
  interface Window {
    L: any;
  }
}

// Fallback coordinate: Central Tamil Nadu (Vellore region)
const DEFAULT_CENTER: [number, number] = [12.9165, 79.1325];

export default function InteractiveMap({
  items,
  userLocation,
  selectedItemId,
  onSelectItem,
  activeTracking,
  className = '',
  center,
  zoom = 11,
  interactive = true
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const trackingMarkerRef = useRef<any>(null);

  const [leafletReady, setLeafletReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTileLayer, setActiveTileLayer] = useState<'standard' | 'satellite'>('standard');

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
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
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
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;

    script.onload = () => {
      setLeafletReady(true);
    };

    script.onerror = () => {
      setLoadError('Failed to load map engine. Please check your internet connection.');
    };

    document.head.appendChild(script);
  }, []);

  // Determine initial center
  const getInitialCenter = useCallback((): [number, number] => {
    if (center) return center;
    if (activeTracking?.providerLocation) {
      return [activeTracking.providerLocation.latitude, activeTracking.providerLocation.longitude];
    }
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    if (items.length > 0) {
      return [items[0].latitude, items[0].longitude];
    }
    return DEFAULT_CENTER;
  }, [center, activeTracking, userLocation, items]);

  // Create custom marker icons
  const createCustomIcon = useCallback((type: MapItemType, isSelected: boolean) => {
    if (!window.L) return null;

    let bgClass = 'bg-slate-700';
    let ringClass = isSelected ? 'ring-4 ring-slate-900 ring-offset-2 scale-110' : '';
    let iconSvg = '';

    switch (type) {
      case 'farmer':
        bgClass = 'bg-blue-600';
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>`;
        break;
      case 'dealer':
        bgClass = 'bg-emerald-600';
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
          </svg>`;
        break;
      case 'machinery':
        bgClass = 'bg-amber-600';
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="m10 11 11 .9a1 1 0 0 1 .8 1.1l-.66 5a1 1 0 0 1-1 .9H16"/>
            <path d="M16 18h-5"/>
            <path d="M18 5a1 1 0 0 0-1 1v5l4 1V6a1 1 0 0 0-1-1Z"/>
            <circle cx="7" cy="15" r="5"/>
            <circle cx="7" cy="15" r="2"/>
            <circle cx="19" cy="17" r="2"/>
          </svg>`;
        break;
      case 'market':
        bgClass = 'bg-purple-600';
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="M2 22 16 8"/>
            <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/>
            <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/>
            <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/>
          </svg>`;
        break;
    }

    const html = `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200">
        <div class="w-9 h-9 rounded-full shadow-lg flex items-center justify-center ${bgClass} ${ringClass} text-white border-2 border-white">
          ${iconSvg}
        </div>
        <div class="absolute -bottom-1 w-2 h-2 rotate-45 ${bgClass} border-r border-b border-white"></div>
      </div>
    `;

    return window.L.divIcon({
      className: 'custom-map-marker',
      html,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -42]
    });
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = getInitialCenter();
    const L = window.L;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom,
      zoomControl: false,
      scrollWheelZoom: interactive,
      dragging: interactive,
      touchZoom: interactive
    });

    // Standard OpenStreetMap Tiles
    const standardTile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    standardTile.addTo(map);
    map.tileLayerInstance = standardTile;

    // Layer groups
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletReady, getInitialCenter, zoom, interactive]);

  // Update Tile Layer (Standard vs Satellite)
  const toggleTileLayer = () => {
    const map = mapInstanceRef.current;
    const L = window.L;
    if (!map || !L) return;

    if (map.tileLayerInstance) {
      map.removeLayer(map.tileLayerInstance);
    }

    if (activeTileLayer === 'standard') {
      // Esri World Imagery (High-res satellite)
      const satellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
      );
      satellite.addTo(map);
      map.tileLayerInstance = satellite;
      setActiveTileLayer('satellite');
    } else {
      const standard = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      standard.addTo(map);
      map.tileLayerInstance = standard;
      setActiveTileLayer('standard');
    }
  };

  // Render & Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const L = window.L;
    if (!map || !markersGroup || !L) return;

    markersGroup.clearLayers();

    // 1. Add User/Farmer Location Marker
    if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
      const userIcon = createCustomIcon('farmer', false);
      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
        zIndexOffset: 1000
      });

      const userPopupContent = `
        <div class="p-1 font-sans text-xs">
          <div class="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block animate-pulse"></span>
            ${userLocation.name || 'Your Location'}
          </div>
          <p class="text-slate-500 text-[11px] mt-1">
            Lat: ${userLocation.latitude.toFixed(4)}, Lon: ${userLocation.longitude.toFixed(4)}
          </p>
        </div>
      `;
      userMarker.bindPopup(userPopupContent);
      markersGroup.addLayer(userMarker);
    }

    // 2. Add Discovery Items (Dealers, Machinery, Markets)
    items.forEach((item) => {
      if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') return;

      const isSelected = selectedItemId === item.id;
      const icon = createCustomIcon(item.type, isSelected);

      const marker = L.marker([item.latitude, item.longitude], {
        icon,
        zIndexOffset: isSelected ? 900 : 500
      });

      // HTML Popup Card
      const directionsUrl = getDirectionsUrl(item.latitude, item.longitude, item.address);
      const distanceBadge = item.distanceKm != null
        ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
             📍 ${formatDistance(item.distanceKm)}
           </span>`
        : '';

      const typeBadge = `
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          item.type === 'dealer'
            ? 'bg-emerald-100 text-emerald-800'
            : item.type === 'machinery'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-purple-100 text-purple-800'
        }">
          ${item.category || item.type}
        </span>
      `;

      const popupHtml = `
        <div class="p-2 font-sans max-w-[260px]">
          <div class="flex items-center justify-between gap-1 mb-1.5">
            ${typeBadge}
            ${distanceBadge}
          </div>
          <h4 class="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
            ${item.title}
          </h4>
          ${item.subtitle ? `<p class="text-slate-500 text-xs mt-0.5 line-clamp-1">${item.subtitle}</p>` : ''}
          ${item.price ? `<div class="mt-1 font-extrabold text-slate-800 text-xs">${typeof item.price === 'number' ? `₹${item.price.toLocaleString('en-IN')}` : item.price}</div>` : ''}
          ${item.address ? `<p class="text-slate-400 text-[11px] mt-1 line-clamp-2">${item.address}</p>` : ''}
          
          <div class="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
            ${
              item.actionUrl
                ? `<a href="${item.actionUrl}" class="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-center text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors inline-block">
                     ${item.actionLabel || 'View'}
                   </a>`
                : ''
            }
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition-colors inline-flex items-center justify-center title="Get Directions"">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
            </a>
            ${
              item.phone
                ? `<a href="tel:${item.phone}" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg transition-colors inline-flex items-center justify-center title="Call">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                       <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                     </svg>
                   </a>`
                : ''
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectItem) onSelectItem(item);
      });

      markersGroup.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // 3. Live Active Tracking (Provider Vehicle + Route Line + Farmer Point)
    if (activeTracking?.providerLocation) {
      const pLoc = activeTracking.providerLocation;
      const L = window.L;

      // Moving Provider Tractor Marker
      const tractorHtml = `
        <div class="relative flex items-center justify-center animate-bounce">
          <div class="w-11 h-11 rounded-full bg-amber-500 ring-4 ring-amber-300 shadow-xl flex items-center justify-center text-white border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <path d="m10 11 11 .9a1 1 0 0 1 .8 1.1l-.66 5a1 1 0 0 1-1 .9H16"/>
              <path d="M16 18h-5"/>
              <path d="M18 5a1 1 0 0 0-1 1v5l4 1V6a1 1 0 0 0-1-1Z"/>
              <circle cx="7" cy="15" r="5"/>
              <circle cx="7" cy="15" r="2"/>
              <circle cx="19" cy="17" r="2"/>
            </svg>
          </div>
          <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
          </span>
        </div>
      `;

      const trackingIcon = L.divIcon({
        className: 'live-tracking-marker',
        html: tractorHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      if (trackingMarkerRef.current) {
        trackingMarkerRef.current.setLatLng([pLoc.latitude, pLoc.longitude]);
      } else {
        const marker = L.marker([pLoc.latitude, pLoc.longitude], {
          icon: trackingIcon,
          zIndexOffset: 2000
        });
        marker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <div class="font-bold text-amber-700 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Live Machinery
            </div>
            <p class="text-slate-600 text-[11px] mt-1 font-medium">Status: ${activeTracking.status.replace(/_/g, ' ')}</p>
            ${pLoc.speed != null ? `<p class="text-slate-400 text-[10px]">Speed: ${pLoc.speed} km/h</p>` : ''}
          </div>
        `);
        markersGroup.addLayer(marker);
        trackingMarkerRef.current = marker;
      }

      // Draw dashed route polyline if farmer destination exists
      if (activeTracking.farmerLocation) {
        const fLoc = activeTracking.farmerLocation;
        const lineCoords = [
          [pLoc.latitude, pLoc.longitude],
          [fLoc.latitude, fLoc.longitude]
        ];

        if (routePolylineRef.current) {
          routePolylineRef.current.setLatLngs(lineCoords);
        } else {
          const polyline = L.polyline(lineCoords, {
            color: '#f59e0b',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.85
          });
          polyline.addTo(markersGroup);
          routePolylineRef.current = polyline;
        }

        // Fit map bounds to show both points with padding
        const bounds = L.latLngBounds(lineCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [items, userLocation, selectedItemId, activeTracking, createCustomIcon, onSelectItem]);

  // Recenter to user or items
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeTracking?.providerLocation) {
      map.setView(
        [activeTracking.providerLocation.latitude, activeTracking.providerLocation.longitude],
        13,
        { animate: true }
      );
    } else if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 13, { animate: true });
    } else if (items.length > 0) {
      map.setView([items[0].latitude, items[0].longitude], 12, { animate: true });
    } else {
      map.setView(DEFAULT_CENTER, 11, { animate: true });
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className={`relative w-full h-full min-h-[380px] bg-slate-100 overflow-hidden ${className}`}>
      {/* Map DOM target */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Loading state indicator */}
      {!leafletReady && !loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-xs">
          <div className="w-9 h-9 border-3 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-600 mt-3">Loading Agricultural Map...</p>
        </div>
      )}

      {/* Load error fallback */}
      {loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-white/95">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
          <h4 className="text-sm font-bold text-slate-800">Map Unavailable</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Map Control Buttons (Floating overlay) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {/* Recenter / My Location */}
        <button
          onClick={handleRecenter}
          className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:text-agri-600 shadow-md border border-slate-200 flex items-center justify-center transition-transform active:scale-95"
          title="Recenter Map"
          aria-label="Recenter Map"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Tile Layer Toggle (Satellite vs Standard) */}
        <button
          onClick={toggleTileLayer}
          className={`w-9 h-9 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-transform active:scale-95 ${
            activeTileLayer === 'satellite'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 hover:text-agri-600'
          }`}
          title={activeTileLayer === 'satellite' ? 'Standard Map' : 'Satellite Imagery'}
          aria-label="Toggle Layer"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:text-agri-600 shadow-md border border-slate-200 flex items-center justify-center transition-transform active:scale-95"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:text-agri-600 shadow-md border border-slate-200 flex items-center justify-center transition-transform active:scale-95"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend (Floating bottom-left pill on desktop) */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-[11px] font-medium text-slate-700">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
          You
        </span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
          Dealers
        </span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
          Machinery
        </span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
          Markets
        </span>
      </div>
    </div>
  );
}
