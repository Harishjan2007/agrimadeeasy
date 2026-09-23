'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Wheat,
  Tractor,
  Store,
  MapPin,
  Landmark,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Sprout,
  ShoppingBag
} from 'lucide-react';
import { useAgri } from '@/context/AgriContext';
import { useLanguage } from '@/i18n';
import { fetchProduceListings } from '@/lib/supabase/farmer-produce';
import { FarmerProduceListing } from '@/types';

interface SearchResultItem {
  id: string;
  type: 'crop' | 'machinery' | 'dealer' | 'market' | 'scheme' | 'listing' | 'product';
  title: string;
  subtitle?: string;
  badge: string;
  href: string;
  icon: any;
  iconBg: string;
  priceTag?: string;
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

export default function GlobalSearch({
  placeholder,
  className = ''
}: GlobalSearchProps) {
  const { crops, machinery, dealers, markets, schemes, cropPrices, products } = useAgri();
  const { language, translations, translateCrop, translateMachineryType } = useLanguage();
  const isTa = language === 'ta';

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [listings, setListings] = useState<FarmerProduceListing[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch produce listings for search indexing
  useEffect(() => {
    let isMounted = true;
    fetchProduceListings({ status: 'active' })
      .then((data) => {
        if (isMounted && data) {
          setListings(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute multi-domain search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const matched: SearchResultItem[] = [];

    // 1. Crops & Crop Prices
    crops.forEach((crop) => {
      const name = crop.name.toLowerCase();
      const taName = translateCrop(crop.name).toLowerCase();
      if (name.includes(q) || taName.includes(q)) {
        const latestPrice = cropPrices.find((p) => p.crop_id === crop.id);
        matched.push({
          id: `crop-${crop.id}`,
          type: 'crop',
          title: translateCrop(crop.name),
          subtitle: crop.category,
          badge: isTa ? 'பயிர் விலை' : 'Crop Price',
          href: `/crop-price?crop=${crop.id}`,
          icon: Wheat,
          iconBg: 'bg-emerald-100 text-emerald-800',
          priceTag: latestPrice ? `₹${Number(latestPrice.price).toLocaleString('en-IN')}` : undefined
        });
      }
    });

    // 2. Machinery
    machinery.forEach((m) => {
      const name = m.name.toLowerCase();
      const type = m.type.toLowerCase();
      const loc = m.location.toLowerCase();
      if (name.includes(q) || type.includes(q) || loc.includes(q)) {
        matched.push({
          id: `machinery-${m.id}`,
          type: 'machinery',
          title: m.name,
          subtitle: `${m.location} • ${translateMachineryType(m.type)}`,
          badge: isTa ? 'இயந்திரம்' : 'Machinery',
          href: `/machinery?id=${m.id}`,
          icon: Tractor,
          iconBg: 'bg-amber-100 text-amber-800',
          priceTag: `₹${m.price_per_hour}/${isTa ? 'மணி' : 'hr'}`
        });
      }
    });

    // 3. Dealers
    dealers.forEach((d) => {
      const name = d.shop_name.toLowerCase();
      const addr = d.address.toLowerCase();
      if (name.includes(q) || addr.includes(q)) {
        matched.push({
          id: `dealer-${d.id}`,
          type: 'dealer',
          title: d.shop_name,
          subtitle: d.address,
          badge: isTa ? 'வியாபாரி' : 'Agri Dealer',
          href: `/dealers?id=${d.id}`,
          icon: Store,
          iconBg: 'bg-blue-100 text-blue-800'
        });
      }
    });

    // 4. Markets
    markets.forEach((m) => {
      const name = m.name.toLowerCase();
      const loc = m.location.toLowerCase();
      if (name.includes(q) || loc.includes(q)) {
        matched.push({
          id: `market-${m.id}`,
          type: 'market',
          title: m.name,
          subtitle: m.location,
          badge: isTa ? 'மண்டி' : 'APMC Mandi',
          href: `/map?category=markets&id=${m.id}`,
          icon: MapPin,
          iconBg: 'bg-purple-100 text-purple-800'
        });
      }
    });

    // 5. Schemes
    schemes.forEach((s) => {
      const name = s.name.toLowerCase();
      const cat = s.category.toLowerCase();
      if (name.includes(q) || cat.includes(q)) {
        matched.push({
          id: `scheme-${s.id}`,
          type: 'scheme',
          title: s.name,
          subtitle: s.benefits,
          badge: isTa ? 'மானியம்' : 'Govt Scheme',
          href: `/schemes?id=${s.id}`,
          icon: Landmark,
          iconBg: 'bg-slate-100 text-slate-800'
        });
      }
    });

    // 6. Farmer Produce Listings
    listings.forEach((listing) => {
      const crop = listing.crop_name.toLowerCase();
      const loc = listing.location.toLowerCase();
      if (crop.includes(q) || loc.includes(q)) {
        matched.push({
          id: `listing-${listing.id}`,
          type: 'listing',
          title: listing.crop_name,
          subtitle: `${listing.quantity} ${listing.unit} • ${listing.location}`,
          badge: isTa ? 'விவசாயி விற்பனை' : 'Farmer Produce',
          href: `/ecommerce?tab=marketplace&listing=${listing.id}`,
          icon: Sprout,
          iconBg: 'bg-emerald-100 text-emerald-800',
          priceTag: `₹${listing.asking_price}/${listing.price_unit}`
        });
      }
    });

    // 7. Farm Store Products
    products.forEach((prod) => {
      const name = prod.name.toLowerCase();
      const cat = prod.category.toLowerCase();
      if (name.includes(q) || cat.includes(q)) {
        matched.push({
          id: `product-${prod.id}`,
          type: 'product',
          title: prod.name,
          subtitle: prod.category,
          badge: isTa ? 'பண்ணை அங்காடி' : 'Farm Store',
          href: `/ecommerce?tab=store&product=${prod.id}`,
          icon: ShoppingBag,
          iconBg: 'bg-teal-100 text-teal-800',
          priceTag: `₹${prod.price}`
        });
      }
    });

    return matched.slice(0, 10); // Max 10 high relevance matches across all categories
  }, [query, crops, cropPrices, machinery, dealers, markets, schemes, listings, products, isTa, translateCrop, translateMachineryType]);

  return (
    <div ref={containerRef} className={`relative w-full max-w-2xl mx-auto ${className}`}>
      {/* Input Box */}
      <div className="relative flex items-center">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={
            placeholder ||
            (isTa
              ? 'பயிர்கள், டிராக்டர்கள், வியாபாரிகள், விளைபொருட்களைத் தேடுங்கள்...'
              : 'Search crops, tractors, dealers, mandis, schemes, produce...')
          }
          className="w-full bg-white hover:bg-slate-50/50 focus:bg-white pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl border border-slate-300/80 shadow-md text-slate-900 text-sm sm:text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          aria-label="Global Search"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3.5 text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown Overlay */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>
              {results.length} {isTa ? 'முடிவுகள் கண்டறியப்பட்டன' : 'Results Found'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isTa ? 'வகை வாரியாக' : 'Categorized Discovery'}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700 text-sm">
                {isTa ? 'முடிவுகள் எதுவும் இல்லை' : 'No matches found'}
              </p>
              <p>
                {isTa
                  ? 'நெல், டிராக்டர், மானியம் அல்லது வியாபாரி பெயரைத் தேட முயற்சிக்கவும்.'
                  : 'Try searching for Paddy, Tractor, Harvester, PM-Kisan, or Mandi.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {results.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}
                      >
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate group-hover:text-agri-700 transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 shrink-0">
                            {item.badge}
                          </span>
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-sm">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.priceTag && (
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                          {item.priceTag}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
