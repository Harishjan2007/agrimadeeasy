'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sprout, 
  Search, 
  MapPin, 
  Calendar, 
  Scale, 
  Plus, 
  Inbox, 
  Send, 
  User, 
  CheckCircle2, 
  Info, 
  Edit3, 
  AlertCircle,
  Filter,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { 
  FarmerProduceListing, 
  ProduceRequest, 
  ProduceRequestStatus 
} from '@/types';
import { 
  fetchProduceListings, 
  fetchFarmerRequests, 
  fetchBuyerRequests,
  updateProduceListing,
  deleteProduceListing,
  updateProduceRequestStatus
} from '@/lib/supabase/farmer-produce';
import { useAuth } from '@/lib/supabase/useAuth';
import { useAgri } from '@/context/AgriContext';
import { useLanguage } from '@/i18n';
import { getCropIcon } from '@/lib/supabase/crops';

import CreateProduceListingModal from './CreateProduceListingModal';
import SendProduceRequestModal from './SendProduceRequestModal';
import MyProduceListingsModal from './MyProduceListingsModal';
import ProduceRequestsModal from './ProduceRequestsModal';

const CATEGORIES = ['All', 'Cereals', 'Oilseeds', 'Vegetables', 'Fiber', 'Commercial', 'Spices', 'Other'];

