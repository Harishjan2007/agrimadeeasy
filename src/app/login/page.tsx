'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Sprout, 
  User, 
  Lock, 
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { UserRole } from '@/types';
import { signInUser, setAuthCookie } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useLanguage } from '@/i18n';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams ? searchParams.get('redirect') : null;
  const { language, translations, translateRole } = useLanguage();
  const isTa = language === 'ta';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Validate and get destination path
  const getDestinationUrl = (defaultRole: UserRole) => {
    if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
      return redirectParam;
    }
    if (defaultRole === 'dealer') return '/dealer';
    if (defaultRole === 'machinery_provider') return '/machinery-provider';
    return '/';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (isSupabaseConfigured) {
      const { user, profile, error } = await signInUser({
        email,
        password
      });

      if (error) {
        setErrorMessage(error.message || (isTa ? 'உள்நுழைவு தோல்வியடைந்தது. உங்கள் விவரங்களைச் சரிபார்க்கவும்.' : 'Failed to sign in. Please check your credentials.'));
        setLoading(false);
        return;
      }

      if (!user) {
        setErrorMessage(isTa ? 'பயனர் அடையாளம் காணப்படவில்லை.' : 'Authentication succeeded but user identity could not be resolved.');
        setLoading(false);
        return;
      }

      const role = profile?.role || (user.user_metadata?.role as UserRole) || 'farmer';
      setAuthCookie();
      
      setTimeout(() => {
        setLoading(false);
        const destination = getDestinationUrl(role);
        router.push(destination);
      }, 350);
      return;
    }

    // Supabase unconfigured fallback mode
    setTimeout(() => {
      const demoId = `user_${Date.now()}`;
      const demoUser = {
        id: demoId,
        email: email || `user@agrime.in`,
        user_metadata: {
          name: email.split('@')[0],
          role: selectedRole
        }
      };

      const demoProfile = {
        id: demoId,
        name: email.split('@')[0],
        email: demoUser.email,
        phone: '',
        role: selectedRole,
        location: 'Tamil Nadu',
        created_at: new Date().toISOString()
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('agrime_demo_session', JSON.stringify({ user: demoUser, profile: demoProfile }));
          localStorage.setItem(`agrime_profile_${demoId}`, JSON.stringify(demoProfile));
        } catch {}
        setAuthCookie();
      }

      setLoading(false);
      const destination = getDestinationUrl(selectedRole);
      router.push(destination);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-agri-500 to-agri-700 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Sprout className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Agri<span className="text-agri-600">ME</span>
            </span>
          </Link>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900">
          {translations.auth.loginTitle}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          {translations.auth.loginSubtitle}
        </p>

        {/* Redirect Notice Banner if redirected from a protected page */}
        {redirectParam && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 animate-in fade-in duration-200">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="leading-tight">
              <span className="font-bold">
                {isTa ? 'அணுகல் அனுமதி தேவை:' : 'Authentication Required:'}
              </span>{' '}
              <span>
                {isTa 
                  ? 'இப்பகுதியை அணுக உங்கள் கணக்கில் உள்நுழையவும். உள்நுழைந்த பிறகு தானாகவே திருப்பிவிடப்படுவீர்கள்.' 
                  : 'Please sign in to access this tab. You will be returned immediately after signing in.'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg border border-slate-200/90 rounded-3xl space-y-6">

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {translations.auth.email}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {translations.auth.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>{translations.common.loading}</span>
              ) : (
                <>
                  <span>{translations.auth.loginButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            {translations.auth.dontHaveAccount}{' '}
            <Link 
              href={redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : '/signup'} 
              className="text-agri-700 font-bold hover:underline"
            >
              {translations.auth.signupLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

