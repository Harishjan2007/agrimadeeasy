'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, PhoneCall, Mail, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useLanguage } from '@/i18n';

export default function Footer() {
  const { language, translations } = useLanguage();

  const isTa = language === 'ta';

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      {/* Upper Footer: Value pillars */}
      <div className="border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-lg bg-agri-500/10 text-agri-400 flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">
                {isTa ? 'நேரடி மண்டி & வியாபாரி விலைகள்' : 'Direct Mandi & Buyer Prices'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTa ? 'ஒழுங்குமுறை விற்பனைக்கூடங்கள் மற்றும் வியாபாரிகளின் நேரலை விலைகள்.' : 'Real-time crop rates directly from regulated mandis and verified buyers.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-lg bg-harvest-500/10 text-harvest-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">
                {isTa ? 'அங்கீகரிக்கப்பட்ட இயந்திர வாடகை' : 'Verified Local Machinery Rentals'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTa ? 'இடைத்தரகர்கள் இன்றி வெளிப்படையான மணிநேர இயந்திர வாடகை.' : 'Transparent hourly tractor & harvester bookings without middlemen.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">
                {isTa ? 'அரசு நலத்திட்ட வழிகாட்டுதல்' : 'Government Scheme Updates'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTa ? 'PM-கிசான், SMAM இயந்திர மானியம் மற்றும் பயிர் காப்பீட்டு தகவல்கள்.' : 'Instant guidance for PM-Kisan, SMAM machinery subsidy, and PMFBY insurance.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-agri-500 to-agri-700 flex items-center justify-center text-white shadow-md">
                <Sprout className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white">
                Agri<span className="text-agri-400">ME</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isTa
                ? 'வெளிப்படையான பயிர் சந்தை விலைகள், நேரடி கொள்முதல், விவசாய இயந்திர வாடகை மற்றும் அரசு நலத்திட்டங்கள் மூலம் இந்திய விவசாயிகளுக்கு வழிகாட்டுகிறது.'
                : 'Empowering Indian farmers through transparent crop pricing, verified buyer connections, farm machinery rentals, and simplified access to agricultural welfare schemes.'}
            </p>
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-agri-400" />
                <span>{isTa ? 'விவசாயி உதவி எண் (மாதிரி)' : 'Kisan Helpline (Demo)'}: 1800-180-1551</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-agri-400" />
                <span>support@agrime.demo</span>
              </div>
            </div>
          </div>

          {/* Col 2: Farmer Services */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">
              {isTa ? 'விவசாய சேவைகள்' : 'Farmer Services'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/crop-price" className="hover:text-agri-400 transition-colors">{translations.nav.cropPrices}</Link>
              </li>
              <li>
                <Link href="/prediction" className="hover:text-agri-400 transition-colors">{translations.nav.predictions}</Link>
              </li>
              <li>
                <Link href="/dealers" className="hover:text-agri-400 transition-colors">{translations.nav.dealers}</Link>
              </li>
              <li>
                <Link href="/machinery" className="hover:text-agri-400 transition-colors">{translations.nav.machinery}</Link>
              </li>
              <li>
                <Link href="/ecommerce" className="hover:text-agri-400 transition-colors">{translations.nav.ecommerce}</Link>
              </li>
              <li>
                <Link href="/schemes" className="hover:text-agri-400 transition-colors">{translations.nav.schemes}</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Role Portals */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">
              {translations.nav.specializedPortals}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dealer" className="hover:text-agri-400 transition-colors">{translations.nav.dealerPortal}</Link>
              </li>
              <li>
                <Link href="/machinery-provider" className="hover:text-agri-400 transition-colors">{translations.nav.machineryHostPortal}</Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-agri-400 transition-colors">{translations.nav.bookings}</Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-agri-400 transition-colors">{translations.nav.profile}</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Notice */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm">
              {isTa ? 'வெளிப்படைத்தன்மை அறிவிப்பு' : 'Transparency Notice'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              {isTa
                ? 'AgriME தளம் நேரடி மண்டி விலைகள் மற்றும் அதிகாரப்பூர்வ அரசு வழிகாட்டுதல்களை வழங்குகிறது. இறுதி விற்பனை முடிவுகளுக்கு உங்கள் பகுதி ஒழுங்குமுறை சந்தை அல்லது அங்கீகரிக்கப்பட்ட வியாபாரிகளை அணுகவும்.'
                : 'AgriME operates with sample/seed records during development. Price trends represent stored forecast indicators. Always confirm real-time transactions with your local APMC mandi or authorized buyers.'}
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AgriME Platform. {translations.nav.tagline}.</p>
          <div className="flex gap-4">
            <Link href="/schemes" className="hover:text-slate-400">{translations.nav.schemes}</Link>
            <span>•</span>
            <Link href="/crop-price" className="hover:text-slate-400">{translations.nav.cropPrices}</Link>
            <span>•</span>
            <Link href="/profile" className="hover:text-slate-400">{translations.nav.profile}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
