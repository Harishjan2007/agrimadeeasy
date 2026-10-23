'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Sprout, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Check,
  Sparkles,
  TrendingUp,
  Store,
  Tractor,
  ShoppingBag,
  Landmark,
  Scale,
  Building2,
  Wrench,
  Clock,
  FileText,
  IndianRupee,
  Layers,
  Plus,
  Navigation
} from 'lucide-react';
import { UserRole } from '@/types';
import { signUpUser, setAuthCookie } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/useAuth';
import { useLanguage } from '@/i18n';
import { 
  INDIAN_STATES_AND_UTS, 
  getDistrictsForState, 
  POPULAR_CROPS_ONBOARDING, 
  ONBOARDING_INTERESTS
} from '@/lib/indian-geography';
import LocationPicker from '@/components/common/LocationPicker';

const THREE_ROLES: { id: UserRole; label: string; labelTa: string; icon: string; desc: string; descTa: string }[] = [
  {
    id: 'farmer',
    label: 'Farmer',
    labelTa: 'விவசாயி',
    icon: '🌾',
    desc: 'Cultivate crops, monitor mandi rates, find buyers & book machinery',
    descTa: 'பயிர் சாகுபடி, மண்டி விலை கண்காணிப்பு & இயந்திர வாடகை'
  },
  {
    id: 'dealer',
    label: 'Dealer',
    labelTa: 'வியாபாரி / மண்டி',
    icon: '🏪',
    desc: 'Procure farm produce directly from farmers & manage Mandi trade',
    descTa: 'விவசாயிகளிடமிருந்து நேரடியாக பயிர் கொள்முதல் & வர்த்தகம்'
  },
  {
    id: 'machinery_provider',
    label: 'Machinery Provider',
    labelTa: 'இயந்திர உரிமையாளர்',
    icon: '🚜',
    desc: 'List tractors, harvesters & provide farm equipment rental',
    descTa: 'டிராக்டர், அறுவடை இயந்திரங்கள் வாடகை சேவை வழங்குபவர்'
  }
];

const PRODUCE_CATEGORIES = [
  { id: 'Grains & Cereals', label: 'Grains & Cereals', labelTa: 'தானியங்கள்' },
  { id: 'Vegetables', label: 'Vegetables', labelTa: 'காய்கறிகள்' },
  { id: 'Fruits', label: 'Fruits', labelTa: 'பழங்கள்' },
  { id: 'Pulses & Oilseeds', label: 'Pulses & Oilseeds', labelTa: 'பருப்பு & எண்ணெய் வித்துக்கள்' },
  { id: 'Spices & Commercial', label: 'Spices & Commercial', labelTa: 'மசாலா & வணிகப் பயிர்கள்' }
];

