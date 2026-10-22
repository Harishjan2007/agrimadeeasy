'use client';

import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  Package, 
  Store,
  Sparkles,
  Wrench,
  Sprout,
  Apple,
  Layers,
  FlaskConical
} from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/i18n';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  cartQuantity?: number;
}

export default function ProductCard({ product, onAddToCart, cartQuantity = 0 }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { language, translations, translateCategory } = useLanguage();
  const isTa = language === 'ta';

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const getCategoryColor = () => {
    switch (product.category) {
      case 'Seeds': 
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Simple, low-budget equipment': 
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Fertilizers': 
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Organic foods': 
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'Other agricultural products': 
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default: 
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const renderCategoryFallbackIcon = () => {
    switch (product.category) {
      case 'Seeds': 
        return <Sprout className="w-10 h-10 text-emerald-600" />;
      case 'Simple, low-budget equipment': 
        return <Wrench className="w-10 h-10 text-blue-600" />;
      case 'Fertilizers': 
        return <FlaskConical className="w-10 h-10 text-amber-600" />;
      case 'Organic foods': 
        return <Apple className="w-10 h-10 text-teal-600" />;
      case 'Other agricultural products': 
      default:
        return <Layers className="w-10 h-10 text-purple-600" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-agri-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Product Image Container with Graceful Fallback */}
        <div className="relative h-48 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
          {product.image_url && !imgError ? (
            <img
              src={product.image_url}
              alt={`${product.name} - Demo Agricultural Listing`}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-b border-slate-100 p-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs flex items-center justify-center border border-slate-200 mb-2">
                {renderCategoryFallbackIcon()}
              </div>
              <span className="text-[11px] font-bold text-slate-600 max-w-[200px] truncate">
                {product.name}
              </span>
            </div>
          )}

          {/* Top Left: Category Badge */}
          <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border shadow-2xs backdrop-blur-xs ${getCategoryColor()}`}>
            {translateCategory(product.category)}
          </span>

          {/* Top Right: Demo Product Badge */}
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/90 text-white shadow-2xs flex items-center gap-1 backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-200" />
            <span>{isTa ? 'மாதிரிப் பொருள்' : 'Demo Listing'}</span>
          </span>
        </div>

        {/* Product Details Info */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-base group-hover:text-agri-700 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </div>

          {product.pack_size && (
            <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              {product.pack_size}
            </span>
          )}

          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Seller / Dealer Info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-3.5 pt-3 border-t border-slate-100">
            <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">
              {translations.ecommerce.soldBy}: <span className="text-slate-800 font-semibold">{product.dealer?.shop_name || (isTa ? 'அங்கீகரிக்கப்பட்ட வியாபாரி' : 'AgriME Registered Merchant')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Price & Add to Cart Action */}
      <div className="px-5 pb-5 pt-0 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-medium text-slate-400 block">{translations.ecommerce.retailPrice}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.unit && !product.pack_size && (
              <span className="text-[11px] text-slate-500">/ {product.unit}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
            added
              ? 'bg-emerald-600 text-white'
              : cartQuantity > 0
              ? 'bg-agri-100 text-agri-800 hover:bg-agri-200'
              : 'btn-primary'
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{isTa ? 'சேர்க்கப்பட்டது!' : 'Added!'}</span>
            </>
          ) : cartQuantity > 0 ? (
            <>
              <span>{translations.ecommerce.inCart} ({cartQuantity})</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>{translations.ecommerce.addToCart}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
