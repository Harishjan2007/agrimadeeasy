'use client';

import React, { useState } from 'react';
import { 
  X, 
  Inbox, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Phone, 
  User, 
  MapPin, 
  Calendar, 
  Scale, 
  MessageSquare, 
  AlertCircle,
  Check,
  Ban
} from 'lucide-react';
import { ProduceRequest, ProduceRequestStatus } from '@/types';
import { useLanguage } from '@/i18n';
import { getCropIcon } from '@/lib/supabase/crops';

interface ProduceRequestsModalProps {
  currentUserId: string;
  requests: ProduceRequest[];
  defaultTab?: 'incoming' | 'sent';
  onClose: () => void;
  onUpdateStatus: (requestId: string, newStatus: ProduceRequestStatus) => Promise<void>;
}

export default function ProduceRequestsModal({
  currentUserId,
  requests,
  defaultTab = 'incoming',
  onClose,
  onUpdateStatus
}: ProduceRequestsModalProps) {
  const { language, translations, translateCrop } = useLanguage();
  const isTa = language === 'ta';
  const t = translations.farmerMarketplace;

  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>(defaultTab);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter incoming requests (farmer role: where listing farmer is current user)
  const incomingRequests = requests.filter(
    (req) => req.listing?.farmer_id === currentUserId
  );

  // Filter sent requests (buyer role: where buyer is current user)
  const sentRequests = requests.filter((req) => req.buyer_id === currentUserId);

  const handleStatusChange = async (requestId: string, newStatus: ProduceRequestStatus) => {
    try {
      setUpdatingId(requestId);
      setError(null);
      await onUpdateStatus(requestId, newStatus);
    } catch (err: any) {
      console.error('Error updating request status:', err);
      setError(err?.message || (isTa ? 'நிலையை மாற்ற முடியவில்லை' : 'Failed to update request status'));
    } finally {
      setUpdatingId(null);
    }
  };

  const renderStatusBadge = (status: ProduceRequestStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>{t.reqStatusPending}</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t.reqStatusAccepted}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            <span>{t.reqStatusRejected}</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t.reqStatusCompleted}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-emerald-950/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.requests}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isTa
                    ? 'விவசாயி மற்றும் வாங்குபவர் இடையேயான நேரடி தொடர்பு கோரிக்கைகள்'
                    : 'Manage buyer expressions of interest and your sent purchase requests'}
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

          {/* Sub-tabs */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('incoming')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'incoming'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>{t.incomingRequests}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-slate-700">
                {incomingRequests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'sent'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.sentRequests}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-slate-700">
                {sentRequests.length}
              </span>
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'incoming' ? (
            incomingRequests.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                  📭
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {isTa ? 'உள்வரும் கோரிக்கைகள் எதுவும் இல்லை' : 'No incoming buyer requests yet'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {isTa
                    ? 'வாங்குபவர்கள் உங்கள் விளைபொருளைத் தேர்வு செய்து கோரிக்கை அனுப்பும்போது இங்கே தோன்றும்.'
                    : 'When buyers find your produce listings and request to purchase, they will appear here.'}
                </p>
              </div>
            ) : (
              incomingRequests.map((req) => {
                const listing = req.listing;
                const isBusy = updatingId === req.id;
                const estTotal = listing
                  ? (req.requested_quantity * listing.asking_price).toLocaleString('en-IN')
                  : null;

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    {/* Produce & Status header */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl" role="img" aria-hidden="true">
                          {listing ? getCropIcon(listing.crop_name) : '🌾'}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {listing ? translateCrop(listing.crop_name) : (isTa ? 'விளைபொருள்' : 'Produce')}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {t.askingPrice}: ₹{listing?.asking_price.toLocaleString('en-IN')} {listing?.price_unit}
                          </span>
                        </div>
                      </div>
                      {renderStatusBadge(req.status)}
                    </div>

                    {/* Buyer & Quantity details */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">
                            {isTa ? 'வாங்குபவர்' : 'Buyer'}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {req.buyer?.name || req.buyer?.full_name || (isTa ? 'கொள்முதல் வாங்குபவர்' : 'Buyer')}
                          </span>
                        </div>
                      </div>

                      {req.buyer?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-slate-400 block text-[10px]">
                              {isTa ? 'தொலைபேசி' : 'Phone'}
                            </span>
                            <a 
                              href={`tel:${req.buyer.phone}`}
                              className="font-semibold text-emerald-600 hover:underline"
                            >
                              {req.buyer.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">
                            {t.requestedQuantity}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {req.requested_quantity} {listing?.unit || 'Units'}
                            {estTotal && (
                              <span className="font-normal text-emerald-600 ml-1.5">
                                (≈ ₹{estTotal})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">
                            {isTa ? 'கோரிய நாள்' : 'Requested On'}
                          </span>
                          <span>
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Buyer Message */}
                    {req.message && (
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic">"{req.message}"</span>
                      </div>
                    )}

                    {/* Actions for Farmer */}
                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(req.id, 'rejected')}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t.reject}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(req.id, 'accepted')}
                          disabled={isBusy}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                        >
                          {isBusy ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{t.accept}</span>
                        </button>
                      </div>
                    )}

                    {req.status === 'accepted' && (
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                          {isTa
                            ? '✓ கோரிக்கை ஏற்கப்பட்டது. வாங்குபவரை தொடர்பு கொண்டு ஏற்பாடுகளை உறுதிசெய்யவும்.'
                            : '✓ Accepted. Contact buyer directly to coordinate payment and pickup.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(req.id, 'completed')}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <span>{t.markCompleted}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            sentRequests.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                  📨
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {isTa ? 'நீங்கள் அனுப்பிய கோரிக்கைகள் எதுவும் இல்லை' : 'You have not sent any produce requests yet'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {isTa
                    ? 'விவசாயிகளின் விளைபொருள் பட்டியல்களைப் பார்த்து "கோரிக்கை அனுப்பு" மூலம் தொடர்பு கொள்ளலாம்.'
                    : 'Browse farmer produce in the marketplace and click "Send Request" to purchase directly.'}
                </p>
              </div>
            ) : (
              sentRequests.map((req) => {
                const listing = req.listing;
                const estTotal = listing
                  ? (req.requested_quantity * listing.asking_price).toLocaleString('en-IN')
                  : null;

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl" role="img" aria-hidden="true">
                          {listing ? getCropIcon(listing.crop_name) : '🌾'}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {listing ? translateCrop(listing.crop_name) : (isTa ? 'விளைபொருள்' : 'Produce')}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {listing?.location} • {t.askingPrice}: ₹{listing?.asking_price.toLocaleString('en-IN')} {listing?.price_unit}
                          </span>
                        </div>
                      </div>
                      {renderStatusBadge(req.status)}
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">
                            {t.requestedQuantity}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {req.requested_quantity} {listing?.unit || 'Units'}
                            {estTotal && (
                              <span className="font-normal text-emerald-600 ml-1.5">
                                (≈ ₹{estTotal})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">
                            {isTa ? 'கோரிக்கை அனுப்பிய நாள்' : 'Date Sent'}
                          </span>
                          <span>
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Farmer contact if accepted */}
                      {req.status === 'accepted' && listing?.farmer && (
                        <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-emerald-700 dark:text-emerald-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>{listing.farmer.name || listing.farmer.full_name}</span>
                          </span>
                          {listing.farmer.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              <a href={`tel:${listing.farmer.phone}`} className="underline font-bold">
                                {listing.farmer.phone}
                              </a>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {req.message && (
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic">"{req.message}"</span>
                      </div>
                    )}

                    {/* Pending advisory */}
                    {req.status === 'pending' && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        {isTa
                          ? '⏳ விவசாயியின் பதிலுக்காக காத்திருக்கிறது...'
                          : '⏳ Awaiting farmer review...'}
                      </p>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            {translations.common.close}
          </button>
        </div>
      </div>
    </div>
  );
}