const MACHINERY_TYPES = [
  'Tractor',
  'Harvester',
  'Power Tiller',
  'Rotavator',
  'Duster/Sprayer',
  'Baler',
  'Cultivator',
  'Other'
];

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams ? searchParams.get('redirect') : null;
  const initialRoleParam = searchParams ? (searchParams.get('role') as UserRole) : null;
  const { language, translations } = useLanguage();
  const isTa = language === 'ta';

  const { user, role: authRole, loading: authLoading } = useAuth();

  // Step state: 1 (Credentials & Account) -> 2 (Role-Specific Onboarding)
  const [step, setStep] = useState<1 | 2>(1);

  // Authentication & Identity Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Selected Role: strictly one of 'farmer', 'dealer', 'machinery_provider'
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    initialRoleParam && ['farmer', 'dealer', 'machinery_provider'].includes(initialRoleParam)
      ? initialRoleParam
      : 'farmer'
  );

  // Shared Geography
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Salem');

  // --- Farmer specific questions ---
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['paddy', 'tomato']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'crop_prices',
    'price_prediction',
    'government_schemes'
  ]);

  // --- Dealer specific questions ---
  const [shopName, setShopName] = useState('');
  const [dealerAddress, setDealerAddress] = useState('');
  const [dealerLat, setDealerLat] = useState<number | null>(null);
  const [dealerLng, setDealerLng] = useState<number | null>(null);
  const [dealerBoughtCrops, setDealerBoughtCrops] = useState<string[]>(['paddy', 'tomato', 'onion']);
  const [customCropInput, setCustomCropInput] = useState('');
  const [dealerProduceCategories, setDealerProduceCategories] = useState<string[]>(['Grains & Cereals', 'Vegetables']);
  const [purchaseConditions, setPurchaseConditions] = useState('Instant spot cash payment; digital weighbridge available on-site');
  const [openingHours, setOpeningHours] = useState('Mon - Sat: 06:00 AM - 08:00 PM');

  // --- Machinery Provider specific questions ---
  const [providerName, setProviderName] = useState('');
  const [providerAddress, setProviderAddress] = useState('');
  const [providerLat, setProviderLat] = useState<number | null>(null);
  const [providerLng, setProviderLng] = useState<number | null>(null);
  const [machineryTypesOffered, setMachineryTypesOffered] = useState<string[]>(['Tractor']);
  const [primaryMachineName, setPrimaryMachineName] = useState('');
  const [pricePerHour, setPricePerHour] = useState<number>(750);
  const [rentalTerms, setRentalTerms] = useState('Includes fuel & professional operator; fast dispatch within 25 km');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState<{ title: string; message: string } | null>(null);

  // Cascading districts for current state
  const availableDistricts = getDistrictsForState(selectedState);

  // Handle state change: update state and reset district to first available
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    const districts = getDistrictsForState(newState);
    if (districts.length > 0) {
      setSelectedDistrict(districts[0]);
    } else {
      setSelectedDistrict('');
    }
  };

  // Farmer Helpers
  const toggleCrop = (cropId: string) => {
    setSelectedCrops(prev => 
      prev.includes(cropId) ? prev.filter(c => c !== cropId) : [...prev, cropId]
    );
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) ? prev.filter(i => i !== interestId) : [...prev, interestId]
    );
  };

  // Dealer Helpers
  const toggleDealerCrop = (cropId: string) => {
    setDealerBoughtCrops(prev =>
      prev.includes(cropId) ? prev.filter(c => c !== cropId) : [...prev, cropId]
    );
  };

  const addCustomDealerCrop = () => {
    const trimmed = customCropInput.trim().toLowerCase();
    if (trimmed && !dealerBoughtCrops.includes(trimmed)) {
      setDealerBoughtCrops(prev => [...prev, trimmed]);
      setCustomCropInput('');
    }
  };

  const toggleProduceCategory = (catId: string) => {
    setDealerProduceCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  // Machinery Provider Helpers
  const toggleMachineryType = (type: string) => {
    setMachineryTypesOffered(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Helper to validate that a redirect parameter is a safe, internal, non-auth route
  const isSafeInternalRedirect = useCallback((url: string | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    if (!url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) return false;

    const pathOnly = url.split('?')[0].split('#')[0].toLowerCase();
    if (
      pathOnly === '/login' ||
      pathOnly.startsWith('/login/') ||
      pathOnly === '/signup' ||
      pathOnly.startsWith('/signup/')
    ) {
      return false;
    }

    return true;
  }, []);

  // Safe destination redirect helper
  const getDestinationUrl = useCallback(() => {
    if (isSafeInternalRedirect(redirectParam)) {
      return redirectParam!;
    }
    const targetRole = authRole || (user?.user_metadata?.role as UserRole) || selectedRole;
    if (targetRole === 'dealer') return '/dealer';
    if (targetRole === 'machinery_provider') return '/machinery-provider';
    return '/';
  }, [redirectParam, authRole, user, selectedRole, isSafeInternalRedirect]);

  // If already authenticated, redirect immediately without showing sign-up screen
  useEffect(() => {
    if (!authLoading && user) {
      const destination = getDestinationUrl();
      router.replace(destination);
    }
  }, [authLoading, user, getDestinationUrl, router]);

  // Validate Step 1: Basic Credentials
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

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
    if (password.length < 6) {
      setErrorMessage(isTa ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துக்களாக இருக்க வேண்டும்.' : 'Password must be at least 6 characters long.');
      return;
    }

    setStep(2);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Complete Signup and Role-Specific Onboarding
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice(null);

    // Shared Geography Validation
    if (!selectedState) {
      setErrorMessage(isTa ? 'தயவுசெய்து உங்கள் மாநிலத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please select your state.');
      return;
    }
    if (!selectedDistrict) {
      setErrorMessage(isTa ? 'தயவுசெய்து உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please select your district.');
      return;
    }

    // Role-Specific Validations
    if (selectedRole === 'farmer') {
      if (selectedCrops.length === 0) {
        setErrorMessage(isTa ? 'தயவுசெய்து குறைந்தது ஒரு முக்கிய பயிரைத் தேர்ந்தெடுக்கவும்.' : 'Please select at least one primary crop.');
        return;
      }
      if (selectedInterests.length === 0) {
        setErrorMessage(isTa ? 'தயவுசெய்து குறைந்தது ஒரு ஆர்வத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please select at least one platform interest.');
        return;
      }
    } else if (selectedRole === 'dealer') {
      if (!shopName.trim()) {
        setErrorMessage(isTa ? 'தயவுசெய்து உங்கள் கடை அல்லது நிறுவனத்தின் பெயரை உள்ளிடவும்.' : 'Please enter your shop or business name.');
        return;
      }
      if (!dealerAddress.trim()) {
        setErrorMessage(isTa ? 'தயவுசெய்து உங்கள் வணிக முகவரியை உள்ளிடவும்.' : 'Please enter your business address.');
        return;
      }
      if (dealerLat == null || dealerLng == null) {
        setErrorMessage(isTa ? 'தயவுசெய்து வரைபடத்தில் உங்கள் வணிக இருப்பிடத்தைக் குறிக்கவும்.' : 'Please drop a pin on the map to set your business location coordinates.');
        return;
      }
      if (dealerBoughtCrops.length === 0) {
        setErrorMessage(isTa ? 'தயவுசெய்து நீங்கள் வாங்கும் குறைந்தது ஒரு பயிரைத் தேர்ந்தெடுக்கவும்.' : 'Please select at least one crop variety you purchase.');
        return;
      }
    } else if (selectedRole === 'machinery_provider') {
      if (!providerName.trim()) {
        setErrorMessage(isTa ? 'தயவுசெய்து உங்கள் சேவை அல்லது நிறுவனத்தின் பெயரை உள்ளிடவும்.' : 'Please enter your provider or business name.');
        return;
      }
      if (!providerAddress.trim()) {
        setErrorMessage(isTa ? 'தயவுசெய்து உங்கள் சேவை முகவரியை உள்ளிடவும்.' : 'Please enter your service/workshop address.');
        return;
      }
      if (providerLat == null || providerLng == null) {
        setErrorMessage(isTa ? 'தயவுசெய்து வரைபடத்தில் உங்கள் சேவை இருப்பிடத்தைக் குறிக்கவும்.' : 'Please drop a pin on the map to set your service location coordinates.');
        return;
      }
      if (machineryTypesOffered.length === 0) {
        setErrorMessage(isTa ? 'தயவுசெய்து குறைந்தது ஒரு இயந்திர வகையைத் தேர்ந்தெடுக்கவும்.' : 'Please select at least one machinery type offered.');
        return;
      }
      if (!primaryMachineName.trim()) {
        setErrorMessage(isTa ? 'தயவுசெய்து முதன்மை இயந்திரத்தின் பெயரை உள்ளிடவும்.' : 'Please enter your primary machine model name (e.g., Mahindra 575 DI).');
        return;
      }
      if (!pricePerHour || pricePerHour <= 0) {
        setErrorMessage(isTa ? 'தயவுசெய்து சரியான மணிநேர வாடகைக் கட்டணத்தை உள்ளிடவும்.' : 'Please enter a valid hourly rental rate.');
        return;
      }
    }

    setLoading(true);

    const locationString = selectedRole === 'dealer' && dealerAddress
      ? `${dealerAddress}, ${selectedDistrict}, ${selectedState}`
      : selectedRole === 'machinery_provider' && providerAddress
      ? `${providerAddress}, ${selectedDistrict}, ${selectedState}`
      : `${selectedDistrict}, ${selectedState}`;

    const signUpPayload = {
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      location: locationString,
      role: selectedRole,
      state: selectedState,
      district: selectedDistrict,
      // Farmer specifics
      primaryCrops: selectedRole === 'farmer' ? selectedCrops : undefined,
      mainInterests: selectedRole === 'farmer' ? selectedInterests : undefined,
      // Dealer specifics
      shopName: selectedRole === 'dealer' ? shopName.trim() : undefined,
      businessAddress: selectedRole === 'dealer' ? dealerAddress.trim() : undefined,
      latitude: selectedRole === 'dealer' ? (dealerLat ?? undefined) : selectedRole === 'machinery_provider' ? (providerLat ?? undefined) : undefined,
      longitude: selectedRole === 'dealer' ? (dealerLng ?? undefined) : selectedRole === 'machinery_provider' ? (providerLng ?? undefined) : undefined,
      boughtCrops: selectedRole === 'dealer' ? dealerBoughtCrops : undefined,
      produceCategories: selectedRole === 'dealer' ? dealerProduceCategories : undefined,
      purchaseConditions: selectedRole === 'dealer' ? purchaseConditions.trim() : undefined,
      openingHours: selectedRole === 'dealer' ? openingHours.trim() : undefined,
      // Machinery Provider specifics
      providerName: selectedRole === 'machinery_provider' ? providerName.trim() : undefined,
      machineryTypes: selectedRole === 'machinery_provider' ? machineryTypesOffered : undefined,
      primaryMachineName: selectedRole === 'machinery_provider' ? primaryMachineName.trim() : undefined,
      pricePerHour: selectedRole === 'machinery_provider' ? Number(pricePerHour) : undefined,
      rentalTerms: selectedRole === 'machinery_provider' ? rentalTerms.trim() : undefined
    };

    if (isSupabaseConfigured) {
      const { user: newAuthUser, profile: createdProfile, error } = await signUpUser(signUpPayload);

      if (error) {
        setErrorMessage(error.message || (isTa ? 'கணக்கு உருவாக்குவது தோல்வியடைந்தது. விவரங்களை சரிபார்க்கவும்.' : 'Failed to create account. Please check your details.'));
        setLoading(false);
        return;
      }

      setLoading(false);
      const destination = getDestinationUrl();

      // If user session is returned or auto-confirmed
      if (newAuthUser?.session || createdProfile) {
        setAuthCookie();
        router.push(destination);
        return;
      }

      setSuccessNotice({
        title: isTa ? 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!' : 'Account Created Successfully!',
        message: isTa 
          ? 'உங்கள் AgriME கணக்கு மற்றும் விவரங்கள் பதிவு செய்யப்பட்டுள்ளன. உள்நுழைந்து தொடரவும்.'
          : 'Your AgriME account and onboarding profile have been registered. Please sign in to continue.'
      });
      return;
    }

    // Supabase unconfigured mode
    setErrorMessage(
      isTa
        ? 'Supabase தரவுத்தளம் இணைக்கப்படவில்லை. புதிய கணக்குகளைப் பதிவு செய்ய தரவுத்தள இணைப்பு தேவை.'
        : 'Supabase authentication is not configured. An active database connection is required to create new accounts.'
    );
    setLoading(false);
  };

  const getInterestIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scale': return <Scale className="w-4 h-4 text-emerald-600" />;
      case 'TrendingUp': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'Store': return <Store className="w-4 h-4 text-amber-600" />;
      case 'Tractor': return <Tractor className="w-4 h-4 text-purple-600" />;
      case 'ShoppingBag': return <ShoppingBag className="w-4 h-4 text-rose-600" />;
      case 'Landmark': return <Landmark className="w-4 h-4 text-teal-600" />;
      default: return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-10 h-10 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 mt-4">
          {isTa ? 'அமர்வு சரிபார்க்கப்படுகிறது...' : 'Connecting your session...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        
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
          {step === 1 
            ? (isTa ? 'படி 1/2: பயனர் கணக்கு விவரங்கள்' : 'Step 1 of 2: Account & Login Credentials')
            : (isTa ? `படி 2/2: ${selectedRole === 'dealer' ? 'வியாபாரி' : selectedRole === 'machinery_provider' ? 'இயந்திர உரிமையாளர்' : 'விவசாயி'} சுயவிவரம்` : `Step 2 of 2: ${selectedRole === 'dealer' ? 'Dealer' : selectedRole === 'machinery_provider' ? 'Machinery Provider' : 'Farmer'} Onboarding Details`)}
        </p>

        {/* Step Progress Bar */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className={`h-1.5 w-24 rounded-full transition-all ${step >= 1 ? 'bg-agri-600' : 'bg-slate-200'}`} />
          <div className={`h-1.5 w-24 rounded-full transition-all ${step >= 2 ? 'bg-agri-600' : 'bg-slate-200'}`} />
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg border border-slate-200/90 rounded-3xl space-y-6">
          
          {/* Success Card */}
          {successNotice && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successNotice.title}</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                {successNotice.message}
              </p>
              <div className="pt-2">
                <Link
                  href={isSafeInternalRedirect(redirectParam) ? `/login?redirect=${encodeURIComponent(redirectParam!)}` : '/login'}
                  className="btn-primary w-full py-2.5 text-center text-xs font-bold block"
                >
                  {translations.auth.loginButton}
                </Link>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!successNotice && step === 1 && (
            /* ======================================================== */
            /* STEP 1: AUTHENTICATION CREDENTIALS & ACCOUNT FIELDS      */
            /* ======================================================== */
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {translations.auth.fullName} <span className="text-rose-500">*</span>
                </label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {translations.auth.email} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {translations.auth.phone} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98451 23456"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {translations.auth.password} <span className="text-rose-500">*</span>
                </label>
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
                className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 mt-4"
              >
                <span>{isTa ? 'அடுத்தது: பாத்திரம் மற்றும் சுயவிவரம்' : 'Next: Role & Profile Details'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {!successNotice && step === 2 && (
            /* ======================================================== */
            /* STEP 2: ROLE SELECTION & DYNAMIC ROLE-SPECIFIC QUESTIONS */
            /* ======================================================== */
            <form onSubmit={handleCompleteSignup} className="space-y-6">
              
              {/* Exactly Three Roles Selector: Farmer | Dealer | Machinery Provider */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  {isTa ? '1. உங்கள் முதன்மைப் பாத்திரத்தைத் தேர்ந்தெடுக்கவும்' : '1. Select Your Primary Role'} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {THREE_ROLES.map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-agri-50/90 border-agri-500 ring-2 ring-agri-500/20 text-agri-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl">{r.icon}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-agri-600 bg-agri-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="text-xs font-extrabold">{isTa ? r.labelTa : r.label}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {isTa ? r.descTa : r.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shared Geographic State & Cascading District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-agri-600" />
                    <span>{isTa ? 'மாநிலம்' : 'State / UT'} <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-agri-500"
                  >
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-agri-600" />
                    <span>{isTa ? 'மாவட்டம்' : 'District'} <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-agri-500"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ======================================================== */}
              {/* ROLE-SPECIFIC QUESTIONS: FARMER                          */}
              {/* ======================================================== */}
              {selectedRole === 'farmer' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Farmer Question: Primary Crops */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        {isTa ? 'முதன்மைப் பயிர்கள்' : 'Primary Crops Cultivated'} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-agri-700 bg-agri-50 px-2 py-0.5 rounded-full border border-agri-200">
                        {selectedCrops.length} {isTa ? 'தேர்வு செய்யப்பட்டது' : 'selected'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isTa ? 'நீங்கள் சாகுபடி செய்யும் பயிர்களைத் தேர்ந்தெடுக்கவும் (ஒன்றிற்கு மேற்பட்டவை):' : 'Select crops you cultivate on your farm (multi-select supported):'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {POPULAR_CROPS_ONBOARDING.map((crop) => {
                        const isChecked = selectedCrops.includes(crop.id);
                        return (
                          <button
                            key={crop.id}
                            type="button"
                            onClick={() => toggleCrop(crop.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                              isChecked
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{crop.icon}</span>
                            <span>{isTa ? crop.nameTa : crop.name}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Farmer Question: Main Interests */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        {isTa ? 'முக்கிய தள ஆர்வங்கள்' : 'Main Interests on AgriME'} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-agri-700 bg-agri-50 px-2 py-0.5 rounded-full border border-agri-200">
                        {selectedInterests.length} {isTa ? 'தேர்வு செய்யப்பட்டது' : 'selected'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {ONBOARDING_INTERESTS.map((item) => {
                        const isChecked = selectedInterests.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleInterest(item.id)}
                            className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {getInterestIcon(item.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {isTa ? item.nameTa : item.name}
                                </span>
                                <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                  isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3" />}
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {isTa ? item.descriptionTa : item.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* ROLE-SPECIFIC QUESTIONS: DEALER                          */}
              {/* ======================================================== */}
              {selectedRole === 'dealer' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Shop / Business Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isTa ? 'கடை / வணிக நிறுவனத்தின் பெயர்' : 'Shop / Business Name'} <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Sri Balaji Agro Traders & Mandi"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Business Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isTa ? 'வணிக முகவரி & தெரு விவரம்' : 'Business Address / Shop Location'} <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={dealerAddress}
                      onChange={(e) => setDealerAddress(e.target.value)}
                      placeholder="e.g. 14/2 APMC Market Yard Road, Near Bus Stand"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Real Interactive Map Pin / Location Picker */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isTa ? 'வணிக வரைபட இடம் (GPS பின்)' : 'Business Location Map Pin (GPS Coordinates)'} <span className="text-rose-500">*</span></span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {isTa 
                        ? 'வரைபடத்தில் கிளிக் செய்து உங்கள் கடையின் சரியான இருப்பிடத்தைக் குறிக்கவும் அல்லது ஜிபிஎஸ் பொத்தானைப் பயன்படுத்தவும்.' 
                        : 'Click on the map to pin your shop location or click "Use My Current GPS" for precision farmer routing:'}
                    </p>
                    <LocationPicker
                      latitude={dealerLat}
                      longitude={dealerLng}
                      district={selectedDistrict}
                      isTa={isTa}
                      onChange={({ latitude, longitude }) => {
                        setDealerLat(latitude);
                        setDealerLng(longitude);
                      }}
                    />
                  </div>

                  {/* Crop Varieties Bought */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        {isTa ? 'நீங்கள் வாங்கும் பயிர் வகைகள்' : 'Crop Varieties / Produce You Buy'} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {dealerBoughtCrops.length} {isTa ? 'தேர்வு' : 'selected'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {POPULAR_CROPS_ONBOARDING.map((crop) => {
                        const isChecked = dealerBoughtCrops.includes(crop.id);
                        return (
                          <button
                            key={crop.id}
                            type="button"
                            onClick={() => toggleDealerCrop(crop.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                              isChecked
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{crop.icon}</span>
                            <span>{isTa ? crop.nameTa : crop.name}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Custom Crop Variety */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={customCropInput}
                        onChange={(e) => setCustomCropInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomDealerCrop();
                          }
                        }}
                        placeholder={isTa ? 'மற்றொரு பயிர் சேர்க்க (எ.கா. சோளம், நிலக்கடலை)...' : 'Add custom crop (e.g. Groundnut, Coconut, Ragi)...'}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={addCustomDealerCrop}
                        className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isTa ? 'சேர்' : 'Add'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Produce Categories */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800">
                      {isTa ? 'கொள்முதல் செய்யும் பிரிவுகள்' : 'Produce Categories Handled'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRODUCE_CATEGORIES.map((cat) => {
                        const isChecked = dealerProduceCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleProduceCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isTa ? cat.labelTa : cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Purchasing Terms & Preferences */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isTa ? 'கொள்முதல் விதிமுறைகள் & பணம் வழங்கும் முறை' : 'Purchasing Terms & Payment Preference'}</span>
                      </label>
                      <input
                        type="text"
                        value={purchaseConditions}
                        onChange={(e) => setPurchaseConditions(e.target.value)}
                        placeholder="e.g. Spot cash, direct bank transfer, on-farm pickup"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isTa ? 'வேலை நேரங்கள்' : 'Operating / Mandi Hours'}</span>
                      </label>
                      <input
                        type="text"
                        value={openingHours}
                        onChange={(e) => setOpeningHours(e.target.value)}
                        placeholder="e.g. Mon - Sat: 06:00 AM - 08:00 PM"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* ROLE-SPECIFIC QUESTIONS: MACHINERY PROVIDER              */}
              {/* ======================================================== */}
              {selectedRole === 'machinery_provider' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Provider / Business Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isTa ? 'இயந்திர சேவை / நிறுவனத்தின் பெயர்' : 'Provider / Business Name'} <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      placeholder="e.g. Kongu Agri Machinery Rentals & Heavy Service"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Workshop / Service Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isTa ? 'பட்டறை / சேவை மைய முகவரி' : 'Workshop / Service Base Address'} <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={providerAddress}
                      onChange={(e) => setProviderAddress(e.target.value)}
                      placeholder="e.g. 5/88 Bypass Road, Near Tollgate"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Real Interactive Map Pin / Location Picker */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isTa ? 'இயந்திர பணிமனை வரைபட இடம் (GPS பின்)' : 'Machinery Base Location (GPS Coordinates)'} <span className="text-rose-500">*</span></span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {isTa 
                        ? 'வரைபடத்தில் கிளிக் செய்து உங்கள் இயந்திர பணிமனையின் இருப்பிடத்தைக் குறிக்கவும் அல்லது ஜிபிஎஸ் பொத்தானைப் பயன்படுத்தவும்.' 
                        : 'Click on the map to pin your machinery garage or click "Use My Current GPS" for real-time dispatch:'}
                    </p>
                    <LocationPicker
                      latitude={providerLat}
                      longitude={providerLng}
                      district={selectedDistrict}
                      isTa={isTa}
                      onChange={({ latitude, longitude }) => {
                        setProviderLat(latitude);
                        setProviderLng(longitude);
                      }}
                    />
                  </div>

                  {/* Machinery Types Offered */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        {isTa ? 'வழங்கப்படும் இயந்திர வகைகள்' : 'Machinery Types Offered'} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {machineryTypesOffered.length} {isTa ? 'தேர்வு' : 'selected'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {MACHINERY_TYPES.map((type) => {
                        const isChecked = machineryTypesOffered.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => toggleMachineryType(type)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                              isChecked
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-500'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Tractor className="w-3.5 h-3.5" />
                            <span>{type}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Machine Model & Hourly Rate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isTa ? 'முதன்மை இயந்திர மாதிரி' : 'Primary Machine Name & Model'} <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        value={primaryMachineName}
                        onChange={(e) => setPrimaryMachineName(e.target.value)}
                        placeholder="e.g. Mahindra 575 DI 45HP Tractor"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isTa ? 'மணிநேர வாடகை (ரூ.)' : 'Typical Hourly Rate (₹)'} <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        required
                        value={pricePerHour}
                        onChange={(e) => setPricePerHour(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Rental Terms & Service Scope */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isTa ? 'வாடகை விதிமுறைகள் & சேவை விவரங்கள்' : 'Rental / Service Details & Terms'}</span>
                    </label>
                    <input
                      type="text"
                      value={rentalTerms}
                      onChange={(e) => setRentalTerms(e.target.value)}
                      placeholder="e.g. Includes fuel and skilled operator; 24/7 service radius 30 km"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons: Back to Step 1 & Complete Registration */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 py-2.5 text-xs font-bold"
                >
                  {isTa ? '← படி 1-க்குத் திரும்பு' : '← Back to Step 1'}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-2 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>{translations.common.loading}</span>
                  ) : (
                    <>
                      <span>{isTa ? 'பதிவை முடிக்க' : 'Complete Registration'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            {translations.auth.alreadyHaveAccount}{' '}
            <Link 
              href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'} 
              className="text-agri-700 font-bold hover:underline"
            >
              {translations.auth.loginButton}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
