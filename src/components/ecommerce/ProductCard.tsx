'use client';

import React from 'react';
import { 
  Check, 
  Plus, 
  Package, 
  Store 
} from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/i18n';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  cartQuantity?: number;
}

export default function ProductCard({ product, onAddToCart, cartQuantity = 0 }: ProductCardProps) {
  const [added, setAdded] = React.useState(false);
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
      case 'Seeds': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Fertilizers': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Pesticides': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Equipment': return 'bg-purple-50 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-agri-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Product Image Placeholder with Fallback */}
        <div className="relative h-44 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
              <Package className="w-8 h-8" />
            </div>
          )}

          {/* Category Badge */}
          <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border shadow-xs backdrop-blur-xs ${getCategoryColor()}`}>
            {translateCategory(product.category)}
          </span>

          {/* Stock Tag */}
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 text-slate-700 border border-slate-200 shadow-xs">
            {product.stock > 0 
              ? `${translations.ecommerce.stock}: ${product.stock}` 
              : translations.ecommerce.outOfStock}
          </span>
        </div>

        {/* Product Info */}
        <div className="p-5">
          <h3 className="font-bold text-slate-900 text-base group-hover:text-agri-700 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Dealer Seller Tag */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
            <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">
              {translations.ecommerce.soldBy}: <span className="text-slate-800">{product.dealer?.shop_name || (isTa ? 'அங்கீகரிக்கப்பட்ட வியாபாரி' : 'Verified Agro Dealer')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Price & Action */}
      <div className="px-5 pb-5 pt-0 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-medium text-slate-400 block">{translations.ecommerce.retailPrice}</span>
          <span className="text-xl font-black text-slate-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>

        <button
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
