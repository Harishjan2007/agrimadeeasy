'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tractor, 
  Search, 
  CalendarCheck, 
  Info 
} from 'lucide-react';
import { MOCK_MACHINERY } from '@/lib/mock-data';
import { Machinery, MachineryBooking } from '@/types';
import MachineryCard from '@/components/machinery/MachineryCard';
import MachineryBookingForm from '@/components/machinery/MachineryBookingForm';
import { useLanguage } from '@/i18n';
import { useAgri } from '@/context/AgriContext';
import { getMachinery } from '@/lib/supabase/machinery';

export default function MachineryPageClient() {
  const { machinery: contextMachinery, bookings: contextBookings } = useAgri();
  const [dbMachinery, setDbMachinery] = useState<Machinery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedMachineryForBooking, setSelectedMachineryForBooking] = useState<Machinery | null>(null);
  const { language, translations, translateMachineryType } = useLanguage();

  useEffect(() => {
    getMachinery().then((res) => {
      if (res.data && res.data.length > 0) {
        setDbMachinery(res.data);
      }
    });
  }, []);

  const machinery = dbMachinery.length > 0 ? dbMachinery : contextMachinery;
  const bookings = contextBookings;

  const isTa = language === 'ta';

  const types = ['All', 'Tractor', 'Paddy Harvester', 'Power Tiller', 'Other'];

  const filteredMachinery = useMemo(() => {
    return machinery.filter((m) => {
      const name = m.name.toLowerCase();
      const desc = m.description.toLowerCase();
      const location = m.location.toLowerCase();
      const provider = m.provider?.name.toLowerCase() || '';
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase()) || location.includes(searchTerm.toLowerCase()) || provider.includes(searchTerm.toLowerCase());
      
      const matchesType = 
        selectedType === 'All' 
          ? true 
          : selectedType === 'Other'
          ? m.type !== 'Tractor' && m.type !== 'Paddy Harvester'
          : m.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [machinery, searchTerm, selectedType]);

  const activeBookingsCount = bookings.filter((b) => b.status === 'pending' || b.status === 'accepted').length;

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-agri-950 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-amber-500/30">
                <Tractor className="w-3.5 h-3.5" />
                {isTa ? 'விவசாய இயந்திரங்கள் & வாடகை மையம்' : 'Farm Machinery & Equipment Rental Hub'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {translations.machinery.title}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
                {translations.machinery.subtitle}
              </p>
            </div>

            {/* Quick Access to My Bookings */}
            <div className="flex items-center gap-3">
              <Link
                href="/bookings"
                className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 shadow-lg"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>{translations.nav.myBookings} ({activeBookingsCount})</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-amber-800">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isTa
              ? 'இயந்திர வாடகை முன்பதிவு மாதிரிக்கானது. உங்கள் முன்பதிவு விவரங்களை "என் முன்பதிவுகள்" பக்கத்தில் சரிபார்க்கலாம்.'
              : 'Machine equipment listings and rental schedules are interactive demo simulations. Submitted bookings will appear directly in your "My Bookings" portal.'}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Search & Type Filters */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="w-full md:w-96 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={translations.machinery.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  {isTa ? 'அழிக்க' : 'Clear'}
                </button>
              )}
            </div>

            {/* Type Filter Tabs */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    selectedType === type
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'All' ? (isTa ? 'அனைத்தும்' : 'All') : translateMachineryType(type)}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Machinery Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{translations.machinery.title}</span>
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                {filteredMachinery.length} {isTa ? 'இயந்திரங்கள்' : 'Units Listed'}
              </span>
            </h2>
          </div>

          {filteredMachinery.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Tractor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">{translations.machinery.noMachineryFound}</h3>
              <p className="text-xs text-slate-500 mt-1">{translations.machinery.noMachineryDescription}</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('All');
                }}
                className="mt-4 btn-secondary text-xs py-2 px-4"
              >
                {translations.common.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMachinery.map((item) => (
                <MachineryCard
                  key={item.id}
                  machinery={item}
                  onBook={(m) => setSelectedMachineryForBooking(m)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Booking Form Modal */}
      {selectedMachineryForBooking && (
        <MachineryBookingForm
          machinery={selectedMachineryForBooking}
          onClose={() => setSelectedMachineryForBooking(null)}
        />
      )}
    </div>
  );
}
