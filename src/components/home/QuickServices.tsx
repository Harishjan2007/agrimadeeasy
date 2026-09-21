'use client';

import React from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  BarChart3, 
  Store, 
  Tractor, 
  ShoppingBag, 
  Landmark, 
  ArrowRight 
} from 'lucide-react';
import { useLanguage } from '@/i18n';

export default function QuickServices() {
  const { language, translations } = useLanguage();
  const isTa = language === 'ta';

  const services = [
    {
      title: translations.nav.cropPrices,
      description: isTa 
        ? 'தினசரி ஒழுங்குமுறை மண்டி பயிர் விலைகள் மற்றும் சந்தை நிலவரங்களை கண்காணிக்கவும்.'
        : 'Track daily APMC mandi market prices across crops, states, and regional wholesale markets.',
      href: '/crop-price',
      icon: TrendingUp,
      badge: isTa ? 'தினசரி புதுப்பிப்பு' : 'Updated Daily',
      iconBg: 'bg-emerald-100 text-emerald-700',
      border: 'hover:border-emerald-300'
    },
    {
      title: translations.nav.predictions,
      description: isTa 
        ? 'விளைச்சலுக்கு முன் சந்தை விலை கணிப்புகள் மற்றும் பருவகால தேவைகளை அறியவும்.'
        : 'Review forward market price projections and seasonal demand trends before harvesting.',
      href: '/prediction',
      icon: BarChart3,
      badge: isTa ? 'விலைப்போக்கு முன்னறிவிப்பு' : 'Price Trend Forecast',
      iconBg: 'bg-blue-100 text-blue-700',
      border: 'hover:border-blue-300'
    },
    {
      title: translations.nav.dealers,
      description: isTa 
        ? 'நெல், நிலக்கடலை, பருத்தி உள்ளிட்ட பயிர்களை நேரடியாக வாங்கும் வியாபாரிகளுடன் இணையவும்.'
        : 'Directly connect with authorized merchants purchasing Paddy, Groundnut, Cotton, and more.',
      href: '/dealers',
      icon: Store,
      badge: isTa ? 'அங்கீகரிக்கப்பட்டவை' : 'Verified Buyers',
      iconBg: 'bg-emerald-100 text-emerald-700',
      border: 'hover:border-emerald-300'
    },
    {
      title: translations.nav.machinery,
      description: isTa 
        ? 'டிராக்டர்கள், நெல் அறுவடை இயந்திரங்களை மணிநேர வாடகைக்கு முன்பதிவு செய்யுங்கள்.'
        : 'Book Tractors, Combine Harvesters, and Power Tillers by the hour with instant status tracking.',
      href: '/machinery',
      icon: Tractor,
      badge: isTa ? 'மணிநேர வாடகை' : 'Hourly Booking',
      iconBg: 'bg-amber-100 text-amber-700',
      border: 'hover:border-amber-300'
    },
    {
      title: translations.nav.ecommerce,
      description: isTa 
        ? 'சான்றளிக்கப்பட்ட விதைகள், இயற்கை உரங்கள் மற்றும் விவசாய கருவிகளைப் பெறுங்கள்.'
        : 'Browse certified seed bags, organic bio-fertilizers, neem pesticides, and farm tools.',
      href: '/ecommerce',
      icon: ShoppingBag,
      badge: isTa ? 'விவசாய அங்காடி' : 'Agri Store',
      iconBg: 'bg-purple-100 text-purple-700',
      border: 'hover:border-purple-300'
    },
    {
      title: translations.nav.schemes,
      description: isTa 
        ? 'PM-கிசான், SMAM இயந்திர மானியம் மற்றும் பயிர் காப்பீட்டு விண்ணப்ப வழிகாட்டிகளை அறியவும்.'
        : 'Explore PM-Kisan, SMAM machinery subsidy, and PMFBY crop insurance application guides.',
      href: '/schemes',
      icon: Landmark,
      badge: isTa ? 'மத்திய & மாநில அரசு' : 'Central & State',
      iconBg: 'bg-slate-100 text-slate-700',
      border: 'hover:border-slate-300'
    }
  ];

  return (
    <section className="py-14 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-agri-700 uppercase tracking-wider bg-agri-100/70 px-3 py-1 rounded-full">
            {translations.home.quickServicesTitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {translations.home.quickServicesSubtitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            {isTa 
              ? 'மண்டி விலைகளை அறியவும், விளைச்சலை விற்கவும், இயந்திரங்களை வாடகைக்கு எடுக்கவும் அல்லது அரசு மானியங்களுக்கு விண்ணப்பிக்கவும் சேவையைத் தேர்ந்தெடுக்கவும்.'
              : 'Choose a service to check market rates, sell produce, book farm equipment, or apply for subsidies.'}
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.title}
                href={service.href}
                className={`group agri-card p-6 flex flex-col justify-between ${service.border} transition-all duration-200`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${service.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {service.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-agri-700 transition-colors">
                    {service.title}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-agri-700 group-hover:text-agri-800">
                  <span>{translations.common.viewDetails}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
