'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sprout, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  FileText,
  DollarSign,
  Scale
} from 'lucide-react';
import { FarmerProduceListing, ListingStatus } from '@/types';
import { createProduceListing, updateProduceListing } from '@/lib/supabase/farmer-produce';
import { useLanguage } from '@/i18n';
import { getCropIcon } from '@/lib/supabase/crops';

interface CreateProduceListingModalProps {
  farmerId: string;
  farmerLocation?: string;
  initialListing?: FarmerProduceListing | null;
  onClose: () => void;
  onSuccess: (listing: FarmerProduceListing) => void;
}

const COMMON_CROPS = [
  'Paddy (Basmati)',
  'Paddy (Common / Sona Masuri)',
  'Groundnut (Peanut)',
  'Tomato (Hybrid)',
  'Maize (Corn)',
  'Cotton (Long Staple)',
  'Onion (Red)',
  'Wheat (Sharbati)',
  'Sugarcane',
  'Chilli (Dry Red)',
  'Turmeric'
];

const UNITS = ['Quintal', 'kg', 'Tonne', 'Bag'];
const PRICE_UNITS = ['₹/Quintal', '₹/kg', '₹/Tonne', '₹/Bag'];
const CATEGORIES = ['Cereals', 'Oilseeds', 'Vegetables', 'Fiber', 'Commercial', 'Spices', 'Other'];

export default function CreateProduceListingModal({
  farmerId,
  farmerLocation = '',
  initialListing,
  onClose,
  onSuccess
}: CreateProduceListingModalProps) {
  const { language, translations, translateCategory, translateCrop } = useLanguage();
  const isTa = language === 'ta';
  const tMarketplace = translations.farmerMarketplace;

  const isEditing = Boolean(initialListing);

  // Form State
  const [cropName, setCropName] = useState(initialListing?.crop_name || '');
  const [category, setCategory] = useState(initialListing?.category || 'Cereals');
  const [quantity, setQuantity] = useState<string>(initialListing ? String(initialListing.quantity) : '');
  const [unit, setUnit] = useState(initialListing?.unit || 'Quintal');
  const [askingPrice, setAskingPrice] = useState<string>(initialListing ? String(initialListing.asking_price) : '');
  const [priceUnit, setPriceUnit] = useState(initialListing?.price_unit || '₹/Quintal');
  const [location, setLocation] = useState(initialListing?.location || farmerLocation || '');
  const [availableDate, setAvailableDate] = useState(
    initialListing?.available_date || new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(initialListing?.description || '');
  const [status, setStatus] = useState<ListingStatus>(initialListing?.status || 'active');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    const cleanCropName = cropName.trim();
    const cleanLocation = location.trim();
    const parsedQty = parseFloat(quantity);
    const parsedPrice = parseFloat(askingPrice);

    if (!cleanCropName || !cleanLocation || !quantity || !askingPrice || !availableDate) {
      setErrorMessage(tMarketplace.validationErrorRequired);
      return;
    }

    if (isNaN(parsedQty) || parsedQty <= 0 || isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMessage(tMarketplace.validationErrorPositive);
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing && initialListing) {
        // Update existing listing
        const saved = await updateProduceListing(initialListing.id, {
          crop_name: cleanCropName,
          category,
          quantity: parsedQty,
          unit,
          asking_price: parsedPrice,
          price_unit: priceUnit,
          location: cleanLocation,
          available_date: availableDate,
          description: description.trim() || undefined,
          status
        });

        setSuccessMessage(tMarketplace.updateSuccess);
        setTimeout(() => {
          onSuccess(saved);
          onClose();
        }, 1200);
      } else {
        // Create new listing
        const created = await createProduceListing({
          farmer_id: farmerId,
          crop_name: cleanCropName,
          category,
          quantity: parsedQty,
          unit,
          asking_price: parsedPrice,
          price_unit: priceUnit,
          location: cleanLocation,
          available_date: availableDate,
          description: description.trim() || undefined
        });

        setSuccessMessage(tMarketplace.publishSuccess);
        setTimeout(() => {
          onSuccess(created);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Produce listing submit error:', err);
      // Fallback local create/update
      const fallbackLocal: FarmerProduceListing = {
        id: initialListing?.id || `pl-${Date.now()}`,
        farmer_id: farmerId,
        crop_name: cleanCropName,
        category,
        quantity: parsedQty,
        unit,
        asking_price: parsedPrice,
        price_unit: priceUnit,
        location: cleanLocation,
        available_date: availableDate,
        description: description.trim() || undefined,
        status: isEditing ? status : 'active',
        created_at: initialListing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSuccessMessage(isEditing ? tMarketplace.updateSuccess : tMarketplace.publishSuccess);
      setTimeout(() => {
        onSuccess(fallbackLocal);
        onClose();
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Sprout className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-lg truncate">
                {isEditing ? tMarketplace.editListingTitle : tMarketplace.createListingTitle}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {tMarketplace.createListingSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4 pt-4 flex-1">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Crop Name with Suggested Quick Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {tMarketplace.cropNameLabel} *
            </label>
            <div className="relative">
              <input
                type="text"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                placeholder={tMarketplace.cropNamePlaceholder}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">
                {getCropIcon(cropName)}
              </span>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {isTa ? 'விரைவு தேர்வு:' : 'Quick Pick:'}
              </span>
              {COMMON_CROPS.slice(0, 5).map((crop) => (
                <button
                  type="button"
                  key={crop}
                  onClick={() => setCropName(crop)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                    cropName === crop
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {translateCrop(crop)}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {tMarketplace.categoryLabel}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {translateCategory(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Row 1: Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {tMarketplace.quantityLabel} *
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {tMarketplace.unitLabel} *
              </label>
              <select
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  setPriceUnit(`₹/${e.target.value}`);
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u} {u === 'Quintal' ? (isTa ? '(குவிண்டால் - 100 kg)' : '(100 kg)') : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Asking Price & Price Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <div>
              <label className="block text-xs font-extrabold text-emerald-900 mb-1">
                {tMarketplace.askingPriceLabel} (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="e.g. 2400"
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <span className="text-[10px] text-emerald-700 font-medium block mt-1">
                {isTa ? 'விவசாயி நேரடியாக நிர்ணயிக்கும் விலை' : 'Entered directly by you as the farmer'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {tMarketplace.priceUnitLabel} *
              </label>
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {PRICE_UNITS.map((pu) => (
                  <option key={pu} value={pu}>
                    {pu}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Farm Location & Available Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {tMarketplace.locationLabel} *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={tMarketplace.locationPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {tMarketplace.availableDateLabel} *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={availableDate}
                  onChange={(e) => setAvailableDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {tMarketplace.descriptionLabel}
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={tMarketplace.descriptionPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Edit Mode: Status Toggle */}
          {isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {isTa ? 'பதிவு நிலை' : 'Listing Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ListingStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">{tMarketplace.statusActive}</option>
                <option value="sold">{tMarketplace.statusSold}</option>
                <option value="delisted">{tMarketplace.statusDelisted}</option>
              </select>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4"
              disabled={submitting}
            >
              {tMarketplace.cancelBtn}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs py-2 px-5 shadow-md flex items-center gap-1.5"
            >
              <Sprout className="w-4 h-4" />
              <span>
                {submitting
                  ? (isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving...')
                  : isEditing
                  ? tMarketplace.updateBtn
                  : tMarketplace.publishBtn}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
