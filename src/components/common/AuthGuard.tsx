'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Sprout, Lock } from 'lucide-react';
import { useAuth } from '@/lib/supabase/useAuth';
import { useLanguage } from '@/i18n';

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackRedirect?: string;
}

interface RedirectHandlerProps {
  fallbackRedirect?: string;
  pathname: string;
}

function RedirectHandler({ fallbackRedirect, pathname }: RedirectHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryStr = searchParams ? searchParams.toString() : '';
    const returnPath = fallbackRedirect || (queryStr ? `${pathname}?${queryStr}` : pathname);
    router.replace(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }, [router, searchParams, fallbackRedirect, pathname]);

  return null;
}

export default function AuthGuard({ children, fallbackRedirect }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setRedirecting(true);
    }
  }, [loading, user]);

  if (loading || redirecting || !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-agri-400 to-agri-600 opacity-20 animate-ping"></div>
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-agri-500 to-agri-700 flex items-center justify-center text-white shadow-md">
            {redirecting ? <Lock className="w-7 h-7" /> : <Sprout className="w-7 h-7 animate-pulse" />}
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight text-center">
          {redirecting
            ? (isTa ? 'உள்நுழைவுப் பக்கத்திற்குத் திருப்பிவிடப்படுகிறது...' : 'Redirecting to Sign In...')
            : (isTa ? 'அங்கீகாரம் சரிபார்க்கப்படுகிறது...' : 'Verifying Authentication...')}
        </h3>

        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
          {redirecting
            ? (isTa ? 'இப்பிரிவை அணுக உங்கள் கணக்கில் உள்நுழையவும்.' : 'Please sign in to access this agricultural feature.')
            : (isTa ? 'தயவுசெய்து ஒரு கணம் காத்திருக்கவும்...' : 'Please wait while we connect your session...')}
        </p>

        <div className="mt-4 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-agri-500 animate-bounce"></span>
          <span className="w-2 h-2 rounded-full bg-agri-500 animate-bounce [animation-delay:0.15s]"></span>
          <span className="w-2 h-2 rounded-full bg-agri-500 animate-bounce [animation-delay:0.3s]"></span>
        </div>

        {redirecting && (
          <Suspense fallback={null}>
            <RedirectHandler fallbackRedirect={fallbackRedirect} pathname={pathname} />
          </Suspense>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
