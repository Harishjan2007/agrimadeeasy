'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Store, 
  MapPin, 
  Phone, 
  Clock, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Dealer, DealerCropPrice } from '@/types';
import { getDealerById } from '@/lib/supabase/dealers';
import { useLanguage } from '@/i18n';

export default function DealerDetailsPage() {
  const params = useParams();
  const dealerId = (params?.id as string) || '';
  const { language, translations, translateCrop, translateCategory } = useLanguage();

  const isTa = language === 'ta';

  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [activeCropPrices, setActiveCropPrices] = useState<DealerCropPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);

  const loadDealer = useCallback(async () => {
    if (!dealerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getDealerById(dealerId);
      if (res.error) {
        setError(res.error.message);
      } else {
        setDealer(res.data);
        setActiveCropPrices(res.cropPrices || []);
      }
    } catch (err) {
      console.error('Failed to load dealer details:', err);
      setError(translations.dealers.dealerNotFoundDesc);
    } finally {
      setLoading(false);
    }
  }, [dealerId, translations.dealers.dealerNotFoundDesc]);

  useEffect(() => {
    loadDealer();
  }, [loadDealer]);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySuccess(true);
    setTimeout(() => {
      setInquirySuccess(false);
      setInquiryModalOpen(false);
      setCropName('');
      setQuantity('');
      setExpectedPrice('');
    }, 2500);
  };

  // Loading State
  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen pb-16">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/dealers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-agri-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{translations.dealers.backToDealers}</span>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-pulse space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-slate-200"></div>
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
              <div className="h-16 bg-slate-100 rounded-2xl"></div>
              <div className="h-16 bg-slate-100 rounded-2xl"></div>
              <div className="h-16 bg-slate-100 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!dealer) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{translations.dealers.dealerNotFound}</h1>
            <p className="text-xs text-slate-500 mt-2">
              {translations.dealers.dealerNotFoundDesc}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/dealers" className="btn-primary w-full py-2.5 text-center text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>← {translations.dealers.backToDealers}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dealers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-agri-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← {translations.dealers.backToDealers}</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Error Notice */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs">
            <span>{error}</span>
            <button onClick={() => loadDealer()} className="font-semibold underline">{translations.common.retry}</button>
          </div>
        )}

        {/* Dealer Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-sm">
                <Store className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {dealer.shop_name}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {translations.dealers.directBuyerBadge}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`tel:${dealer.phone.replace(/\s+/g, '')}`}
                className="btn-secondary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-agri-600" />
                <span>{translations.dealers.contactDealer}: {dealer.phone}</span>
              </a>

              <button
                onClick={() => setInquiryModalOpen(true)}
                className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{translations.dealers.inquireSale}</span>
              </button>
            </div>

          </div>

          {/* Details Grid: Address, Phone, Hours */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {translations.dealers.address}
                </span>
                <span className="text-xs sm:text-sm text-slate-800 font-medium">{dealer.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <Phone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {translations.dealers.phone}
                </span>
                <span className="text-xs sm:text-sm text-slate-900 font-bold">{dealer.phone}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {translations.dealers.openingHours}
                </span>
                <span className="text-xs sm:text-sm text-slate-800 font-medium">{dealer.opening_hours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Crops We Buy Section */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{translations.dealers.cropsWeBuy}</span>
                <span className="text-xs bg-agri-100 text-agri-800 font-semibold px-2 py-0.5 rounded-full">
                  {activeCropPrices.length} {isTa ? 'பயிர்கள்' : 'Crops Active'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {isTa ? 'வியாபாரி குறிப்பிடும் கொள்முதல் விலைகள் (குவிண்டாலுக்கு)' : 'Dealer offered procurement rates per quintal (subject to lot quality)'}
              </p>
            </div>
          </div>

          {activeCropPrices.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                {isTa ? 'தற்போது கொள்முதல் விலைகள் எதுவும் பட்டியலிடப்படவில்லை.' : 'No active buying rates listed currently.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isTa ? 'விலை விவரங்களை அறிய வியாபாரியை நேரடியாக அழைக்கவும்.' : 'Please call the merchant directly to negotiate lot quotes.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCropPrices.map((cp) => (
                <div
                  key={cp.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-agri-50 to-agri-100 border border-agri-200 flex items-center justify-center text-2xl shrink-0">
                        {cp.crop?.icon || '🌾'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {translateCrop(cp.crop?.name)}
                        </h3>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold uppercase inline-block mt-0.5">
                          {translateCategory(cp.crop?.category)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-agri-50/70 rounded-xl border border-agri-200/70">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      {translations.dealers.buyingPrice}
                    </span>
                    <div className="text-xl font-black text-emerald-700 mt-0.5">
                      ₹{Number(cp.buying_price).toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-medium text-slate-500">
                        {isTa ? '₹/குவிண்டால்' : cp.unit}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCropName(cp.crop?.name || '');
                      setExpectedPrice(cp.buying_price.toString());
                      setInquiryModalOpen(true);
                    }}
                    className="btn-primary w-full text-xs py-2"
                  >
                    {isTa ? `${translateCrop(cp.crop?.name)} விற்க` : `Sell ${cp.crop?.name}`}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Produce Sale Inquiry Modal */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {translations.dealers.inquireSaleModalTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isTa 
                ? `உங்கள் விளைச்சல் விவரங்களை நேரடியாக ${dealer.shop_name}-க்கு அனுப்பவும்.`
                : `Sending your harvest details to ${dealer.shop_name} for instant price confirmation.`}
            </p>

            {inquirySuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center my-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-800">{translations.dealers.inquirySuccess}</h4>
                <p className="text-xs text-emerald-600 mt-1">
                  {isTa 
                    ? `வியாபாரி விரைவில் உங்கள் தொலைபேசி எண்ணை (${farmerPhone || 'தொடர்பு எண்'}) தொடர்புகொள்வார்.`
                    : `The merchant will contact you shortly at ${farmerPhone || 'your phone'} to confirm lot pickup and payment.`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {translations.dealers.farmerNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder="e.g. Murugan Ramasamy"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {translations.dealers.farmerPhoneLabel}
                  </label>
                  <input
                    type="tel"
                    required
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    placeholder="+91 98451 00000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isTa ? 'பயிர் வகை' : 'Crop Variety'}
                    </label>
                    <input
                      type="text"
                      required
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      placeholder="e.g. Paddy Samba"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {translations.dealers.quantityAvailable}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isTa ? 'எதிர்பார்க்கும் விலை (₹/குவிண்டால்)' : 'Expected Rate (₹/Quintal)'}
                  </label>
                  <input
                    type="number"
                    value={expectedPrice}
                    onChange={(e) => setExpectedPrice(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-agri-500"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setInquiryModalOpen(false)}
                    className="btn-secondary w-1/2 text-xs py-2.5"
                  >
                    {translations.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary w-1/2 text-xs py-2.5"
                  >
                    {translations.dealers.submitInquiryBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