export default function FarmerMarketplace() {
  const { language, translations, translateCrop, translateCategory } = useLanguage();
  const isTa = language === 'ta';
  const t = translations.farmerMarketplace;

  const { user: authUser, profile: authProfile } = useAuth();
  const { 
    currentUser, 
    produceListings: contextListings,
    produceRequests: contextRequests,
    addProduceListing: addContextListing,
    updateProduceListingInContext,
    deleteProduceListingInContext,
    addProduceRequest: addContextRequest,
    updateProduceRequestStatusInContext
  } = useAgri();

  // Determine current active user ID (Supabase auth user takes precedence, otherwise fallback to AgriContext user)
  const effectiveUserId = authUser?.id || currentUser?.id || 'demo-farmer-1';
  const effectiveUserName = authProfile?.full_name || currentUser?.full_name || (isTa ? 'விவசாயி' : 'Farmer');
  const effectiveUserPhone = authProfile?.phone || currentUser?.phone || '';
  const effectiveUserLocation = authProfile?.location || currentUser?.location || 'Thanjavur, Tamil Nadu';

  // Listings & Requests State
  const [listings, setListings] = useState<FarmerProduceListing[]>([]);
  const [requests, setRequests] = useState<ProduceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingListing, setEditingListing] = useState<FarmerProduceListing | null>(null);
  const [requestingListing, setRequestingListing] = useState<FarmerProduceListing | null>(null);
  const [showMyListingsModal, setShowMyListingsModal] = useState<boolean>(false);
  const [showRequestsModal, setShowRequestsModal] = useState<boolean>(false);
  const [requestsDefaultTab, setRequestsDefaultTab] = useState<'incoming' | 'sent'>('incoming');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'qty_desc'>('newest');

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;

    async function loadMarketplaceData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch from Supabase
        const supabaseListings = await fetchProduceListings({ status: 'active' });

        if (isMounted) {
          if (supabaseListings && supabaseListings.length > 0) {
            setListings(supabaseListings);
          } else if (contextListings && contextListings.length > 0) {
            // Context fallback
            setListings(contextListings);
          } else {
            setListings([]);
          }
        }

        // Fetch requests for current user
        if (effectiveUserId) {
          const [incoming, sent] = await Promise.all([
            fetchFarmerRequests(effectiveUserId).catch(() => []),
            fetchBuyerRequests(effectiveUserId).catch(() => [])
          ]);

          if (isMounted) {
            const combinedSupabaseRequests = [...incoming, ...sent];
            if (combinedSupabaseRequests.length > 0) {
              setRequests(combinedSupabaseRequests);
            } else if (contextRequests && contextRequests.length > 0) {
              setRequests(contextRequests);
            }
          }
        }
      } catch (err: any) {
        console.warn('Could not fetch from Supabase, utilizing local state:', err);
        if (isMounted) {
          setListings(contextListings || []);
          setRequests(contextRequests || []);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMarketplaceData();

    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  // Keep state synced with context if context changes
  useEffect(() => {
    if (contextListings && contextListings.length > 0 && listings.length === 0) {
      setListings(contextListings);
    }
  }, [contextListings]);

  useEffect(() => {
    if (contextRequests && contextRequests.length > 0 && requests.length === 0) {
      setRequests(contextRequests);
    }
  }, [contextRequests]);

  // Distinct locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    listings.forEach((l) => {
      if (l.location) locs.add(l.location.trim());
    });
    return Array.from(locs).sort();
  }, [listings]);

  // Filtered & Sorted Listings
  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // Only active listings in general feed
        if (item.status !== 'active') return false;

        // Search match (crop name, category, location, description)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCrop = item.crop_name.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchLoc = item.location.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q) || false;
          if (!matchCrop && !matchCat && !matchLoc && !matchDesc) return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        // Location filter
        if (selectedLocation !== 'All' && item.location !== selectedLocation) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'price_asc') {
          return a.asking_price - b.asking_price;
        }
        if (sortBy === 'price_desc') {
          return b.asking_price - a.asking_price;
        }
        if (sortBy === 'qty_desc') {
          return b.quantity - a.quantity;
        }
        return 0;
      });
  }, [listings, searchQuery, selectedCategory, selectedLocation, sortBy]);

  // Counts for action bar
  const myListingsCount = useMemo(() => {
    return listings.filter((l) => l.farmer_id === effectiveUserId).length;
  }, [listings, effectiveUserId]);

  const incomingRequests = useMemo(() => {
    return requests.filter((r) => r.listing?.farmer_id === effectiveUserId);
  }, [requests, effectiveUserId]);

  const pendingIncomingCount = useMemo(() => {
    return incomingRequests.filter((r) => r.status === 'pending').length;
  }, [incomingRequests]);

  const sentRequests = useMemo(() => {
    return requests.filter((r) => r.buyer_id === effectiveUserId);
  }, [requests, effectiveUserId]);

  // Handlers
  const handleListingCreated = (newListing: FarmerProduceListing) => {
    setListings((prev) => [newListing, ...prev.filter((l) => l.id !== newListing.id)]);
    addContextListing(newListing);
    setShowCreateModal(false);
    setEditingListing(null);
  };

  const handleListingUpdated = (updatedListing: FarmerProduceListing) => {
    setListings((prev) =>
      prev.map((l) => (l.id === updatedListing.id ? updatedListing : l))
    );
    updateProduceListingInContext(updatedListing.id, updatedListing);
    setEditingListing(null);
  };

  const handleListingDeleted = async (listingId: string) => {
    try {
      await deleteProduceListing(listingId);
    } catch (err) {
      console.warn('Supabase delete error, fallback to context:', err);
    }
    setListings((prev) => prev.filter((l) => l.id !== listingId));
    deleteProduceListingInContext(listingId);
  };

  const handleRequestCreated = (newRequest: ProduceRequest) => {
    setRequests((prev) => [newRequest, ...prev.filter((r) => r.id !== newRequest.id)]);
    addContextRequest(newRequest);
    setRequestingListing(null);
  };

  const handleRequestStatusUpdated = async (requestId: string, newStatus: ProduceRequestStatus) => {
    try {
      await updateProduceRequestStatus(requestId, newStatus);
    } catch (err) {
      console.warn('Supabase request update error, fallback to context:', err);
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    );
    updateProduceRequestStatusInContext(requestId, newStatus);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero & Action Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isTa ? 'நேரடி விவசாய விளைபொருள் சந்தை' : 'Direct Farmer-to-Buyer Marketplace'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t.title}
            </h2>

            <p className="text-sm text-emerald-100/90 leading-relaxed">
              {t.subtitle}
            </p>

            <div className="flex items-start gap-2 pt-1 text-xs text-emerald-200/80 bg-black/15 p-3 rounded-2xl border border-white/10">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
              <span>{t.notice}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center shrink-0">
            {/* Sell Your Produce CTA */}
            <button
              type="button"
              onClick={() => {
                setEditingListing(null);
                setShowCreateModal(true);
              }}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.sellProduce}</span>
            </button>

            {/* My Listings Button */}
            <button
              type="button"
              onClick={() => setShowMyListingsModal(true)}
              className="px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/20 active:bg-white/25 backdrop-blur-md border border-white/20 text-white font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <Sprout className="w-4 h-4 text-emerald-300" />
              <span>{t.myListings}</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 font-bold">
                {myListingsCount}
              </span>
            </button>

            {/* Incoming Requests Button */}
            <button
              type="button"
              onClick={() => {
                setRequestsDefaultTab('incoming');
                setShowRequestsModal(true);
              }}
              className="relative px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/20 active:bg-white/25 backdrop-blur-md border border-white/20 text-white font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <Inbox className="w-4 h-4 text-emerald-300" />
              <span>{t.incomingRequests}</span>
              {pendingIncomingCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-400 text-slate-950 font-black animate-pulse">
                  {pendingIncomingCount}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 font-bold">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            {/* Sent Requests Button */}
            <button
              type="button"
              onClick={() => {
                setRequestsDefaultTab('sent');
                setShowRequestsModal(true);
              }}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 backdrop-blur-md border border-white/15 text-white font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <Send className="w-4 h-4 text-emerald-300" />
              <span>{t.sentRequests}</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 font-bold">
                {sentRequests.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Bar */}
          <div className="relative md:col-span-6">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Location Filter */}
          <div className="relative md:col-span-3">
            <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              <option value="All">{t.allLocations}</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="relative md:col-span-3">
            <ArrowUpDown className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              <option value="newest">{isTa ? 'சமீபத்தியவை' : 'Newest First'}</option>
              <option value="price_asc">{isTa ? 'விலை: குறைவு முதல் அதிகம்' : 'Price: Low to High'}</option>
              <option value="price_desc">{isTa ? 'விலை: அதிகம் முதல் குறைவு' : 'Price: High to Low'}</option>
              <option value="qty_desc">{isTa ? 'அளவு: அதிகம் முதல் குறைவு' : 'Quantity: High to Low'}</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>{isTa ? 'பிரிவு:' : 'Category:'}</span>
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'All' ? (isTa ? 'அனைத்தும்' : 'All') : translateCategory(cat as any)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Produce Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center space-y-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-4xl shadow-inner">
            🌾
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.noListings}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {searchQuery || selectedCategory !== 'All' || selectedLocation !== 'All'
                ? (isTa
                    ? 'உங்கள் தேடலுக்கு ஏற்ற முடிவுகள் கிடைக்கவில்லை. வடிகட்டிகளை மாற்றி முயற்சிக்கவும்.'
                    : 'No listings matched your active filters. Try clearing your search or category selection.')
                : (isTa
                    ? 'இப்போது சந்தையில் எந்த விளைபொருளும் பட்டியலிடப்படவில்லை. உங்கள் விளைபொருளை முதலில் பட்டியலிடுங்கள்!'
                    : 'There are currently no produce listings in the marketplace. Be the first farmer to list your harvest!')}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {searchQuery || selectedCategory !== 'All' || selectedLocation !== 'All' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedLocation('All');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isTa ? 'வடிகட்டிகளை மீட்டமை' : 'Reset Filters'}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setEditingListing(null);
                setShowCreateModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.sellProduce}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Listing Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const isOwner = listing.farmer_id === effectiveUserId;

            return (
              <div
                key={listing.id}
                className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Card Top / Header */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/80 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                        {getCropIcon(listing.crop_name)}
                      </div>
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-1">
                          {translateCategory(listing.category as any)}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                          {translateCrop(listing.crop_name)}
                        </h3>
                      </div>
                    </div>

                    {isOwner ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                        {isTa ? 'உங்கள் பட்டியல்' : 'Your Listing'}
                      </span>
                    ) : null}
                  </div>

                  {/* ASKING PRICE DISPLAY - Core Requirement */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                        {t.askingPrice}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                          ₹{listing.asking_price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {listing.price_unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
                        {t.availableQuantity}
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {listing.quantity} {listing.unit}
                      </span>
                    </div>
                  </div>

                  {/* Key Details: Location, Date, Farmer */}
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{listing.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {isTa ? 'கிடைக்கும் நாள்: ' : 'Available from: '}
                        <strong>{new Date(listing.available_date).toLocaleDateString()}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {isTa ? 'விவசாயி: ' : 'Farmer: '}
                        <strong>{listing.farmer?.name || listing.farmer?.full_name || (isTa ? 'சரிபார்க்கப்பட்ட விவசாயி' : 'Verified Farmer')}</strong>
                      </span>
                    </div>

                    {listing.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        "{listing.description}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer / Action */}
                <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingListing(listing);
                        setShowCreateModal(true);
                      }}
                      className="w-full py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t.editListing}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRequestingListing(listing)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all transform group-hover:scale-[1.01]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t.sendRequest}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Produce Listing Modal */}
      {showCreateModal && (
        <CreateProduceListingModal
          farmerId={effectiveUserId}
          farmerLocation={effectiveUserLocation}
          initialListing={editingListing}
          onClose={() => {
            setShowCreateModal(false);
            setEditingListing(null);
          }}
          onSuccess={(saved) => {
            if (editingListing) {
              handleListingUpdated(saved);
            } else {
              handleListingCreated(saved);
            }
          }}
        />
      )}

      {/* Send Purchase Request Modal */}
      {requestingListing && (
        <SendProduceRequestModal
          listing={requestingListing}
          buyerId={effectiveUserId}
          buyerName={effectiveUserName}
          buyerPhone={effectiveUserPhone}
          onClose={() => setRequestingListing(null)}
          onSuccess={handleRequestCreated}
        />
      )}

      {/* My Produce Listings Modal */}
      {showMyListingsModal && (
        <MyProduceListingsModal
          listings={listings}
          farmerId={effectiveUserId}
          onClose={() => setShowMyListingsModal(false)}
          onEdit={(item) => {
            setShowMyListingsModal(false);
            setEditingListing(item);
            setShowCreateModal(true);
          }}
          onDelete={handleListingDeleted}
          onAddNew={() => {
            setShowMyListingsModal(false);
            setEditingListing(null);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* Produce Requests Modal (Incoming & Sent) */}
      {showRequestsModal && (
        <ProduceRequestsModal
          currentUserId={effectiveUserId}
          requests={requests}
          defaultTab={requestsDefaultTab}
          onClose={() => setShowRequestsModal(false)}
          onUpdateStatus={handleRequestStatusUpdated}
        />
      )}
    </div>
  );
}
