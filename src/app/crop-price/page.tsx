import React from 'react';
import CropPricePageClient from '@/components/crop-price/CropPricePageClient';
import AuthGuard from '@/components/common/AuthGuard';

export default function CropPricePage() {
  return (
    <AuthGuard>
      <CropPricePageClient />
    </AuthGuard>
  );
}
