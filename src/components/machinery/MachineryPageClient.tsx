'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Tractor, 
  Search, 
  CalendarCheck, 
  Sparkles, 
  ShieldAlert, 
  X, 
  MapPin, 
  Compass, 
  RefreshCw, 
  AlertCircle,
  SlidersHorizontal
} from 'lucide-react';
import { MOCK_MACHINERY } from '@/lib/mock-data';
import { DEMO_MACHINERY_DRIVERS } from '@/lib/machinery-drivers-data';
import { Machinery, MachineryBooking } from '@/types';
import MachineryCard from '@/components/machinery/MachineryCard';
import MachineryBookingForm from '@/components/machinery/MachineryBookingForm';
import { useLanguage } from '@/i18n';
import { useAgri } from '@/context/AgriContext';
import { getMachinery } from '@/lib/supabase/machinery';
import { PageHeader, SearchBar, CategoryTabs, EmptyState } from '@/components/ui';
import { TAMIL_NADU_DISTRICTS, calculateDistanceKm } from '@/lib/location';

export default function MachineryPageClient() {
  const { machinery: contextMachinery, bookings: contextBookings } = useAgri();
  const [dbMachinery, setDbMachinery] = useState<Machinery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedMachineryForBooking, setSelectedMachineryForBooking] = useState<Machinery | null>(null);
  const [selectedDemoDriverForModal, setSelectedDemoDriverForModal] = useState<Machinery | null>(null);

  // Location-Based Discovery State
  const [radiusKm, setRadiusKm] = useState<number | 'all'>(100);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationSource, setLocationSource] = useState<'prompting' | 'gps' | 'manual' | 'denied'>('prompting');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

  const { language, translations, translateMachineryType } = useLanguage();
  const isTa = language === 'ta';

  // Request browser geolocation on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.geolocation) {
      setLocationSource('denied');
      setLocationErrorMsg(isTa ? 'உங்கள் உலாவியில் ஜிபிஎஸ் இருப்பிட வசதி இல்லை.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setLocationSource('prompting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setLocationSource('gps');
        setLocationErrorMsg(null);
      },
      (err) => {
        setLocationSource('denied');
        setLocationErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? (isTa ? 'இருப்பிட அனுமதி வழங்கப்படவில்லை. கீழே உள்ள உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.' : 'Location permission denied. Please choose your district manually below.')
            : (isTa ? 'இருப்பிடத்தைப் பெறுவதில் தாமதம் ஏற்பட்டது. கைமுறையாக மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.' : 'Unable to acquire GPS coordinates. Please select your district manually below.')
        );
      },
      {
        timeout: 8000,
        enableHighAccuracy: false,
        maximumAge: 60000
      }
    );
  }, [isTa]);

  // Load real machinery from DB/Supabase with fallback to context/mock
  useEffect(() => {
    getMachinery().then((res) => {
      if (res.data && res.data.length > 0) {
        setDbMachinery(res.data);
      }
    });
  }, []);

  // Handle manual district selection fallback
  const handleManualDistrictChange = (presetId: string) => {
    setSelectedDistrictId(presetId);
    if (!presetId) {
      setUserCoords(null);
      setLocationSource('denied');
      return;
    }
    const preset = TAMIL_NADU_DISTRICTS.find((p) => p.id === presetId);
    if (preset) {
      setUserCoords({
        latitude: preset.latitude,
        longitude: preset.longitude
      });
      setLocationSource('manual');
      setLocationErrorMsg(null);
    }
  };

  // Re-request GPS
  const handleRequestGps = () => {
    if (!navigator.geolocation) return;
    setLocationSource('prompting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setLocationSource('gps');
        setSelectedDistrictId('');
        setLocationErrorMsg(null);
      },
      (err) => {
        setLocationSource('denied');
        setLocationErrorMsg(err.message || 'GPS request failed');
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // 1. Unified Dataset: Combine all 4 real fleet records + all 10 demo driver profiles into ONE array
  const allMachinery = useMemo<Machinery[]>(() => {
    const rawReal = dbMachinery.length > 0 ? dbMachinery : contextMachinery;
    const realItems = rawReal.map((m) => ({
      ...m,
      isDemo: false
    }));

    const demoItems = DEMO_MACHINERY_DRIVERS.map((m) => ({
      ...m,
      isDemo: true
    }));

    // Deduplicate by ID
    const seen = new Set<string>();
    const unified: Machinery[] = [];
    for (const item of [...realItems, ...demoItems]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unified.push(item);
      }
    }
    return unified;
  }, [dbMachinery, contextMachinery]);

  // 2. Filter & Sort by Search, Machinery Type, and Location Radius
  const filteredMachinery = useMemo(() => {
    // Calculate distance for each item if userCoords is available
    const itemsWithDistance = allMachinery.map((m) => {
      let distanceKm: number | undefined = undefined;
      if (userCoords && m.latitude != null && m.longitude != null) {
        distanceKm = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          m.latitude,
          m.longitude
        ) ?? undefined;
      }
      return {
        ...m,
        distanceKm
      };
    });

    let results = itemsWithDistance.filter((m) => {
      const q = searchTerm.toLowerCase().trim();
      const name = m.name.toLowerCase();
      const desc = m.description.toLowerCase();
      const location = m.location.toLowerCase();
      const provider = (m.provider?.name || '').toLowerCase();
      const driver = (m.driver_name || '').toLowerCase();
      const service = (m.service_type || '').toLowerCase();

      const matchesSearch = 
        !q ||
        name.includes(q) || 
        desc.includes(q) || 
        location.includes(q) || 
        provider.includes(q) ||
        driver.includes(q) ||
        service.includes(q);

      const matchesType = 
        selectedType === 'All' 
          ? true 
          : selectedType === 'Other'
          ? m.type !== 'Tractor' && m.type !== 'Paddy Harvester' && m.type !== 'Power Tiller'
          : m.type === selectedType;

      // Filter by radius if origin coordinates are active and radius is not 'all'
      let matchesRadius = true;
      if (radiusKm !== 'all' && userCoords) {
        if (m.distanceKm !== undefined) {
          matchesRadius = m.distanceKm <= radiusKm;
        } else {
          matchesRadius = true; // Retain records with missing coordinates rather than excluding
        }
      }

      return matchesSearch && matchesType && matchesRadius;
    });

    // Sort by proximity when user location exists, with genuine enrolled providers prioritized on tie
    return results.sort((a, b) => {
      const distA = a.distanceKm !== undefined ? a.distanceKm : 999999;
      const distB = b.distanceKm !== undefined ? b.distanceKm : 999999;

      if (distA !== distB) {
        return distA - distB;
      }

      // Prioritize genuine enrolled providers over demo records
      if (a.isDemo !== b.isDemo) {
        return a.isDemo ? 1 : -1;
      }

      return a.name.localeCompare(b.name);
    });
  }, [allMachinery, searchTerm, selectedType, radiusKm, userCoords]);

  const activeBookingsCount = contextBookings.filter((b) => b.status === 'pending' || b.status === 'accepted').length;

  const handleBookClick = (machinery: Machinery) => {
    if (machinery.isDemo) {
      // Intercept demo profile booking attempt
      setSelectedDemoDriverForModal(machinery);
    } else {
      // Proceed with real booking form
      setSelectedMachineryForBooking(machinery);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('All');
    setRadiusKm(100);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Modern Page Header */}
      <PageHeader
        title={translations.machinery.title}
        subtitle={translations.machinery.subtitle}
        badge={isTa ? 'விவசாய இயந்திரங்கள் & வாடகை மையம்' : 'Farm Equipment & Machinery Hub'}
        icon={Tractor}
        iconColor="text-amber-700"
        iconBg="bg-amber-50 border-amber-200"
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/bookings"
              className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-2 shadow-xs"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{translations.nav.myBookings} ({activeBookingsCount})</span>
            </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Informative Guidance Banner */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 mb-6 flex items-start gap-3 text-amber-950 text-xs">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">{isTa ? 'ஒருங்கிணைந்த இயந்திர அட்டவணை: ' : 'Unified Machinery & Operator Hub: '}</span>
            <span>
              {isTa
                ? 'உண்மையான பதிவு செய்யப்பட்ட இயந்திரங்களையும், செயல்முறை விளக்கத்திற்கான மாதிரி ஓட்டுநர் சுயவிவரங்களையும் ஒரே பக்கத்தில் காணலாம். மாதிரி சுயவிவரங்கள் ஆரஞ்சு நிறக் குறியீட்டுடன் தெளிவாகக் குறிக்கப்பட்டுள்ளன.'
                : 'Browse all available machinery and operators in one unified directory. Fictional demonstration operator profiles are designated with clear "Demo Profile" badges for transparent evaluation.'}
            </span>
          </div>
        </div>

        {/* Location & Radius Discovery Panel (Default 100km, Geolocation + Manual District Fallback) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isTa ? 'இருப்பிட அடிப்படையிலான இயந்திரக் கண்டறிதல்' : 'Location-Based Machinery Discovery'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTa 
                    ? 'உங்கள் இருப்பிடத்திலிருந்து தேர்ந்தெடுக்கப்பட்ட சுற்றளவில் உள்ள இயந்திரங்களைக் கண்டறியலாம்.'
                    : 'Discover farm equipment and operators within your selected search radius.'}
                </p>
              </div>
            </div>

            {/* GPS Status Indicator & Manual Refresh */}
            <div className="flex items-center gap-2 flex-wrap">
              {locationSource === 'gps' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {isTa ? 'ஜிபிஎஸ் செயல்படுகிறது' : 'GPS Active'}
                </span>
              )}
              {locationSource === 'manual' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  <MapPin className="w-3 h-3 text-amber-700" />
                  {isTa ? 'கைமுறை மாவட்டம்' : 'Manual District'}
                </span>
              )}
              {locationSource === 'denied' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <AlertCircle className="w-3 h-3 text-slate-500" />
                  {isTa ? 'இருப்பிட அனுமதி இல்லை' : 'Location Not Set'}
                </span>
              )}

              <button
                type="button"
                onClick={handleRequestGps}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                title={isTa ? 'ஜிபிஎஸ் இருப்பிடத்தை மீண்டும் பெறுக' : 'Re-detect GPS location'}
              >
                <RefreshCw className="w-3 h-3" />
                <span>{isTa ? 'ஜிபிஎஸ்' : 'GPS'}</span>
              </button>
            </div>
          </div>

          {/* Location Controls: District Fallback & Search Radius */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            
            {/* Manual District Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isTa ? 'உங்கள் மாவட்டம் (கைமுறை தேர்வு):' : 'Your District (Manual Location Fallback):'}
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => handleManualDistrictChange(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-hidden transition-all"
              >
                <option value="">
                  {userCoords && locationSource === 'gps'
                    ? (isTa ? '✓ ஜிபிஎஸ் இருப்பிடம் கண்டறியப்பட்டது' : '✓ GPS Location Acquired')
                    : (isTa ? '-- தமிழ்நாட்டின் மாவட்டத்தைத் தேர்வு செய்யவும் --' : '-- Select a Tamil Nadu District --')}
                </option>
                {TAMIL_NADU_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {isTa ? d.nameTa : d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Radius Selector Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isTa ? 'தேடல் சுற்றளவு (கிலோமீட்டர்):' : 'Search Radius (Kilometres):'}
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[25, 50, 100, 200, 'all'].map((r) => {
                  const isSelected = radiusKm === r;
                  const label = r === 'all' 
                    ? (isTa ? 'தமிழ்நாடு முழுவதும்' : 'All Tamil Nadu') 
                    : `${r} km`;
                  return (
                    <button
                      key={String(r)}
                      type="button"
                      onClick={() => setRadiusKm(r as number | 'all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                      }`}
                    >
                      {label}
                      {r === 100 && (
                        <span className="ml-1 text-[9px] opacity-80">
                          ({isTa ? 'இயல்பு' : 'Default'})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Location Notice Message */}
          {locationErrorMsg && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locationErrorMsg}</span>
            </div>
          )}
        </div>

        {/* Search & Machinery Category Filter Section */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-96">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={translations.machinery.searchPlaceholder}
                size="md"
              />
            </div>

            {/* Category Tabs */}
            <div className="w-full md:w-auto">
              <CategoryTabs
                tabs={[
                  { id: 'All', label: isTa ? 'அனைத்தும்' : 'All', count: allMachinery.length, icon: '🚜' },
                  { id: 'Tractor', label: isTa ? 'டிராக்டர்' : 'Tractors', count: allMachinery.filter(m => m.type === 'Tractor').length, icon: '🚜' },
                  { id: 'Paddy Harvester', label: isTa ? 'அறுவடை இயந்திரம்' : 'Harvesters', count: allMachinery.filter(m => m.type === 'Paddy Harvester').length, icon: '🌾' },
                  { id: 'Power Tiller', label: isTa ? 'பவர் டில்லர்' : 'Tillers', count: allMachinery.filter(m => m.type === 'Power Tiller').length, icon: '⚙️' },
                  { id: 'Other', label: isTa ? 'பிற உபகரணங்கள்' : 'Other', count: allMachinery.filter(m => m.type !== 'Tractor' && m.type !== 'Paddy Harvester' && m.type !== 'Power Tiller').length, icon: '🛠️' },
                ]}
                activeTab={selectedType}
                onChange={setSelectedType}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Unified Listing Header Summary */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>{isTa ? 'கிடைக்கும் இயந்திரங்கள் மற்றும் ஓட்டுநர்கள்' : 'Available Machinery & Operators'}</span>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              {filteredMachinery.length} {isTa ? 'பதிவுகள்' : 'Options'}
            </span>
          </h2>
          <span className="text-xs text-slate-500">
            {radiusKm === 'all' || !userCoords
              ? (isTa ? 'அனைத்து இடங்களும்' : 'Statewide Results')
              : (isTa ? `${radiusKm} கி.மீ சுற்றளவில்` : `Within ${radiusKm} km radius`)}
          </span>
        </div>

        {/* Unified Listing Grid (All 14 Units Rendered Together) */}
        {filteredMachinery.length === 0 ? (
          <EmptyState
            title={translations.machinery.noMachineryFound}
            description={translations.machinery.noMachineryDescription}
            actionLabel={translations.common.clearFilters}
            onAction={handleClearFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMachinery.map((item) => (
              <MachineryCard
                key={item.id}
                machinery={item}
                onBook={handleBookClick}
              />
            ))}
          </div>
        )}

      </div>

      {/* Real Machinery Booking Form Modal */}
      {selectedMachineryForBooking && (
        <MachineryBookingForm
          machinery={selectedMachineryForBooking}
          onClose={() => setSelectedMachineryForBooking(null)}
        />
      )}

      {/* Demonstration Driver Booking Intercept Modal */}
      {selectedDemoDriverForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isTa ? 'மாதிரி சுயவிவர வரம்பு' : 'Demonstration Data Notice'}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDemoDriverForModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {selectedDemoDriverForModal.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {selectedDemoDriverForModal.location} • ₹{selectedDemoDriverForModal.price_per_hour}/hr
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{isTa ? 'உண்மையான முன்பதிவு செய்ய முடியாது' : 'Fictional Operator Profile'}</span>
              </div>
              <p>
                {isTa
                  ? 'இது ஒரு மாதிரி ஓட்டுநர் விவரம் மட்டுமே. உண்மையான நபர்களின் தொடர்பு எண் அல்லது இருப்பிடம் இதில் இல்லை. மாதிரி விவரங்களுக்கு உண்மையான முன்பதிவுகள் உருவாக்கப்படாது மற்றும் எந்த நபரும் தொடர்பு கொள்ளப்பட மாட்டார்.'
                  : 'This profile is an illustrative demonstration record created to showcase AgriME driver hiring workflows. Fictional drivers cannot accept real-world service bookings, and no real individuals are contacted.'}
              </p>
              <p className="font-semibold text-slate-700 pt-1">
                {isTa
                  ? 'உண்மையான விவசாய இயந்திரங்களை முன்பதிவு செய்ய, மாதிரி குறியீடு இல்லாத அங்கீகரிக்கப்பட்ட உபகரணங்களைத் தேர்ந்தெடுக்கவும்.'
                  : 'To book real tractors or harvesters with active service providers, please choose listings without the Demo Profile badge.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDemoDriverForModal(null)}
                className="btn-primary text-xs py-2 px-4"
              >
                {translations.common.close}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
