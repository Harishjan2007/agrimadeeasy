import React from 'react';
import SchemesPageClient from '@/components/schemes/SchemesPageClient';
import AuthGuard from '@/components/common/AuthGuard';

export default function SchemesPage() {
  return (
    <AuthGuard>
      <SchemesPageClient />
    </AuthGuard>
  );
}
