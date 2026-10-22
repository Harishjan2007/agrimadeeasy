import React, { Suspense } from 'react';
import DealersPageClient from '@/components/dealers/DealersPageClient';
import AuthGuard from '@/components/common/AuthGuard';

export default function DealersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AuthGuard>
        <DealersPageClient />
      </AuthGuard>
    </Suspense>
  );
}
