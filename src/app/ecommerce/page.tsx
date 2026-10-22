import React from 'react';
import EcommercePageClient from '@/components/ecommerce/EcommercePageClient';
import AuthGuard from '@/components/common/AuthGuard';

export default function EcommercePage() {
  return (
    <AuthGuard>
      <EcommercePageClient />
    </AuthGuard>
  );
}
