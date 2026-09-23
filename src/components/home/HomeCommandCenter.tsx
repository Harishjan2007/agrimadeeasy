'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Wheat,
  Tractor,
  Store,
  MapPin,
  Landmark,
  TrendingUp,
  BarChart3,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Phone,
  Navigation,
  CheckCircle2,
  Clock,
  Compass
} from 'lucide-react';
import { useAgri } from '@/context/AgriContext';
import { useLanguage } from '@/i18n';
import GlobalSearch from '@/components/home/GlobalSearch';
import { SectionHeader } from '@/components/ui';
import { calculateDistanceKm, formatDistance } from '@/lib/location';
import { getMachineryImageUrl, getMachineryAltText } from '@/lib/machinery-images';

export default function HomeCommandCenter() {
  const { crops, cropPrices, machinery, dealers, markets, schemes } = useAgri();
  const { language, translations, translateCrop, translateMachineryType, translateCategory } = useLanguage();
  const isTa = language === 'ta';

  // Dynamic Time Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return isTa ? 'இனிய காலை வணக்கம் 👋' : 'Good Morning 👋';
    if (hour < 17) return isTa ? 'இனிய மதிய வணக்கம் 👋' : 'Good Afternoon 👋';
    return isTa ? 'இனிய மாலை வணக்கம் 👋' : 'Good Evening 👋';
  }, [isTa]);

  // Quick Services Grid configuration
  const quickServices = [
    {
      id: 'crop-prices',
      title: translations.nav.cropPrices,
      subtitle: isTa ? 'மண்டி விலைகள்' : 'Mandi Rates',
      href: '/crop-price',
      icon: TrendingUp,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80 hover:border-emerald-400'
    },
    {
      id: 'predictions',
      title: translations.nav.predictions,
      subtitle: isTa ? 'விலை முன்னறிவிப்பு' : 'Market Trends',
      href: '/prediction',
      icon: BarChart3,
      color: 'text-blue-700 bg-blue-50 border-blue-200/80 hover:border-blue-400'
    },
    {
      id: 'machinery',
      title: translations.nav.machinery,
      subtitle: isTa ? 'டிராக்டர் வாடகை' : 'Rent Equipment',
      href: '/machinery',
      icon: Tractor,
      color: 'text-amber-700 bg-amber-50 border-amber-200/80 hover:border-amber-400'
    },
    {
      id: 'nearby-map',
      title: translations.nav.map || (isTa ? 'விவசாய வரைபடம்' : 'Agri Map'),
      subtitle: isTa ? 'அருகிலுள்ளவை' : 'Nearby Discovery',
      href: '/map',
      icon: Compass,
      color: 'text-emerald-800 bg-emerald-100/60 border-emerald-300 hover:border-emerald-500'
    },
    {
      id: 'marketplace',
      title: isTa ? 'விளைச்சல் சந்தை' : 'Sell Produce',
      subtitle: isTa ? 'நேரடி விற்பனை' : 'Farmer Marketplace',
      href: '/ecommerce?tab=produce',
      icon: Wheat,
      color: 'text-orange-700 bg-orange-50 border-orange-200/80 hover:border-orange-400'
    },
    {
      id: 'schemes',
      title: translations.nav.schemes,
      subtitle: isTa ? 'அரசு மானியங்கள்' : 'Govt Subsidies',
      href: '/schemes',
      icon: Landmark,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200/80 hover:border-indigo-400'
    },
    {
      id: 'dealers',
      title: translations.nav.dealers,
      subtitle: isTa ? 'அங்கீகரிக்கப்பட்டவர்கள்' : 'Direct Buyers',
      href: '/dealers',
      icon: Store,
      color: 'text-teal-700 bg-teal-50 border-teal-200/80 hover:border-teal-400'
    },
    {
      id: 'store',
      title: translations.nav.ecommerce,
      subtitle: isTa ? 'விதை & உரம்' : 'Seeds & Inputs',
      href: '/ecommerce',
      icon: ShoppingBag,
      color: 'text-purple-700 bg-purple-50 border-purple-200/80 hover:border-purple-400'
    }
  ];

  // Top Crop Prices for Preview (First 3-4)
  const topPrices = useMemo(() => {
    return cropPrices.slice(0, 4);
  }, [cropPrices]);

  // Top Machinery for Preview (Available ones first)
  const topMachinery = useMemo(() => {
    return machinery.slice(0, 3);
  }, [machinery]);

  // Top Schemes for Preview
  const topSchemes = useMemo(() => {
    return schemes.slice(0, 3);
  }, [schemes]);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Hero Command Center Area */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 border-b border-slate-200/80 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            {greeting}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {isTa ? 'இன்று உங்களுக்கு என்ன சேவை தேவை?' : 'How can AgriME help you today?'}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            {isTa
              ? 'மண்டி பயிர் விலைகள், வாடகை இயந்திரங்கள், அரசு மானியங்கள் மற்றும் உள்ளூர் வியாபாரிகளை உடனடியாகக் கண்டறியவும்.'
              : 'Find Mandi crop rates, rent farm machinery, discover govt schemes, and connect with direct buyers.'}
          </p>

          {/* Prominent Global Search Bar */}
          <div className="pt-2">
            <GlobalSearch />
          </div>

          {/* Quick Categories Bar (8 visual cards) */}
          <div className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3 text-left">
              {quickServices.map((service) => {
                const IconComponent = service.icon;
                return (
                  <Link
                    key={service.id}
                    href={service.href}
                    className={`p-3 rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-xs group flex flex-col justify-between ${service.color}`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs leading-tight text-slate-900">
                        {service.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate font-medium">
                        {service.subtitle}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Contextual Sections Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Section 1: Nearby Agricultural Discovery Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <Compass className="w-3.5 h-3.5" />
                {isTa ? 'இடம் சார்ந்த விவசாய வரைபடம்' : 'Location-Based Agricultural Map'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black">
                {isTa
                  ? 'உங்கள் பகுதியில் உள்ள டிராக்டர்கள் & வியாபாரிகளை வரைபடத்தில் காண்க'
                  : 'Discover Nearby Tractors, Harvesters & Mandis on Map'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isTa
                  ? 'நிகழ்நேர தூரம் மற்றும் வழிசெலுத்தலுடன் காட்பாடி, வேலூர், மற்றும் தமிழக மாவட்டங்களில் உள்ள விவசாய சேவைகளைக் கண்டறியவும்.'
                  : 'Locate heavy farm machinery, direct grain buyers, and regulated mandis with real-time distance and turn-by-turn navigation.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/map"
                className="px-5 py-3 rounded-xl font-extrabold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all inline-flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>{isTa ? 'வரைபடத்தைத் திறக்கவும்' : 'Open Interactive Map'}</span>
              </Link>
              <Link
                href="/dealers"
                className="px-4 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all inline-flex items-center gap-1.5"
              >
                <Store className="w-4 h-4" />
                <span>{translations.nav.dealers}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: Crop Prices Quick Decision Support */}
        <section>
          <SectionHeader
            title={translations.nav.cropPrices}
            subtitle={
              isTa
                ? 'வேலூர் மற்றும் தமிழக மண்டிகளின் இன்றைய கொள்முதல் மற்றும் மாதிரி விலைகள்.'
                : 'Today’s reference commodity rates across Vellore and Tamil Nadu APMC mandis.'
            }
            icon="🌾"
            actionHref="/crop-price"
            actionLabel={isTa ? 'அனைத்து விலைகளையும் காண்க' : 'View All Mandi Prices'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topPrices.map((item) => {
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-card hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{item.crop?.icon || '🌾'}</span>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            {translateCrop(item.crop?.name)}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {translateCategory(item.crop?.category)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 my-2.5">
                      <span className="text-[10px] font-medium text-slate-500 block">
                        {translations.cropPrices.currentRate}
                      </span>
                      <div className="text-xl font-black text-slate-900 mt-0.5">
                        ₹{Number(item.price).toLocaleString('en-IN')}
                        <span className="text-xs font-semibold text-slate-500 ml-1">
                          /{item.unit?.includes('/') ? item.unit.split('/')[1] : item.unit || 'Q'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.market?.name || 'Local Mandi'}</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/crop-price?crop=${item.crop_id}`}
                      className="text-xs font-bold text-agri-700 hover:text-agri-800 transition-colors inline-flex items-center gap-1"
                    >
                      <span>{isTa ? 'ஒப்பீடு' : 'Compare'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/map?category=markets&id=${item.market_id}`}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      {isTa ? 'வரைபடம்' : 'Map'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Available Machinery Rentals */}
        <section>
          <SectionHeader
            title={translations.nav.machinery}
            subtitle={
              isTa
                ? 'உழவு, நிலம் சமன்படுத்துதல் மற்றும் நெல் அறுவடைக்கு தேவையான இயந்திரங்கள்.'
                : 'Tractors, combine harvesters, and tillers available for hourly farm hire.'
            }
            icon="🚜"
            actionHref="/machinery"
            actionLabel={isTa ? 'அனைத்து இயந்திரங்களையும் காண்க' : 'View All Machinery'}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topMachinery.map((machine) => {
              const imageUrl = getMachineryImageUrl(machine);
              const altText = getMachineryAltText(machine);

              return (
                <div
                  key={machine.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-card hover:border-amber-300 transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={altText}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white/95 text-slate-800 border border-slate-200 shadow-2xs">
                        {translateMachineryType(machine.type)}
                      </span>
                      <span
                        className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          machine.available
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        {machine.available
                          ? (isTa ? 'கிடைக்கும்' : 'Available')
                          : (isTa ? 'முன்பதிவு செய்யப்பட்டுள்ளது' : 'Busy')}
                      </span>
                    </div>

                    <div className="p-4 space-y-1">
                      <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1">
                        {machine.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {machine.description}
                      </p>
                      <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{machine.location}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {translations.machinery.rentalRate}
                      </span>
                      <span className="text-base font-black text-slate-900">
                        ₹{machine.price_per_hour.toLocaleString('en-IN')}
                        <span className="text-[11px] font-semibold text-slate-500">
                          /{isTa ? 'மணி' : 'hr'}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/map?category=machinery&id=${machine.id}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                        title={translations.map?.viewOnMap || 'View on Map'}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/machinery?id=${machine.id}`}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                      >
                        {isTa ? 'வாடகைக்கு எடு' : 'Book Now'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: Government Schemes Discovery */}
        <section>
          <SectionHeader
            title={translations.nav.schemes}
            subtitle={
              isTa
                ? 'விவசாயிகளுக்கான மத்திய மற்றும் தமிழ்நாடு அரசு நலத்திட்டங்கள் மற்றும் மானிய வழிகாட்டிகள்.'
                : 'Verified Central & Tamil Nadu agricultural subsidies, PM-Kisan, and crop insurance.'
            }
            icon="📋"
            actionHref="/schemes"
            actionLabel={isTa ? 'அனைத்து திட்டங்களையும் காண்க' : 'Browse All Schemes'}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        scheme.government_level === 'central'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {scheme.government_level === 'central'
                        ? (isTa ? 'மத்திய அரசு' : 'Central Govt')
                        : (isTa ? 'மாநில அரசு' : 'State Govt')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {scheme.category}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                    {scheme.name}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {scheme.benefits}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/schemes?id=${scheme.id}`}
                    className="text-xs font-bold text-agri-700 hover:text-agri-800 transition-colors inline-flex items-center gap-1"
                  >
                    <span>{isTa ? 'விவரங்கள்' : 'Check Details'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {scheme.official_url && (
                    <a
                      href={scheme.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                    >
                      {isTa ? 'அரசு தளம்' : 'Official Portal'}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
