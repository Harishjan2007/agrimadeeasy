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
import { PageHeader, SearchBar, CategoryTabs, EmptyState } from '@/components/ui';

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
      {/* Modern Page Header */}
      <PageHeader
        title={translations.machinery.title}
        subtitle={translations.machinery.subtitle}
        badge={isTa ? 'விவசாய இயந்திரங்கள் & வாடகை மையம்' : 'Farm Equipment & Machinery Hub'}
        icon={Tractor}
        iconColor="text-amber-700"
        iconBg="bg-amber-50 border-amber-200"
        stats={[
          { label: isTa ? 'மொத்த இயந்திரங்கள்' : 'Listed Units', value: machinery.length },
          { label: isTa ? 'வாடகைக்கு தயார்' : 'Available', value: machinery.filter((m) => m.available).length },
          { label: isTa ? 'என் முன்பதிவுகள்' : 'My Bookings', value: activeBookingsCount }
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/map?category=machinery"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
            >
              <span>{isTa ? 'வரைபடத்தில் காண்க' : 'View on Map'}</span>
            </Link>
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
        
        {/* Search & Category Filter Section */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 mb-8 space-y-4">
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
                  { id: 'All', label: isTa ? 'அனைத்தும்' : 'All', count: machinery.length, icon: '🚜' },
                  { id: 'Tractor', label: isTa ? 'டிராக்டர்' : 'Tractors', count: machinery.filter(m => m.type === 'Tractor').length, icon: '🚜' },
                  { id: 'Paddy Harvester', label: isTa ? 'அறுவடை இயந்திரம்' : 'Harvesters', count: machinery.filter(m => m.type === 'Paddy Harvester').length, icon: '🌾' },
                  { id: 'Power Tiller', label: isTa ? 'பவர் டில்லர்' : 'Tillers', count: machinery.filter(m => m.type === 'Power Tiller').length, icon: '⚙️' },
                  { id: 'Other', label: isTa ? 'பிற உபகரணங்கள்' : 'Other', count: machinery.filter(m => m.type !== 'Tractor' && m.type !== 'Paddy Harvester' && m.type !== 'Power Tiller').length, icon: '🛠️' },
                ]}
                activeTab={selectedType}
                onChange={setSelectedType}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Machinery Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{translations.machinery.title}</span>
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                {filteredMachinery.length} {isTa ? 'இயந்திரங்கள்' : 'Units'}
              </span>
            </h2>
          </div>

          {filteredMachinery.length === 0 ? (
            <EmptyState
              title={translations.machinery.noMachineryFound}
              description={translations.machinery.noMachineryDescription}
              actionLabel={translations.common.clearFilters}
              onAction={() => {
                setSearchTerm('');
                setSelectedType('All');
              }}
            />
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
