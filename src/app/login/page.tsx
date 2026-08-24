'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sprout, 
  User, 
  Lock, 
  ArrowRight
} from 'lucide-react';
import { UserRole } from '@/types';
import { signInUser } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useLanguage } from '@/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { language, translations, translateRole } = useLanguage();
  const isTa = language === 'ta';

  const [email, setEmail] = useState('farmer@agrime.demo');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      
      setTimeout(() => {
        setLoading(false);
        if (role === 'dealer') {
          router.push('/dealer');
        } else if (role === 'machinery_provider') {
          router.push('/machinery-provider');
        } else {
          router.push('/');
        }
      }, 400);
      return;
    }

    // Demo fallback mode
    setTimeout(() => {
      setLoading(false);
      if (selectedRole === 'dealer') {
        router.push('/dealer');
      } else if (selectedRole === 'machinery_provider') {
        router.push('/machinery-provider');
      } else {
        router.push('/');
      }
    }, 400);
  };

  const handleQuickDemo = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'dealer') {
      router.push('/dealer');
    } else if (role === 'machinery_provider') {
      router.push('/machinery-provider');
    } else {
      router.push('/');
    }
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
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg border border-slate-200/90 rounded-3xl space-y-6">
          
          {/* Quick 1-Click Demo Login Personas */}
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              {isTa ? 'விரைவு 1-கிளிக் மாதிரி உள்நுழைவு:' : 'Quick 1-Click Demo Sign In:'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('farmer')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-center transition-colors"
              >
                <span className="text-base block">🌾</span>
                <span className="text-[11px] font-bold text-emerald-800 block mt-0.5">{translateRole('farmer')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('dealer')}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-center transition-colors"
              >
                <span className="text-base block">🏪</span>
                <span className="text-[11px] font-bold text-amber-800 block mt-0.5">{translateRole('dealer')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('machinery_provider')}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-center transition-colors"
              >
                <span className="text-base block">🚜</span>
                <span className="text-[11px] font-bold text-blue-800 block mt-0.5">{translateRole('machinery_provider')}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">{isTa ? 'அல்லது வழக்கமான உள்நுழைவு' : 'Or standard login'}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMessage}
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
            <Link href="/signup" className="text-agri-700 font-bold hover:underline">
              {translations.auth.signupLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
