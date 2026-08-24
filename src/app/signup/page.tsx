'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sprout, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { UserRole } from '@/types';
import { signUpUser } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useLanguage } from '@/i18n';

export default function SignupPage() {
  const router = useRouter();
  const { language, translations, translateRole } = useLanguage();
  const isTa = language === 'ta';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState<{ title: string; message: string } | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage(isTa ? 'தயவுசெய்து உங்கள் முழு பெயரை உள்ளிடவும்.' : 'Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(isTa ? 'தயவுசெய்து சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage(isTa ? 'தயவுசெய்து உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter your contact phone number.');
      return;
    }
    if (!location.trim()) {
      setErrorMessage(isTa ? 'தயவுசெய்து உங்கள் இருப்பிடத்தை உள்ளிடவும்.' : 'Please enter your farm or business location / district.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage(isTa ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துக்களாக இருக்க வேண்டும்.' : 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured) {
      const { error } = await signUpUser({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        location: location.trim(),
        role
      });

      if (error) {
        setErrorMessage(error.message || (isTa ? 'கணக்கு உருவாக்குவது தோல்வியடைந்தது. விவரங்களை சரிபார்க்கவும்.' : 'Failed to create account. Please check your details.'));
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccessNotice({
        title: isTa ? 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!' : 'Account Created Successfully!',
        message: isTa 
          ? 'உங்கள் AgriME கணக்கு பதிவு செய்யப்பட்டுள்ளது. மின்னஞ்சல் உறுதிப்படுத்தல் இருந்தால், உறுதிசெய்த பின் உள்நுழையவும்.'
          : 'Your AgriME account has been registered. If your project has email verification enabled, please confirm your email before signing in.'
      });
      return;
    }

    // Demo Mode Simulation
    setTimeout(() => {
      setLoading(false);
      router.push('/profile');
    }, 500);
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
          {translations.auth.signupTitle}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          {translations.auth.signupSubtitle}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg border border-slate-200/90 rounded-3xl space-y-5">
          
          {/* Success Card */}
          {successNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successNotice.title}</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                {successNotice.message}
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="btn-primary w-full py-2 text-center text-xs font-bold block"
                >
                  {translations.auth.loginButton}
                </Link>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!successNotice && (
            <form onSubmit={handleSignup} className="space-y-4">
              
              {/* Account Role Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {translations.auth.selectRole}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('farmer')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      role === 'farmer'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm block">🌾</span>
                    <span className="text-[11px] block mt-0.5">{translateRole('farmer')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('dealer')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      role === 'dealer'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm block">🏪</span>
                    <span className="text-[11px] block mt-0.5">{translateRole('dealer')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('machinery_provider')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      role === 'machinery_provider'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm block">🚜</span>
                    <span className="text-[11px] block mt-0.5">{translateRole('machinery_provider')}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{translations.auth.fullName}</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Murugan Ramasamy"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{translations.auth.email}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{translations.auth.phone}</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98451..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{translations.auth.location}</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Vellore, TN"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{translations.auth.password}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isTa ? 'குறைந்தது 6 எழுத்துக்கள்' : 'Min 6 characters'}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <span>{translations.common.loading}</span>
                ) : (
                  <>
                    <span>{translations.auth.signupButton}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            {translations.auth.alreadyHaveAccount}{' '}
            <Link href="/login" className="text-agri-700 font-bold hover:underline">
              {translations.auth.loginButton}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
