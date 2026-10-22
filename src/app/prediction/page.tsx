import React from 'react';
import PredictionPageClient from '@/components/prediction/PredictionPageClient';
import AuthGuard from '@/components/common/AuthGuard';

export default function PredictionPage() {
  return (
    <AuthGuard>
      <PredictionPageClient />
    </AuthGuard>
  );
}
