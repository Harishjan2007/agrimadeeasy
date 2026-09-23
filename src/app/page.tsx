import React from 'react';
import MarketPriceTicker from '@/components/home/MarketPriceTicker';
import HomeCommandCenter from '@/components/home/HomeCommandCenter';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* 1. Market Price Reference Ticker */}
      <MarketPriceTicker />

      {/* 2. AgriME Command Center (Search-first, Category-first, Visual cards, Contextual sections) */}
      <HomeCommandCenter />
    </div>
  );
}
