'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Store,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Plus,
  Edit3,
  Search,
  Filter,
  Package,
  Scale,
  ShoppingBag,
  MessageSquare,
  Phone,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Building2,
  TrendingUp,
  Tag,
  ArrowUpRight,
  Boxes,
  User,
  Navigation,
  Compass,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/supabase/useAuth';
import { useAgri } from '@/context/AgriContext';
import { useLanguage } from '@/i18n';
import { Dealer, DealerCropPrice, Product, ProductCategory } from '@/types';
import { MOCK_DEALERS } from '@/lib/mock-data';
import { FARM_STORE_CATEGORIES } from '@/lib/products-data';
import { getCropIcon } from '@/lib/supabase/crops';
import { PageHeader } from '@/components/ui';
import LocationPicker from '@/components/common/LocationPicker';
import { updateDealerProfile, updateDealerInquiryStatus } from '@/lib/supabase/dealers';
import { INDIAN_STATES_AND_UTS, getDistrictsForState } from '@/lib/indian-geography';

const AVAILABLE_PRODUCE_CATEGORIES = [
  'Grains & Cereals',
  'Pulses & Legumes',
  'Oilseeds',
  'Commercial & Cash Crops',
  'Spices & Condiments',
  'Vegetables & Tubers',
  'Fruits & Orchard Produce',
  'Plantation Produce'
];

const POPULAR_PROCUREMENT_CROPS = [
  'Paddy',
  'Groundnut',
  'Cotton',
  'Maize',
  'Black Gram',
  'Green Gram',
  'Sugarcane',
  'Turmeric',
  'Coconut',
  'Chili',
  'Soybean',
  'Onion',
  'Tomato'
];

