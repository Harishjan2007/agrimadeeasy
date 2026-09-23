'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MapPin,
  Search,
  Filter,
  Navigation,
  ExternalLink,
  Phone,
  SlidersHorizontal,
  Compass,
  AlertCircle,
  X,
  Check,
  Tractor,
  Store,
  Wheat,
  List,
  Map as MapIcon,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAgri } from '@/context/AgriContext';
import { useLanguage } from '@/i18n';
import {
  calculateDistanceKm,
  formatDistance,
  getDirectionsUrl,
  TAMIL_NADU_DISTRICTS,
  DistrictPreset
} from '@/lib/location';
import InteractiveMap, { MapItem, MapItemType } from '@/components/map/InteractiveMap';
import { getMachineryImageUrl, getMachineryAltText } from '@/lib/machinery-images';

type CategoryFilter = 'all' | 'dealers' | 'machinery' | 'markets';

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get('category') as CategoryFilter) || 'all';
  const highlightId = searchParams.get('id') || null;

  const { language, translations, translateMachineryType } = useLanguage();
  const { dealers, machinery, markets } = useAgri();
  const isTa = language === 'ta';

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachineryType, setSelectedMachineryType] = useState<string>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);

  // Selected item on map
  const [selectedItemId, setSelectedItemId] = useState<string | null>(highlightId);

  // View mode for mobile (map vs list)
  const [mobileViewMode, setMobileViewMode] = useState<'map' | 'list'>('map');

  // User Location State
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    name?: string;
    source: 'gps' | 'manual';
  } | null>(null);

  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  >('idle');
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [dismissedLocationBanner, setDismissedLocationBanner] = useState(false);

  // Request browser geolocation
  const requestBrowserLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({
          latitude,
          longitude,
          name: isTa ? 'உங்கள் தற்போதைய இடம்' : 'Your Current Location',
          source: 'gps'
        });
        setLocationStatus('granted');
        try {
          localStorage.setItem(
            'agrime_user_location',
            JSON.stringify({ latitude, longitude, name: 'GPS Location', source: 'gps' })
          );
        } catch (e) {}
      },
      (error) => {
        console.warn('Geolocation denied or failed:', error.message);
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [isTa]);

  // Load saved location on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('agrime_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          setUserLocation(parsed);
          setLocationStatus(parsed.source === 'gps' ? 'granted' : 'idle');
        }
      }
    } catch (e) {}
  }, []);

  // Set manual location preset
  const handleSelectDistrict = (district: DistrictPreset) => {
    const loc = {
      latitude: district.latitude,
      longitude: district.longitude,
      name: isTa ? district.nameTa : district.name,
      source: 'manual' as const
    };
    setUserLocation(loc);
    setShowDistrictModal(false);
    try {
      localStorage.setItem('agrime_user_location', JSON.stringify(loc));
    } catch (e) {}
  };

  // Convert raw items into standard MapItem objects with accurate coordinates and calculated distances
  const allMapItems: MapItem[] = useMemo(() => {
    const items: MapItem[] = [];

    // 1. Dealers
    dealers.forEach((dealer) => {
      const lat = dealer.latitude;
      const lon = dealer.longitude;
      const distance =
        userLocation && lat != null && lon != null
          ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, lat, lon)
          : undefined;

      if (lat != null && lon != null) {
        items.push({
          id: dealer.id,
          type: 'dealer',
          title: dealer.shop_name,
          subtitle: dealer.phone || undefined,
          category: isTa ? 'அக்ரி டீலர்' : 'Agri Dealer',
          latitude: lat,
          longitude: lon,
          phone: dealer.phone,
          address: dealer.address,
          distanceKm: distance,
          actionUrl: `/dealers?id=${dealer.id}`,
          actionLabel: isTa ? 'விவரங்கள்' : 'View Dealer'
        });
      }
    });

    // 2. Machinery
    machinery.forEach((machine) => {
      const lat = machine.latitude;
      const lon = machine.longitude;
      const distance =
        userLocation && lat != null && lon != null
          ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, lat, lon)
          : undefined;

      if (lat != null && lon != null) {
        items.push({
          id: machine.id,
          type: 'machinery',
          title: machine.name,
          subtitle: machine.location,
          category: translateMachineryType(machine.type),
          latitude: lat,
          longitude: lon,
          price: `₹${machine.price_per_hour}/${isTa ? 'மணி' : 'hr'}`,
          address: machine.location,
          available: machine.available,
          distanceKm: distance,
          imageUrl: getMachineryImageUrl(machine),
          actionUrl: `/machinery?id=${machine.id}`,
          actionLabel: machine.available
            ? (isTa ? 'வாடகைக்கு எடு' : 'Book Now')
            : (isTa ? 'விவரம்' : 'View')
        });
      }
    });

    // 3. Markets (Mandi)
    markets.forEach((market) => {
      const lat = market.latitude;
      const lon = market.longitude;
      const distance =
        userLocation && lat != null && lon != null
          ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, lat, lon)
          : undefined;

      if (lat != null && lon != null) {
        items.push({
          id: market.id,
          type: 'market',
          title: market.name,
          subtitle: market.location,
          category: isTa ? 'மண்டி' : 'APMC Mandi',
          latitude: lat,
          longitude: lon,
          address: market.location,
          distanceKm: distance,
          actionUrl: `/crop-price?market=${market.id}`,
          actionLabel: isTa ? 'விலைகள்' : 'Mandi Prices'
        });
      }
    });

    return items;
  }, [dealers, machinery, markets, userLocation, isTa, translateMachineryType]);

  // Filtered and Sorted Map Items
  const filteredItems = useMemo(() => {
    return allMapItems
      .filter((item) => {
        // Category Filter
        if (selectedCategory === 'dealers' && item.type !== 'dealer') return false;
        if (selectedCategory === 'machinery' && item.type !== 'machinery') return false;
        if (selectedCategory === 'markets' && item.type !== 'market') return false;

        // Machinery sub-filter
        if (selectedCategory === 'machinery' && selectedMachineryType !== 'all') {
          const original = machinery.find((m) => m.id === item.id);
          if (original && original.type !== selectedMachineryType) return false;
        }

        // Availability filter
        if (onlyAvailable && item.available === false) return false;

        // Max distance filter
        if (maxDistanceKm != null && item.distanceKm != null && item.distanceKm > maxDistanceKm) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchSub = item.subtitle?.toLowerCase().includes(q);
          const matchCat = item.category?.toLowerCase().includes(q);
          const matchAddr = item.address?.toLowerCase().includes(q);
          if (!matchTitle && !matchSub && !matchCat && !matchAddr) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort closest first if distance known
        if (a.distanceKm != null && b.distanceKm != null) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return a.title.localeCompare(b.title);
      });
  }, [allMapItems, selectedCategory, selectedMachineryType, onlyAvailable, maxDistanceKm, searchQuery, machinery]);

  // Selected item object
  const activeSelectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return allMapItems.find((i) => i.id === selectedItemId) || null;
  }, [selectedItemId, allMapItems]);

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* 1. Header Toolbar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Title & Active Location */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  {translations.map.title}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-agri-600 shrink-0" />
                  {userLocation ? (
                    <span className="font-semibold text-slate-800">
                      {userLocation.name}
                    </span>
                  ) : (
                    <span>{translations.map.distanceUnavailable}</span>
                  )}
                  <button
                    onClick={() => setShowDistrictModal(true)}
                    className="text-agri-700 hover:text-agri-800 font-bold underline ml-1 cursor-pointer"
                  >
                    {translations.map.selectDistrict}
                  </button>
                </div>
              </div>
            </div>

            {/* Location Quick Button & Mobile View Switcher */}
            <div className="flex items-center gap-2">
              <button
                onClick={requestBrowserLocation}
                disabled={locationStatus === 'requesting'}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors disabled:opacity-50"
                title={translations.map.useMyLocation}
              >
                <Navigation className={`w-3.5 h-3.5 text-blue-600 ${locationStatus === 'requesting' ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{translations.map.useMyLocation}</span>
                <span className="sm:hidden">{isTa ? 'ஜிபிஎஸ்' : 'GPS'}</span>
              </button>

              {/* Mobile Map / List View Toggle */}
              <div className="lg:hidden flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setMobileViewMode('map')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mobileViewMode === 'map'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>{translations.map.mapView}</span>
                </button>
                <button
                  onClick={() => setMobileViewMode('list')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mobileViewMode === 'list'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>{translations.map.listView}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Tabs */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: translations.map.all, count: allMapItems.length, icon: Compass },
                { id: 'dealers', label: translations.map.dealers, count: dealers.length, icon: Store },
                { id: 'machinery', label: translations.map.machinery, count: machinery.length, icon: Tractor },
                { id: 'markets', label: translations.map.markets, count: markets.length, icon: Wheat }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const active = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedCategory(tab.id as CategoryFilter);
                      setSelectedItemId(null);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translations.map.searchPlaceholder}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Geolocation Banner Prompt (If not yet granted and not dismissed) */}
      {!userLocation && !dismissedLocationBanner && (
        <div className="bg-blue-50 border-b border-blue-200 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-900">
              <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>{translations.map.locationPermissionTitle}:</strong>{' '}
                {translations.map.locationPermissionDesc}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={requestBrowserLocation}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors"
              >
                {translations.map.allowLocation}
              </button>
              <button
                onClick={() => setShowDistrictModal(true)}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 font-semibold rounded-lg text-xs border border-blue-300 transition-colors"
              >
                {translations.map.selectDistrict}
              </button>
              <button
                onClick={() => setDismissedLocationBanner(true)}
                className="text-blue-500 hover:text-blue-800 p-1"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content: Split View (List on Left, Interactive Map on Right) */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 gap-4 overflow-hidden">
        {/* Left Column: Results List (Hidden on mobile if map view active) */}
        <div
          className={`w-full lg:w-[420px] xl:w-[460px] flex flex-col shrink-0 ${
            mobileViewMode === 'map' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Sub-Filters Toolbar */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-200 text-xs">
            <span className="font-bold text-slate-700">
              {filteredItems.length} {translations.map.nearbyResults}
            </span>

            <div className="flex items-center gap-2">
              {/* Distance filter */}
              <select
                value={maxDistanceKm ?? ''}
                onChange={(e) => setMaxDistanceKm(e.target.value ? Number(e.target.value) : null)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value="">{isTa ? 'அனைத்து தொலைவு' : 'Any Distance'}</option>
                <option value="15">&lt; 15 km</option>
                <option value="30">&lt; 30 km</option>
                <option value="60">&lt; 60 km</option>
              </select>

              {/* Only Available toggle for machinery */}
              {selectedCategory === 'machinery' && (
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="rounded text-agri-600 focus:ring-0"
                  />
                  <span>{isTa ? 'கிடைப்பவை மட்டும்' : 'Available only'}</span>
                </label>
              )}
            </div>
          </div>

          {/* Results Scrollable Container */}
          <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[calc(100vh-250px)] scrollbar-thin">
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">{translations.map.noResultsFound}</h4>
                <p className="text-xs text-slate-500 mt-1">{translations.map.noResultsDesc}</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setMaxDistanceKm(null);
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                >
                  {isTa ? 'அனைத்தையும் காட்டு' : 'Reset Filters'}
                </button>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                const directionsUrl = getDirectionsUrl(item.latitude, item.longitude, item.address);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItemId(item.id);
                      if (mobileViewMode === 'list') {
                        setMobileViewMode('map');
                      }
                    }}
                    className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:border-slate-400 ${
                      isSelected
                        ? 'border-slate-900 ring-2 ring-slate-900/10 bg-slate-50/50'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail or Category Icon */}
                      <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : item.type === 'dealer' ? (
                          <Store className="w-6 h-6 text-emerald-600" />
                        ) : item.type === 'machinery' ? (
                          <Tractor className="w-6 h-6 text-amber-600" />
                        ) : (
                          <Wheat className="w-6 h-6 text-purple-600" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              item.type === 'dealer'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.type === 'machinery'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {item.category || item.type}
                          </span>

                          {item.distanceKm != null && (
                            <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-agri-600" />
                              {formatDistance(item.distanceKm)}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm truncate leading-snug">
                          {item.title}
                        </h3>

                        {item.price && (
                          <p className="text-xs font-black text-slate-800 mt-0.5">
                            {item.price}
                          </p>
                        )}

                        {item.address && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {item.address}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                          {item.actionUrl && (
                            <Link
                              href={item.actionUrl}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              {item.actionLabel || (isTa ? 'விவரம்' : 'View')}
                            </Link>
                          )}

                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                            title={translations.map.getDirections}
                          >
                            <Navigation className="w-3 h-3" />
                            <span>{translations.map.getDirections}</span>
                          </a>

                          {item.phone && (
                            <a
                              href={`tel:${item.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-lg ml-auto"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Map Canvas */}
        <div
          className={`flex-1 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative min-h-[480px] lg:min-h-[600px] ${
            mobileViewMode === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <InteractiveMap
            items={filteredItems}
            userLocation={userLocation}
            selectedItemId={selectedItemId}
            onSelectItem={(item) => setSelectedItemId(item?.id || null)}
          />

          {/* Floating Mobile Card at bottom of map when an item is selected */}
          {activeSelectedItem && mobileViewMode === 'map' && (
            <div className="lg:hidden absolute bottom-3 left-3 right-3 z-20 bg-white rounded-2xl p-4 shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {activeSelectedItem.category}
                    </span>
                    {activeSelectedItem.distanceKm != null && (
                      <span className="text-xs font-bold text-slate-600">
                        📍 {formatDistance(activeSelectedItem.distanceKm)}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {activeSelectedItem.title}
                  </h4>
                  {activeSelectedItem.price && (
                    <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                      {activeSelectedItem.price}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedItemId(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                {activeSelectedItem.actionUrl && (
                  <Link
                    href={activeSelectedItem.actionUrl}
                    className="flex-1 text-center py-1.5 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    {activeSelectedItem.actionLabel || 'View'}
                  </Link>
                )}
                <a
                  href={getDirectionsUrl(
                    activeSelectedItem.latitude,
                    activeSelectedItem.longitude,
                    activeSelectedItem.address
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{translations.map.getDirections}</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Manual District Selector Modal */}
      {showDistrictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {translations.map.manualLocationPrompt}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {translations.map.selectDistrict}
                </p>
              </div>
              <button
                onClick={() => setShowDistrictModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1 scrollbar-thin">
              {TAMIL_NADU_DISTRICTS.map((district) => {
                const isCurrent =
                  userLocation?.name === (isTa ? district.nameTa : district.name);
                return (
                  <button
                    key={district.id}
                    onClick={() => handleSelectDistrict(district)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isCurrent
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">
                        {isTa ? district.nameTa : district.name}
                      </div>
                      <div className={`text-[11px] ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                        {district.state} • Lat: {district.latitude.toFixed(2)}, Lon: {district.longitude.toFixed(2)}
                      </div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDistrictModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {translations.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
