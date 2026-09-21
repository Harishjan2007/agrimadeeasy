'use client';

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Scale, 
  MapPin, 
  Calendar, 
  User, 
  DollarSign,
  MessageSquare,
  Info
} from 'lucide-react';
import { FarmerProduceListing, ProduceRequest } from '@/types';
import { createProduceRequest } from '@/lib/supabase/farmer-produce';
import { useLanguage } from '@/i18n';
import { getCropIcon } from '@/lib/supabase/crops';

interface SendProduceRequestModalProps {
  listing: FarmerProduceListing;
  buyerId: string;
  buyerName?: string;
  buyerPhone?: string;
  onClose: () => void;
  onSuccess: (request: ProduceRequest) => void;
}

export default function SendProduceRequestModal({
  listing,
  buyerId,
  buyerName,
  buyerPhone,
  onClose,
  onSuccess
}: SendProduceRequestModalProps) {
  const { language, translations, translateCrop } = useLanguage();
  const isTa = language === 'ta';
  const t = translations.farmerMarketplace;

  const [requestedQuantity, setRequestedQuantity] = useState<string>(
    String(listing.quantity > 10 ? 10 : listing.quantity)
  );
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Validation
  const parsedQty = parseFloat(requestedQuantity);
  const isQtyValid = !isNaN(parsedQty) && parsedQty > 0 && parsedQty <= listing.quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isQtyValid) {
      setError(
        isTa
          ? `அளவு 0 ஐ விட அதிகமாகவும் அதிகபட்சமாக ${listing.quantity} ${listing.unit} ஆகவும் இருக்க வேண்டும்`
          : `Requested quantity must be greater than 0 and at most ${listing.quantity} ${listing.unit}`
      );
      return;
    }

    if (!buyerId) {
      setError(
        isTa
          ? 'கோரிக்கை அனுப்ப நீங்கள் உள்நுழைய வேண்டும்'
          : 'You must be logged in to send a request'
      );
      return;
    }

    if (buyerId === listing.farmer_id) {
      setError(
        isTa
          ? 'உங்கள் சொந்த விளைபொருளுக்கு நீங்கள் கோரிக்கை அனுப்ப முடியாது'
          : 'You cannot send a purchase request to your own listing'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const newRequest = await createProduceRequest({
        listing_id: listing.id,
        buyer_id: buyerId,
        farmer_id: listing.farmer_id,
        requested_quantity: parsedQty,
        message: message.trim() || undefined
      });

      // Augment with buyer info for context display
      const populatedRequest: ProduceRequest = {
        ...newRequest,
        listing,
        buyer: {
          id: buyerId,
          name: buyerName || (isTa ? 'கொள்முதல் வாங்குபவர்' : 'Buyer'),
          full_name: buyerName || (isTa ? 'கொள்முதல் வாங்குபவர்' : 'Buyer'),
          email: '',
          phone: buyerPhone || '',
          role: 'farmer',
          location: '',
          created_at: new Date().toISOString()
        }
      };

      setSuccess(true);
      setTimeout(() => {
        onSuccess(populatedRequest);
      }, 1000);
    } catch (err: any) {
      console.error('Error sending produce request:', err);
      setError(err?.message || (isTa ? 'கோரிக்கை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Failed to send request. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedTotal = !isNaN(parsedQty) && parsedQty > 0
    ? (parsedQty * listing.asking_price).toLocaleString('en-IN')
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-emerald-950/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-hidden="true">
              {getCropIcon(listing.crop_name)}
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.sendRequest}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isTa ? 'விவசாயியிடம் நேரடியாகக் கோரிக்கை விடுங்கள்' : 'Connect directly with the listing farmer'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Listing Summary Card */}
        <div className="px-6 pt-5 pb-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 mb-1">
                  {listing.category}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {translateCrop(listing.crop_name)}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  {t.askingPrice}
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ₹{listing.asking_price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                  {listing.price_unit}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {t.availableQuantity}: <strong>{listing.quantity} {listing.unit}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{listing.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {isTa ? 'கிடைக்கும் நாள்: ' : 'Avail: '}
                  {new Date(listing.available_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {listing.farmer?.full_name || (isTa ? 'விவசாயி' : 'Farmer')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t.requestSuccess}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Requested Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.requestedQuantity} ({listing.unit}) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                max={listing.quantity}
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(e.target.value)}
                required
                disabled={isSubmitting || success}
                placeholder={isTa ? `எ.கா. 10` : `e.g. 10`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {listing.unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{t.maxAvailable}: {listing.quantity} {listing.unit}</span>
              {estimatedTotal && (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {isTa ? 'தோராய மதிப்பு:' : 'Est. Value:'} ₹{estimatedTotal}
                </span>
              )}
            </div>
          </div>

          {/* Message / Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.messageOptional}</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={isSubmitting || success}
              placeholder={
                isTa
                  ? 'எ.கா. நாங்கள் நேரடி கொள்முதல் செய்கிறோம். தர சோதனையை நேரில் பார்க்க விரும்புகிறோம்...'
                  : 'e.g., We are interested in bulk pickup. Looking to inspect quality on Thursday...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
            <p className="text-[11px] text-slate-400 text-right mt-0.5">
              {message.length}/500
            </p>
          </div>

          {/* Transparency Advisory */}
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <span>
              {isTa
                ? 'AgriME விவசாயிகளுக்கு தங்களது விளைபொருட்களை பட்டியலிட்டு கேட்கும் விலையை வாங்குபவர்களிடம் தெரிவிக்கும் நேரடி தளத்தை வழங்குகிறது. இருதரப்பினரும் பரஸ்பர ஒப்புதலின் பேரில் பரிவர்த்தனையை முடிக்கலாம்.'
                : 'AgriME provides farmers with an additional direct channel to list produce and communicate their asking price to buyers. Both parties finalize logistics upon mutual agreement.'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || success}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {translations.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isQtyValid || success}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.submitting}</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.requestSuccess}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t.sendRequest}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