export default function DealerPortalPage() {
  const { user, profile, role, loading: authLoading, isConfigured } = useAuth();
  const {
    dealers,
    crops,
    cropPrices,
    dealerCropPrices,
    products,
    inquiries,
    updateDealerCropPrice,
    addDealerCropPrice,
    addProduct,
    updateProductStock,
    updateInquiryStatus,
    updateDealer,
    updateCurrentUser
  } = useAgri();

  const { language, translations, translateCrop, translateRole } = useLanguage();
  const isTa = language === 'ta';

  // Active Tab
  const [activeTab, setActiveTab] = useState<'quotes' | 'inventory' | 'inquiries' | 'store'>('quotes');

  // Selected Demo Dealer (allows testing stores like d1, d2, d3)
  const [selectedDealerId, setSelectedDealerId] = useState<string>('d1');

  // Search & Filter States
  const [quoteSearch, setQuoteSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('All');
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'new' | 'contacted' | 'completed'>('all');

  // Modal States
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [newQuoteCropId, setNewQuoteCropId] = useState('');
  const [newQuotePrice, setNewQuotePrice] = useState<number | ''>('');
  const [newQuoteUnit, setNewQuoteUnit] = useState('₹/Quintal');

  const [showEditQuoteModal, setShowEditQuoteModal] = useState<DealerCropPrice | null>(null);
  const [editQuotePrice, setEditQuotePrice] = useState<number | ''>('');

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('Seeds');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
  const [newProdStock, setNewProdStock] = useState<number | ''>(50);
  const [newProdPackSize, setNewProdPackSize] = useState('25 kg Bag');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Task 7A: Edit Dealer Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editShopName, setEditShopName] = useState('');
  const [editDealerName, setEditDealerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editState, setEditState] = useState('Tamil Nadu');
  const [editDistrict, setEditDistrict] = useState('Thanjavur');
  const [editLat, setEditLat] = useState<number | ''>(10.787);
  const [editLng, setEditLng] = useState<number | ''>(79.1378);
  const [editOpeningHours, setEditOpeningHours] = useState('Mon - Sat: 8:00 AM - 7:00 PM');
  const [editPurchaseConditions, setEditPurchaseConditions] = useState('');
  const [editProduceCategories, setEditProduceCategories] = useState<string[]>([]);
  const [editBoughtCrops, setEditBoughtCrops] = useState<string[]>([]);
  const [newCropInput, setNewCropInput] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Stock Edit Inline State
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  // Success / Notice / Error Banner
  const [feedbackNotice, setFeedbackNotice] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackNotice({ message, type });
    setTimeout(() => setFeedbackNotice(null), 4500);
  };

  // 1. Loading State
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 mt-4">{translations.common.loading}</p>
      </div>
    );
  }

  // 2. Signed-Out Protection
  if (isConfigured && !user) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full mb-2">
              {isTa ? 'வியாபாரி அங்கீகாரம்' : 'Merchant Authentication'}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">{translations.auth.loginRequiredTitle}</h1>
            <p className="text-xs text-slate-500 mt-2">
              {isTa
                ? 'கொள்முதல் மேற்கோள்கள் மற்றும் சரக்குகளை நிர்வகிக்க உங்கள் வியாபாரி கணக்கில் உள்நுழையவும்.'
                : 'Please sign in with your registered Agricultural Dealer account to access quotes, listings, and trade tools.'}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link href="/login?redirect=/dealer" className="btn-primary w-full py-2.5 text-center text-sm font-bold">
              {translations.auth.loginButton}
            </Link>
            <Link href="/signup?redirect=/dealer" className="btn-secondary w-full py-2.5 text-center text-sm font-semibold">
              {translations.auth.signupTitle}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Role Restriction Guard (Signed in as Farmer or Machinery Provider)
  if (isConfigured && user && role !== 'dealer') {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full mb-2">
              {isTa ? 'அணுகல் கட்டுப்படுத்தப்பட்டது' : 'Access Restricted'}
            </span>
            <h1 className="text-xl font-extrabold text-slate-900">{isTa ? 'வியாபாரி பாத்திரம் தேவை' : 'Dealer Role Required'}</h1>
            <p className="text-xs text-slate-500 mt-2">
              {isTa
                ? `உங்கள் கணக்கு பாத்திரம் ${translateRole(role || 'farmer')}. வியாபாரி போர்ட்டல் பதிவு செய்யப்பட்ட விவசாய வியாபாரிகளுக்கு மட்டுமே.`
                : `Your active account role is ${translateRole(role || 'farmer')}. The Dealer Portal is strictly reserved for registered agricultural merchants and crop buyers.`}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link href="/" className="btn-primary w-full py-2.5 text-center text-sm font-bold">
              {isTa ? 'முகப்புப் பக்கத்திற்குத் திரும்பு' : 'Return to Farmer Home'}
            </Link>
            <Link href="/profile" className="btn-secondary w-full py-2.5 text-center text-sm font-semibold">
              {translations.nav.profile}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Resolve Active Dealer Entity
  const allDealersList = dealers && dealers.length > 0 ? dealers : MOCK_DEALERS;
  
  // Find dealer corresponding to logged-in user profile, or fallback to selected demo store
  const matchedUserDealer = user
    ? allDealersList.find((d) => d.profile_id === user.id || d.profile_id === profile?.id)
    : null;

  const activeDealer: Dealer = useMemo(() => {
    const base = matchedUserDealer || allDealersList.find((d) => d.id === selectedDealerId) || allDealersList[0];
    if (matchedUserDealer || user) {
      return {
        ...base,
        name: base.name || profile?.full_name || profile?.name,
        shop_name: base.shop_name || profile?.dealer_shop_name || profile?.shop_name || 'Agri Merchant',
        district: base.district || profile?.district || 'Thanjavur',
        state: base.state || profile?.state || 'Tamil Nadu',
        address: base.address || profile?.business_address || profile?.location || profile?.address || 'Mandi Complex',
        latitude: base.latitude ?? (profile?.latitude ? Number(profile.latitude) : undefined),
        longitude: base.longitude ?? (profile?.longitude ? Number(profile.longitude) : undefined),
        bought_crops: (base.bought_crops && base.bought_crops.length > 0)
          ? base.bought_crops
          : profile?.dealer_crops_purchased || (profile?.bought_crops as string[]) || ['Paddy', 'Groundnut'],
        produce_categories: (base.produce_categories && base.produce_categories.length > 0)
          ? base.produce_categories
          : (profile?.produce_categories as string[]) || ['Grains & Cereals', 'Pulses & Legumes'],
        purchase_conditions: base.purchase_conditions || profile?.dealer_purchase_conditions || (profile?.purchase_conditions as string) || '',
        opening_hours: base.opening_hours || (profile?.opening_hours as string) || 'Mon - Sat: 8:00 AM - 7:00 PM',
        phone: base.phone || profile?.phone || '9876543210'
      };
    }
    return base;
  }, [matchedUserDealer, allDealersList, selectedDealerId, user, profile]);

  // 5. Compute Dealer Metrics from REAL Context Data
  const dealerQuotes = dealerCropPrices.filter((p) => p.dealer_id === activeDealer.id);
  const activeQuotesCount = dealerQuotes.filter((p) => p.active).length;

  const dealerProducts = products.filter((p) => p.dealer_id === activeDealer.id);
  const totalStockUnits = dealerProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const lowStockCount = dealerProducts.filter((p) => p.stock > 0 && p.stock <= 15).length;
  const outOfStockCount = dealerProducts.filter((p) => p.stock === 0).length;

  const dealerInquiries = inquiries.filter((i) => i.dealerId === activeDealer.id);
  const newInquiriesCount = dealerInquiries.filter((i) => i.status === 'new').length;

  // Filtered Quotes
  const displayedQuotes = dealerQuotes.filter((q) => {
    if (!quoteSearch.trim()) return true;
    const name = q.crop?.name?.toLowerCase() || '';
    return name.includes(quoteSearch.toLowerCase().trim());
  });

  // Filtered Products
  const displayedProducts = dealerProducts.filter((p) => {
    const matchesCategory = selectedProductCategory === 'All' || p.category === selectedProductCategory;
    const matchesSearch = !productSearch.trim() || p.name.toLowerCase().includes(productSearch.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  // Filtered Inquiries
  const displayedInquiries = dealerInquiries.filter((inq) => {
    if (inquiryFilter === 'all') return true;
    return inq.status === inquiryFilter;
  });

  // Handle Add Crop Buying Quote
  const handleAddQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteCropId || !newQuotePrice || Number(newQuotePrice) <= 0) return;

    addDealerCropPrice(newQuoteCropId, Number(newQuotePrice), newQuoteUnit);
    showFeedback(isTa ? 'பயிர் கொள்முதல் விலை வெற்றிகரமாக சேர்க்கப்பட்டது!' : 'Crop buying quote published successfully!');
    setNewQuoteCropId('');
    setNewQuotePrice('');
    setShowAddQuoteModal(false);
  };

  // Handle Edit Quote Submit
  const handleEditQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditQuoteModal || !editQuotePrice || Number(editQuotePrice) <= 0) return;

    updateDealerCropPrice(showEditQuoteModal.id, Number(editQuotePrice));
    showFeedback(isTa ? 'கொள்முதல் விலை வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : 'Buying rate updated successfully!');
    setShowEditQuoteModal(null);
    setEditQuotePrice('');
  };

  // Handle Add Product Submit
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice || Number(newProdPrice) <= 0) return;

    const defaultImages: Record<string, string> = {
      Seeds: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      Fertilizers: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80',
      Equipment: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80',
      Pesticides: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=600&q=80',
      'Organic foods': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80'
    };

    addProduct({
      dealer_id: activeDealer.id,
      name: newProdName.trim(),
      category: newProdCategory,
      description: newProdDesc.trim() || `${newProdName.trim()} available for retail agricultural purchase.`,
      price: Number(newProdPrice),
      stock: Number(newProdStock) || 0,
      pack_size: newProdPackSize,
      unit: newProdPackSize,
      isDemo: true,
      image_url: defaultImages[newProdCategory] || defaultImages.Seeds
    });

    showFeedback(isTa ? 'புதிய தயாரிப்பு வெற்றிகரமாக பட்டியலிடப்பட்டது!' : 'Store product listed successfully!');
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
    setShowAddProductModal(false);
  };

  // Quick Stock Adjust
  const handleStockSave = (productId: string) => {
    updateProductStock(productId, Math.max(0, tempStockValue));
    setEditingStockId(null);
    showFeedback(isTa ? 'சரக்கு அளவு புதுப்பிக்கப்பட்டது!' : 'Inventory stock updated!');
  };

  // Handle Inquiry Status Update
  const handleUpdateInquiryStatus = async (inquiryId: string, status: 'new' | 'contacted' | 'completed') => {
    updateInquiryStatus(inquiryId, status);
    await updateDealerInquiryStatus(inquiryId, status);
    const label = status === 'contacted' ? (isTa ? 'தொடர்புகொள்ளப்பட்டது' : 'Contacted') : (isTa ? 'நிறைவடைந்தது' : 'Completed');
    showFeedback(isTa ? `விசாரணை நிலை "${label}" என மாற்றப்பட்டது!` : `Inquiry marked as ${label}!`);
  };

  // Open Edit Profile Modal
  const openEditProfileModal = () => {
    setEditShopName(activeDealer.shop_name || '');
    setEditDealerName(activeDealer.name || profile?.full_name || '');
    setEditPhone(activeDealer.phone || profile?.phone || '');
    setEditAddress(activeDealer.address || '');
    setEditState(activeDealer.state || 'Tamil Nadu');
    setEditDistrict(activeDealer.district || 'Thanjavur');
    setEditLat(activeDealer.latitude !== undefined && activeDealer.latitude !== null ? activeDealer.latitude : 10.787);
    setEditLng(activeDealer.longitude !== undefined && activeDealer.longitude !== null ? activeDealer.longitude : 79.1378);
    setEditOpeningHours(activeDealer.opening_hours || 'Mon - Sat: 8:00 AM - 7:00 PM');
    setEditPurchaseConditions(activeDealer.purchase_conditions || '');
    setEditProduceCategories(
      activeDealer.produce_categories && activeDealer.produce_categories.length > 0
        ? [...activeDealer.produce_categories]
        : ['Grains & Cereals', 'Pulses & Legumes']
    );
    setEditBoughtCrops(
      activeDealer.bought_crops && activeDealer.bought_crops.length > 0
        ? [...activeDealer.bought_crops]
        : ['Paddy', 'Groundnut']
    );
    setShowMapPicker(false);
    setShowEditProfileModal(true);
  };

  // Handle Save Profile Submit (Task 7A)
  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShopName.trim()) {
      showFeedback(isTa ? 'கடையின் பெயர் தேவை' : 'Shop name is required', 'info');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updates: Partial<Dealer> & { full_name?: string } = {
        shop_name: editShopName.trim(),
        name: editDealerName.trim() || undefined,
        full_name: editDealerName.trim() || undefined,
        phone: editPhone.trim(),
        address: editAddress.trim(),
        state: editState,
        district: editDistrict,
        latitude: editLat !== '' ? Number(editLat) : undefined,
        longitude: editLng !== '' ? Number(editLng) : undefined,
        opening_hours: editOpeningHours.trim(),
        purchase_conditions: editPurchaseConditions.trim(),
        produce_categories: editProduceCategories,
        bought_crops: editBoughtCrops
      };

      // 1. If Supabase is configured, persist to database first and verify success
      if (isConfigured) {
        const { error } = await updateDealerProfile(activeDealer.id, {
          ...updates,
          profile_id: user?.id || profile?.id
        });

        if (error) {
          console.error('Failed to update dealer profile in database:', error);
          showFeedback(
            isTa
              ? `வணிக விவரங்களை சேமிப்பதில் பிழை: ${error.message}`
              : `Failed to save dealer profile to database: ${error.message}`,
            'error'
          );
          return;
        }
      }

      // 2. Only update local context & localStorage if DB write succeeded (or in offline mode)
      updateDealer(activeDealer.id, updates);
      if (updateCurrentUser) {
        updateCurrentUser({
          full_name: editDealerName.trim() || undefined,
          phone: editPhone.trim(),
          district: editDistrict,
          state: editState,
          address: editAddress.trim(),
          business_address: editAddress.trim(),
          latitude: editLat !== '' ? Number(editLat) : undefined,
          longitude: editLng !== '' ? Number(editLng) : undefined,
          dealer_shop_name: editShopName.trim(),
          dealer_crops_purchased: editBoughtCrops,
          dealer_purchase_conditions: editPurchaseConditions.trim()
        });
      }

      showFeedback(
        isTa
          ? 'வணிக விவரங்கள் வெற்றிகரமாக சேமிக்கப்பட்டன!'
          : 'Dealer business profile updated and saved successfully!'
      );
      setShowEditProfileModal(false);
    } catch (err: any) {
      console.error('Failed to update dealer profile:', err);
      showFeedback(
        isTa
          ? `சுயவிவரத்தை சேமிப்பதில் பிழை: ${err?.message || 'பிணையப் பிழை'}`
          : `Error updating profile: ${err?.message || 'Unexpected error'}`,
        'error'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleProduceCategory = (cat: string) => {
    if (editProduceCategories.includes(cat)) {
      setEditProduceCategories(editProduceCategories.filter((c) => c !== cat));
    } else {
      setEditProduceCategories([...editProduceCategories, cat]);
    }
  };

  const addBoughtCrop = (cropName: string) => {
    const trimmed = cropName.trim();
    if (!trimmed) return;
    if (!editBoughtCrops.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setEditBoughtCrops([...editBoughtCrops, trimmed]);
    }
    setNewCropInput('');
  };

  const removeBoughtCrop = (cropName: string) => {
    setEditBoughtCrops(editBoughtCrops.filter((c) => c !== cropName));
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Top Breadcrumb & Quick Switcher */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-agri-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isTa ? 'முகப்புக்குச் செல்' : 'Back to Home'}</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/dealers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-agri-700 transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>{translations.dealerPortal.browseDealers}</span>
            </Link>
          </div>

          {/* Active Store Switcher for Demo Mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              {isTa ? 'செயலில் உள்ள கடை:' : 'Active Shop:'}
            </span>
            <select
              value={activeDealer.id}
              onChange={(e) => setSelectedDealerId(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              {allDealersList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.shop_name} ({d.district || 'Tamil Nadu'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Page Header */}
      <PageHeader
        title={translations.dealerPortal.title}
        subtitle={translations.dealerPortal.subtitle}
        badge={translations.dealerPortal.welcomeBadge}
        icon={Store}
        iconColor="text-amber-700"
        iconBg="bg-amber-50 border-amber-200/80"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddQuoteModal(true)}
              className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{translations.dealerPortal.addCropRate}</span>
            </button>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="btn-secondary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isTa ? 'புதிய தயாரிப்பைச் சேர்' : 'Add Store Product'}</span>
            </button>
          </div>
        }
      />

      {/* Feedback Alert Banner */}
      {feedbackNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 animate-in fade-in duration-200">
          <div
            className={`rounded-2xl p-4 flex items-center justify-between text-xs shadow-xs ${
              feedbackNotice.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : feedbackNotice.type === 'info'
                ? 'bg-blue-50 border border-blue-200 text-blue-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackNotice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="font-semibold">{feedbackNotice.message}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className={`font-bold ml-2 ${
                feedbackNotice.type === 'error'
                  ? 'text-rose-500 hover:text-rose-800'
                  : feedbackNotice.type === 'info'
                  ? 'text-blue-500 hover:text-blue-800'
                  : 'text-emerald-500 hover:text-emerald-800'
              }`}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Dealer Identity & Storefront Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-amber-500/10 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                    {activeDealer.shop_name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isTa ? 'சரிபார்க்கப்பட்ட கொள்முதலாளர்' : 'Verified Merchant'}</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    ID: {activeDealer.id.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  {activeDealer.name && (
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                      <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{activeDealer.name}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{activeDealer.address}</span>
                  </span>
                  {(activeDealer.district || activeDealer.state) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {[activeDealer.district, activeDealer.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${activeDealer.phone}`} className="text-agri-700 hover:underline">
                      {activeDealer.phone}
                    </a>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{activeDealer.opening_hours}</span>
                  </span>
                  {activeDealer.latitude !== undefined && activeDealer.longitude !== undefined && (
                    <a
                      href={`https://www.google.com/maps?q=${activeDealer.latitude},${activeDealer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Navigation className="w-3 h-3 text-blue-500" />
                      <span>{Number(activeDealer.latitude).toFixed(3)}°, {Number(activeDealer.longitude).toFixed(3)}°</span>
                    </a>
                  )}
                </div>

                {activeDealer.buyer_type && (
                  <p className="text-xs text-amber-900 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-1 font-semibold inline-block">
                    {activeDealer.buyer_type}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
              <button
                onClick={openEditProfileModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer"
                id="edit-dealer-profile-banner-btn"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{translations.profile.editProfile || 'Edit Profile'}</span>
              </button>
              <Link
                href={`/dealers/${activeDealer.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all"
              >
                <span>{isTa ? 'பொது கடையைக் காண்க' : 'View Public Storefront'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Real Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Active Crop Quotes */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                {isTa ? 'செயலில் உள்ள கொள்முதல் மேற்கோள்கள்' : 'Active Buying Quotes'}
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{activeQuotesCount}</h3>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {isTa ? 'நேரடி சந்தை விலை நிர்ணயம்' : 'Live Mandi Benchmark Rates'}
              </p>
            </div>
          </div>

          {/* 2. Listed Products */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                {isTa ? 'விற்பனைப் பொருட்கள்' : 'Products in Store'}
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{dealerProducts.length}</h3>
              <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                {isTa ? 'விதை, உரம், இடுபொருட்கள்' : 'Seeds, Fertilisers & Inputs'}
              </p>
            </div>
          </div>

          {/* 3. Total Inventory Stock */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                {isTa ? 'மொத்த சரக்கு கையிருப்பு' : 'Warehouse Stock Units'}
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalStockUnits}</h3>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                {lowStockCount > 0
                  ? isTa
                    ? `${lowStockCount} பொருட்கள் குறைந்த சரக்கு`
                    : `${lowStockCount} items low in stock`
                  : isTa
                  ? 'கையிருப்பு திருப்திகரமானது'
                  : 'Healthy warehouse inventory'}
              </p>
            </div>
          </div>

          {/* 4. Farmer Inquiries */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                {isTa ? 'விவசாயிகள் கோரிக்கைகள்' : 'Farmer Inquiries'}
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{dealerInquiries.length}</h3>
              <p className="text-[11px] font-semibold mt-0.5 text-purple-700">
                {newInquiriesCount > 0
                  ? isTa
                    ? `${newInquiriesCount} புதிய விசாரணைகள்`
                    : `${newInquiriesCount} new incoming offers`
                  : isTa
                  ? 'விசாரணைகள் புதுப்பிக்கப்பட்டன'
                  : 'All inquiries up to date'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto">
          {[
            {
              id: 'quotes',
              label: isTa ? 'பயிர் கொள்முதல் மேற்கோள்கள்' : 'Crop Procurement Quotes',
              icon: Scale,
              badge: activeQuotesCount
            },
            {
              id: 'inventory',
              label: isTa ? 'இடுபொருட்கள் & சரக்கு' : 'Store Products & Inventory',
              icon: Package,
              badge: dealerProducts.length
            },
            {
              id: 'inquiries',
              label: isTa ? 'விவசாயிகள் தொடர்புகள்' : 'Farmer Inquiries',
              icon: MessageSquare,
              badge: newInquiriesCount > 0 ? `${newInquiriesCount} New` : dealerInquiries.length
            },
            {
              id: 'store',
              label: isTa ? 'கடை & வர்த்தக விவரங்கள்' : 'Store Details & Terms',
              icon: Building2
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CROP PROCUREMENT QUOTES */}
        {/* ========================================================================= */}
        {activeTab === 'quotes' && (
          <div className="space-y-4">
            {/* Filter & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  placeholder={isTa ? 'பயிர்களைத் தேடுக...' : 'Search procurement crops...'}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddQuoteModal(true)}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{translations.dealerPortal.addCropRate}</span>
                </button>
              </div>
            </div>

            {/* Quotes Grid / Table */}
            {displayedQuotes.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
                <Scale className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">
                  {isTa ? 'கொள்முதல் மேற்கோள்கள் எதுவும் இல்லை' : 'No Procurement Quotes Found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isTa
                    ? 'விவசாயிகளிடமிருந்து நேரடியாக பயிர்களை வாங்க உங்கள் முதல் கொள்முதல் விலையைப் பதிவிடுங்கள்.'
                    : 'Start buying directly from farmers by posting your offered buying prices for Paddy, Groundnut, Cotton, or other crops.'}
                </p>
                <button
                  onClick={() => setShowAddQuoteModal(true)}
                  className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{translations.dealerPortal.addCropRate}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedQuotes.map((quote) => {
                  const cropObj = quote.crop || crops.find((c) => c.id === quote.crop_id);
                  const cropName = cropObj?.name || 'Agricultural Produce';
                  const cropIcon = getCropIcon(cropName, cropObj?.category);

                  // Find APMC benchmark price for comparison
                  const mandiBenchmark = cropPrices.find((p) => p.crop_id === quote.crop_id || p.crop?.name === cropName);
                  const benchmarkPrice = mandiBenchmark ? mandiBenchmark.modal_price || mandiBenchmark.price : null;
                  const priceDiff = benchmarkPrice ? quote.buying_price - benchmarkPrice : null;

                  return (
                    <div
                      key={quote.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                            {cropIcon}
                          </span>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">
                              {translateCrop(cropName)}
                            </h3>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {cropObj?.category || 'Field Crop'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            quote.active
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {quote.active ? (isTa ? 'செயலில் உள்ளது' : 'Active') : (isTa ? 'நிறுத்தப்பட்டது' : 'Inactive')}
                        </span>
                      </div>

                      {/* Offered Rate Card */}
                      <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 flex items-baseline justify-between">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-500 block">
                            {translations.dealerPortal.buyingPrice}
                          </span>
                          <span className="text-xl font-black text-amber-900">
                            ₹{quote.buying_price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">/ {quote.unit || 'Quintal'}</span>
                        </div>

                        {benchmarkPrice && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">{isTa ? 'மண்டி விலை:' : 'Mandi Base:'}</span>
                            <span className="text-xs font-bold text-slate-700">₹{benchmarkPrice.toLocaleString('en-IN')}</span>
                            {priceDiff !== null && (
                              <span
                                className={`text-[10px] font-bold block ${
                                  priceDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {priceDiff >= 0 ? `+₹${priceDiff}` : `-₹${Math.abs(priceDiff)}`} {isTa ? 'வேறுபாடு' : 'diff'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Terms & Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                          {quote.updated_at
                            ? new Date(quote.updated_at).toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
                                day: 'numeric',
                                month: 'short'
                              })
                            : 'Active Quote'}
                        </span>

                        <button
                          onClick={() => {
                            setShowEditQuoteModal(quote);
                            setEditQuotePrice(quote.buying_price);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/70 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>{translations.dealerPortal.updateRate}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: STORE PRODUCTS & INVENTORY */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={isTa ? 'தயாரிப்புகளைத் தேடுக...' : 'Search input store products...'}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isTa ? 'புதிய தயாரிப்பைச் சேர்' : 'Add Store Product'}</span>
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
                {FARM_STORE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedProductCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedProductCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {displayedProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">
                  {isTa ? 'தயாரிப்புகள் எதுவும் இல்லை' : 'No Store Products Found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isTa
                    ? 'விவசாயிகளுக்கு விதைகள், உரங்கள் அல்லது கருவிகளை விற்க புதிய தயாரிப்புகளைப் பட்டியலிடுங்கள்.'
                    : 'List seeds, certified fertilizers, tools, or farm inputs for sale in the AgriME retail marketplace.'}
                </p>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isTa ? 'புதிய தயாரிப்பைச் சேர்' : 'Add First Product'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedProducts.map((prod) => {
                  const isEditingStock = editingStockId === prod.id;
                  const isLow = prod.stock > 0 && prod.stock <= 15;
                  const isOut = prod.stock === 0;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-3">
                        {/* Image & Header */}
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            {prod.image_url ? (
                              <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mb-1">
                              {prod.category}
                            </span>
                            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-2">
                              {prod.name}
                            </h3>
                            {prod.pack_size && (
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{prod.pack_size}</p>
                            )}
                          </div>
                        </div>

                        {/* Price & Stock Display */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 block">
                              {isTa ? 'விற்பனை விலை' : 'Retail Price'}
                            </span>
                            <span className="text-lg font-black text-slate-900">
                              ₹{prod.price.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-semibold text-slate-500 block">
                              {isTa ? 'கையிருப்பு' : 'Warehouse Stock'}
                            </span>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isOut
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isOut
                                ? isTa
                                  ? 'கையிருப்பில்லை'
                                  : 'Out of Stock'
                                : `${prod.stock} ${isTa ? 'அலகுகள்' : 'units'}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stock Adjustment Controls */}
                      <div className="pt-2 border-t border-slate-100">
                        {isEditingStock ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                            />
                            <button
                              onClick={() => handleStockSave(prod.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                            >
                              {isTa ? 'சேமி' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateProductStock(prod.id, Math.max(0, prod.stock - 5))}
                                title="-5 Units"
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs"
                              >
                                -5
                              </button>
                              <button
                                onClick={() => updateProductStock(prod.id, prod.stock + 5)}
                                title="+5 Units"
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs"
                              >
                                +5
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                setEditingStockId(prod.id);
                                setTempStockValue(prod.stock);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-amber-800"
                            >
                              <Edit3 className="w-3 h-3 text-slate-400" />
                              <span>{isTa ? 'சரக்கை திருத்து' : 'Set Stock'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FARMER INQUIRIES & LOT OFFERS */}
        {/* ========================================================================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {/* Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">{translations.dealerPortal.inquiriesReceived}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isTa
                    ? 'விவசாயிகள் சமர்ப்பித்த பயிர் விற்பனை மற்றும் நேரடி கொள்முதல் விசாரணைகள்.'
                    : 'Direct crop harvest lot offers and procurement requests submitted by local farmers.'}
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'all', label: isTa ? `அனைத்தும் (${dealerInquiries.length})` : `All (${dealerInquiries.length})` },
                  { id: 'new', label: isTa ? `புதியவை (${newInquiriesCount})` : `New (${newInquiriesCount})` },
                  {
                    id: 'contacted',
                    label: isTa
                      ? `தொடர்புகொள்ளப்பட்டவை (${dealerInquiries.filter((i) => i.status === 'contacted').length})`
                      : `Contacted (${dealerInquiries.filter((i) => i.status === 'contacted').length})`
                  },
                  {
                    id: 'completed',
                    label: isTa
                      ? `நிறைவடைந்தவை (${dealerInquiries.filter((i) => i.status === 'completed').length})`
                      : `Completed (${dealerInquiries.filter((i) => i.status === 'completed').length})`
                  }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setInquiryFilter(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      inquiryFilter === f.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inquiries List */}
            {displayedInquiries.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">
                  {isTa ? 'விசாரணைகள் எதுவும் இல்லை' : 'No Farmer Inquiries in this Category'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isTa
                    ? 'விவசாயிகள் உங்கள் கடைப் பக்கத்தில் தொடர்பு கொள்ளும்போது அவர்களின் கொள்முதல் கோரிக்கைகள் இங்கே தோன்றும்.'
                    : 'When farmers view your procurement quotes and submit harvest quantity offers, their direct inquiries will appear here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedInquiries.map((inq) => {
                  return (
                    <div
                      key={inq.id}
                      className={`bg-white rounded-2xl p-5 border transition-all shadow-xs space-y-4 ${
                        inq.status === 'new'
                          ? 'border-amber-400 bg-amber-50/15 ring-2 ring-amber-100'
                          : inq.status === 'contacted'
                          ? 'border-blue-200'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-slate-900 text-sm sm:text-base">{inq.farmerName}</h3>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                inq.status === 'new'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : inq.status === 'contacted'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {inq.status}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {inq.createdAt
                                ? new Date(inq.createdAt).toLocaleString(isTa ? 'ta-IN' : 'en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-500 block font-semibold">
                                {isTa ? 'பயிர்' : 'Crop Offered'}
                              </span>
                              <span className="font-bold text-slate-800">{inq.cropName}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-500 block font-semibold">
                                {isTa ? 'எதிர்பார்க்கும் அளவு' : 'Quantity'}
                              </span>
                              <span className="font-bold text-slate-800">{inq.estimatedQuantity}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-500 block font-semibold">
                                {isTa ? 'எதிர்பார்க்கும் விலை' : 'Expected Rate'}
                              </span>
                              <span className="font-bold text-slate-800">{inq.expectedPrice}</span>
                            </div>
                          </div>

                          {inq.message && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                              "{inq.message}"
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                          <a
                            href={`tel:${inq.farmerPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{inq.farmerPhone}</span>
                          </a>

                          {inq.status === 'new' && (
                            <button
                              onClick={() => handleUpdateInquiryStatus(inq.id, 'contacted')}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              {isTa ? 'தொடர்புகொண்டேன்' : 'Mark Contacted'}
                            </button>
                          )}

                          {inq.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateInquiryStatus(inq.id, 'completed')}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            >
                              {isTa ? 'நிறைவு செய்' : 'Mark Completed'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: STORE & BUSINESS PROFILE DETAILS (TASK 7A) */}
        {/* ========================================================================= */}
        {activeTab === 'store' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">{translations.dealerPortal.shopDetails}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isTa
                    ? 'உங்கள் பதிவு செய்யப்பட்ட வர்த்தக சுயவிவரம், கொள்முதல் செய்யும் பயிர்கள் மற்றும் நிபந்தனைகள்.'
                    : 'Your registered merchant business profile, crops purchased from farmers, and trading conditions.'}
                </p>
              </div>
              <button
                onClick={openEditProfileModal}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                id="edit-dealer-profile-tab-btn"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{translations.profile.editProfile || 'Edit Profile'}</span>
              </button>
            </div>

            {/* Grid of Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shop / Business Name */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isTa ? 'வணிக / கடையின் பெயர்' : 'Shop / Business Name'}
                </span>
                <p className="text-sm font-black text-slate-900">
                  {activeDealer.shop_name || <span className="text-slate-400 font-normal italic">Not specified</span>}
                </p>
              </div>

              {/* Dealer / Contact Person Name */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isTa ? 'வியாபாரி / தொடர்பு நபர்' : 'Dealer / Contact Person'}
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {activeDealer.name || profile?.full_name || (
                    <span className="text-slate-400 font-normal italic">Not specified</span>
                  )}
                </p>
              </div>

              {/* Official Phone */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isTa ? 'தொலைபேசி எண்' : 'Official Phone'}
                </span>
                <p className="text-sm font-black text-slate-800">
                  <a href={`tel:${activeDealer.phone}`} className="hover:text-amber-700 hover:underline">
                    {activeDealer.phone || <span className="text-slate-400 font-normal italic">Not specified</span>}
                  </a>
                </p>
              </div>

              {/* State & District */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isTa ? 'மாநிலம் & மாவட்டம்' : 'State & District'}
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {[activeDealer.district, activeDealer.state].filter(Boolean).join(', ') || (
                    <span className="text-slate-400 font-normal italic">Tamil Nadu</span>
                  )}
                </p>
              </div>

              {/* Business Address */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isTa ? 'வணிக முகவரி' : 'Business Address'}
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  {activeDealer.address || <span className="text-slate-400 font-normal italic">Not specified</span>}
                </p>
              </div>

              {/* Map Location & GPS Coordinates */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  {isTa ? 'வரைபட இடம் & ஜிபிஎஸ் ஆயத்தொலைவுகள்' : 'Map Location & GPS Coordinates'}
                </span>
                {activeDealer.latitude !== undefined && activeDealer.longitude !== undefined && activeDealer.latitude !== null ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {Number(activeDealer.latitude).toFixed(4)}° N, {Number(activeDealer.longitude).toFixed(4)}° E
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {activeDealer.district || 'Verified Regional Market Hub'}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${activeDealer.latitude},${activeDealer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                      <span>{isTa ? 'கூகிள் வரைபடத்தில் திறக்கவும்' : 'Open in Google Maps'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                    <span>
                      {isTa
                        ? 'ஜிபிஎஸ் ஆயத்தொலைவுகள் இன்னும் பதிவு செய்யப்படவில்லை.'
                        : 'GPS map coordinates are not set yet. Edit profile to pin your location on the map.'}
                    </span>
                    <button
                      onClick={openEditProfileModal}
                      className="px-2.5 py-1 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 shrink-0"
                    >
                      {isTa ? 'இடம் குறிக்கவும்' : 'Set Location'}
                    </button>
                  </div>
                )}
              </div>

              {/* Crops Purchased from Farmers */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isTa ? 'விவசாயிகளிடமிருந்து கொள்முதல் செய்யப்படும் பயிர்கள்' : 'Crops or Produce Varieties Purchased from Farmers'}
                </span>
                {activeDealer.bought_crops && activeDealer.bought_crops.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeDealer.bought_crops.map((cropName) => (
                      <span
                        key={cropName}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs"
                      >
                        <Tag className="w-3 h-3 text-amber-600" />
                        <span>{translateCrop(cropName)}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {isTa ? 'பயிர்கள் இன்னும் குறிப்பிடப்படவில்லை.' : 'No specific crops specified yet. Edit profile to register crops purchased.'}
                  </p>
                )}
              </div>

              {/* Produce Categories Handled */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isTa ? 'கையாளப்படும் விவசாய விளைபொருள் பிரிவுகள்' : 'Produce Categories Handled'}
                </span>
                {activeDealer.produce_categories && activeDealer.produce_categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeDealer.produce_categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{cat}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {isTa ? 'விளைபொருள் பிரிவுகள் குறிப்பிடப்படவில்லை.' : 'All general agricultural commodities handled.'}
                  </p>
                )}
              </div>

              {/* Trading Hours */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isTa ? 'வேலை நேரங்கள்' : 'Trading / Mandi Hours'}
                </span>
                <p className="text-xs font-bold text-slate-800">
                  {activeDealer.opening_hours || 'Mon - Sat: 8:00 AM - 7:00 PM'}
                </p>
              </div>

              {/* Buyer Type */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isTa ? 'கொள்முதல் வகை' : 'Merchant / Buyer Category'}
                </span>
                <p className="text-xs font-bold text-slate-800">
                  {activeDealer.buyer_type || 'Commission Agent & Direct APMC Buyer'}
                </p>
              </div>

              {/* Purchasing Preferences & Conditions */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isTa ? 'கொள்முதல் விதிமுறைகள் & நிபந்தனைகள்' : 'Purchasing Preferences, Conditions & Terms'}
                </span>
                <p className="text-xs font-medium text-slate-700 leading-relaxed">
                  {activeDealer.purchase_conditions || (
                    <span className="text-slate-400 italic">
                      {isTa
                        ? 'நிலையான ஈரப்பத அளவு சோதனை, உடனடி மின்னணு எடை மற்றும் அதே நாளில் வங்கிக் கணக்கில் பணம் செலுத்துதல்.'
                        : 'Moisture < 14%, immediate electronic weighment & spot RTGS/NEFT payment upon delivery.'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <button
                onClick={openEditProfileModal}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{translations.profile.editProfile || 'Edit Profile'}</span>
              </button>

              <Link
                href={`/dealers/${activeDealer.id}`}
                target="_blank"
                className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <span>{isTa ? 'விவசாயிகளுக்கு தெரியும் பக்கத்தைக் காண்க' : 'Open Public Storefront'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD CROP BUYING RATE */}
      {/* ========================================================================= */}
      {showAddQuoteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {translations.dealerPortal.addCropRate}
                </h3>
              </div>
              <button
                onClick={() => setShowAddQuoteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuoteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {translations.dealerPortal.cropName} *
                </label>
                <select
                  required
                  value={newQuoteCropId}
                  onChange={(e) => setNewQuoteCropId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">{isTa ? 'பயிரைத் தேர்ந்தெடுக்கவும்...' : 'Select Crop...'}</option>
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name} ({crop.category || 'Produce'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {translations.dealerPortal.buyingPrice} (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newQuotePrice}
                    onChange={(e) => setNewQuotePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 3500"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {translations.dealerPortal.unit} *
                  </label>
                  <select
                    value={newQuoteUnit}
                    onChange={(e) => setNewQuoteUnit(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="₹/Quintal">₹/Quintal (100 kg)</option>
                    <option value="₹/kg">₹/kg</option>
                    <option value="₹/Bag (50kg)">₹/Bag (50 kg)</option>
                    <option value="₹/Tonne">₹/Tonne</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddQuoteModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  {translations.common.cancel}
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  {translations.dealerPortal.addCropRate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT CROP BUYING RATE */}
      {/* ========================================================================= */}
      {showEditQuoteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {translations.dealerPortal.updateRate}
                </h3>
              </div>
              <button
                onClick={() => setShowEditQuoteModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditQuoteSubmit} className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 block mb-1">
                  {isTa ? 'பயிர் வகை' : 'Crop'}:
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {showEditQuoteModal.crop?.name || 'Selected Crop'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTa ? 'புதிய கொள்முதல் விலை (₹)' : 'New Offered Buying Rate (₹)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editQuotePrice}
                  onChange={(e) => setEditQuotePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditQuoteModal(null)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  {translations.common.cancel}
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  {translations.dealerPortal.updateRate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD STORE PRODUCT */}
      {/* ========================================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {isTa ? 'புதிய தயாரிப்பைச் சேர்' : 'List New Store Product'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTa ? 'தயாரிப்பு பெயர்' : 'Product Title'} *
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Certified Paddy Seeds CO-51"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTa ? 'பிரிவு' : 'Category'} *
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Seeds">Seeds</option>
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Equipment">Simple Equipment</option>
                    <option value="Pesticides">Pesticides</option>
                    <option value="Organic foods">Organic Foods</option>
                    <option value="Other agricultural products">Other Agri Inputs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTa ? 'தொகுப்பு அளவு' : 'Pack Size / Unit'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdPackSize}
                    onChange={(e) => setNewProdPackSize(e.target.value)}
                    placeholder="e.g. 25 kg Bag, 1 L Bottle"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTa ? 'விலை (₹)' : 'Selling Price (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 1150"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTa ? 'தொடக்க கையிருப்பு' : 'Initial Stock Count'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTa ? 'விளக்கம்' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="e.g. High germination breeder seeds certified by agriculture department."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  {translations.common.cancel}
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  {isTa ? 'பட்டியலிடு' : 'List Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TASK 7A: EDIT DEALER BUSINESS PROFILE MODAL */}
      {/* ========================================================================= */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {isTa ? 'வியாபாரி வணிக சுயவிவரத்தை திருத்து' : 'Edit Dealer Business Profile'}
                </h3>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfileSubmit} className="space-y-4 text-xs">
              {/* Business Name & Contact Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isTa ? 'கடையின் / வணிகத்தின் பெயர்' : 'Shop / Business Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editShopName}
                    onChange={(e) => setEditShopName(e.target.value)}
                    placeholder="e.g. Krishna Agro Traders"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isTa ? 'வியாபாரி / தொடர்பு நபர் பெயர்' : 'Dealer / Contact Person Name'}
                  </label>
                  <input
                    type="text"
                    value={editDealerName}
                    onChange={(e) => setEditDealerName(e.target.value)}
                    placeholder="e.g. R. Krishnan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              {/* Phone & Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isTa ? 'அதிகாரப்பூர்வ தொலைபேசி எண்' : 'Official Phone'} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isTa ? 'வேலை நேரங்கள்' : 'Trading / Opening Hours'}
                  </label>
                  <input
                    type="text"
                    value={editOpeningHours}
                    onChange={(e) => setEditOpeningHours(e.target.value)}
                    placeholder="e.g. Mon - Sat: 8:00 AM - 7:00 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* State & District */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isTa ? 'மாநிலம்' : 'State'} *
                  </label>
                  <select
                    value={editState}
                    onChange={(e) => {
                      const newState = e.target.value;
                      setEditState(newState);
                      const districts = getDistrictsForState(newState);
                      if (districts.length > 0) setEditDistrict(districts[0]);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
                  >
                    {INDIAN_STATES_AND_UTS.map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isTa ? 'மாவட்டம்' : 'District'} *
                  </label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
                  >
                    {getDistrictsForState(editState).map((d: string) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Physical Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'வணிக முகவரி (கடை / மண்டி எண்)' : 'Business Address (Shop / Mandi Complex)'} *
                </label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Shop 14, Main APMC Mandi Complex, Thanjavur"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              {/* Map Location & Coordinates */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    {isTa ? 'வரைபட இடம் & துல்லியமான ஆயத்தொலைவுகள்' : 'Map Location & Usable GPS Coordinates'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(!showMapPicker)}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{showMapPicker ? (isTa ? 'வரைபடத்தை மறை' : 'Hide Map') : (isTa ? 'வரைபடத்தைத் திற' : 'Pick on Map')}</span>
                  </button>
                </div>

                {showMapPicker && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 mb-2">
                    <LocationPicker
                      latitude={editLat !== '' ? Number(editLat) : 10.787}
                      longitude={editLng !== '' ? Number(editLng) : 79.1378}
                      onChange={({ latitude, longitude }) => {
                        setEditLat(latitude);
                        setEditLng(longitude);
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block">{isTa ? 'அட்சரேகை (Latitude)' : 'Latitude (°N)'}</span>
                    <input
                      type="number"
                      step="any"
                      value={editLat}
                      onChange={(e) => setEditLat(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 10.7870"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">{isTa ? 'தீர்க்கரேகை (Longitude)' : 'Longitude (°E)'}</span>
                    <input
                      type="number"
                      step="any"
                      value={editLng}
                      onChange={(e) => setEditLng(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 79.1378"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Crops Purchased from Farmers */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'விவசாயிகளிடமிருந்து நீங்கள் வாங்கும் பயிர்கள்' : 'Crops or Produce Varieties Purchased from Farmers'}
                </label>
                {/* Current Selected Badges */}
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 min-h-[40px] items-center">
                  {editBoughtCrops.length === 0 ? (
                    <span className="text-slate-400 text-[11px] italic">No crops added yet. Add below:</span>
                  ) : (
                    editBoughtCrops.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300"
                      >
                        <span>{c}</span>
                        <button
                          type="button"
                          onClick={() => removeBoughtCrop(c)}
                          className="hover:text-amber-700 text-slate-400 font-extrabold cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Popular Crop Quick-Add Chips */}
                <div className="pt-1.5">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Quick Add Popular Crops:</span>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_PROCUREMENT_CROPS.map((cropName) => {
                      const isAdded = editBoughtCrops.some((c) => c.toLowerCase() === cropName.toLowerCase());
                      return (
                        <button
                          key={cropName}
                          type="button"
                          onClick={() => {
                            if (isAdded) removeBoughtCrop(cropName);
                            else addBoughtCrop(cropName);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isAdded ? `✓ ${cropName}` : `+ ${cropName}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Crop Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newCropInput}
                    onChange={(e) => setNewCropInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addBoughtCrop(newCropInput);
                      }
                    }}
                    placeholder="Type other crop name and press Add..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addBoughtCrop(newCropInput)}
                    className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Produce Categories Handled */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'கையாளப்படும் விவசாய விளைபொருள் பிரிவுகள்' : 'Produce Categories Handled'}
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {AVAILABLE_PRODUCE_CATEGORIES.map((cat) => {
                    const isChecked = editProduceCategories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProduceCategory(cat)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>{cat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Purchasing Preferences & Terms */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isTa ? 'கொள்முதல் விருப்பத்தேர்வுகள், நிபந்தனைகள் & கட்டண முறை' : 'Purchasing Preferences, Quality Conditions & Payment Terms'}
                </label>
                <textarea
                  rows={2}
                  value={editPurchaseConditions}
                  onChange={(e) => setEditPurchaseConditions(e.target.value)}
                  placeholder="e.g. Moisture < 14%, immediate weighment, same-day direct bank transfer / cash payment."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                  disabled={isSavingProfile}
                >
                  {translations.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-primary text-xs py-2 px-5 font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{translations.common.loading}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{translations.common.save}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
