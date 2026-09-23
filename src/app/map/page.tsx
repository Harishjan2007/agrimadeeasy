import React, { Suspense } from 'react';
import { Metadata } from 'next';
import MapPageClient from '@/components/map/MapPageClient';

export const metadata: Metadata = {
  title: 'Agricultural Map & Discovery | AgriME',
  description: 'Locate nearby agricultural dealers, machinery rental providers, and APMC mandis across Tamil Nadu with real-time geographic distance.'
};

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600 mt-4">Loading Agricultural Map...</p>
        </div>
      }
    >
      <MapPageClient />
    </Suspense>
  );
}
