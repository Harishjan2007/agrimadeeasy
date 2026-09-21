'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sprout, 
  Edit3, 
  Trash2, 
  Plus, 
  MapPin, 
  Calendar, 
  Scale, 
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  Tag
} from 'lucide-react';
import { FarmerProduceListing, ListingStatus } from '@/types';
import { useLanguage } from '@/i18n';
import { getCropIcon } from '@/lib/supabase/crops';

interface MyProduceListingsModalProps {
  listings: FarmerProduceListing[];
  farmerId: string;
  onClose: () => void;
  onEdit: (listing: FarmerProduceListing) => void;
  onDelete: (listingId: string) => Promise<void>;
  onAddNew: () => void;
}

export default function MyProduceListingsModal({
  listings,
  farmerId,
  onClose,
  onEdit,
  onDelete,
  onAddNew
}: MyProduceListingsModalProps) {
  const { language, translations, translateCrop } = useLanguage();
  const isTa = language === 'ta';
  const t = translations.farmerMarketplace;

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter listings belonging to this farmer
  const myListings = listings.filter((l) => l.farmer_id === farmerId);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setError(null);
      await onDelete(id);
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Error deleting listing:', err);
      setError(err?.message || (isTa ? 'நீக்க முடியவில்லை' : 'Failed to delete listing'));
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {t.statusActive}
          </span>
        );
      case 'sold':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {t.statusSold}
          </span>
        );
      case 'delisted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {t.statusDelisted}
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-emerald-950/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.myListings}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isTa
                  ? `மொத்தம் ${myListings.length} விளைபொருள் பட்டியல்கள் உள்ளன`
                  : `You have ${myListings.length} active/past produce listings`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAddNew}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.sellProduce}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
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

        {/* Listings List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {myListings.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl">
                🌾
              </div>
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {isTa ? 'நீங்கள் இன்னும் எந்த விளைபொருளையும் பட்டியலிடவில்லை' : 'You have not listed any produce yet'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {isTa
                  ? 'உங்கள் அறுவடை பயிர்களை உங்கள் கேட்கும் விலையுடன் பட்டியலிட்டு நேரடியாக வாங்குபவர்களிடம் பகிருங்கள்.'
                  : 'List your harvest with your own asking price to connect directly with interested buyers.'}
              </p>
              <button
                type="button"
                onClick={onAddNew}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t.sellProduce}</span>
              </button>
            </div>
          ) : (
            myListings.map((item) => {
              const isConfirming = confirmDeleteId === item.id;
              const isDeleting = deletingId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {getCropIcon(item.crop_name)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {translateCrop(item.crop_name)}
                        </h4>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <span>{t.askingPrice}:</span>
                          <span>₹{item.asking_price.toLocaleString('en-IN')} {item.price_unit}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.quantity} {item.unit}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.location}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {isTa ? 'கிடைக்கும் நாள்: ' : 'Avail: '}
                            {new Date(item.available_date).toLocaleDateString()}
                          </span>
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 italic mt-1">
                          "{item.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 animate-in fade-in duration-150">
                        <span className="text-xs font-medium text-rose-700 dark:text-rose-300 px-1">
                          {isTa ? 'நிச்சயமாகவா?' : 'Sure?'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          {isDeleting ? '...' : (isTa ? 'ஆம்' : 'Yes')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting}
                          className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs hover:bg-white dark:hover:bg-slate-800"
                        >
                          {isTa ? 'இல்லை' : 'No'}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-medium"
                          title={t.editListing}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t.editListing}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 text-xs font-medium"
                          title={t.deleteListing}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t.deleteListing}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
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
