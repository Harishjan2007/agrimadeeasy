import React from 'react';
import Hero from '@/components/home/Hero';
import MarketPriceTicker from '@/components/home/MarketPriceTicker';
import QuickServices from '@/components/home/QuickServices';
import CropPricePreview from '@/components/home/CropPricePreview';
import PredictionPreview from '@/components/home/PredictionPreview';
import Recommendations from '@/components/home/Recommendations';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* 1. Hero Banner */}
      <Hero />

      {/* 2. Live Market Prices Ticker */}
      <MarketPriceTicker />

      {/* 3. Quick Services Grid */}
      <QuickServices />

      {/* 4. Current Crop Prices Preview */}
      <CropPricePreview />

      {/* 5. Crop Price Prediction Preview */}
      <PredictionPreview />

      {/* 6. Featured Recommendations */}
      <Recommendations />
    </div>
  );
}
