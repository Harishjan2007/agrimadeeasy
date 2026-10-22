import React from 'react';
import MachineryPageClient from '@/components/machinery/MachineryPageClient';
import AuthGuard from '@/components/common/AuthGuard';

export default function MachineryPage() {
  return (
    <AuthGuard>
      <MachineryPageClient />
    </AuthGuard>
  );
}
