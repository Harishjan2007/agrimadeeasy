'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  X, 
  Info, 
  PackageCheck 
} from 'lucide-react';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import ProductCard from '@/components/ecommerce/ProductCard';
import { Product, ProductCategory } from '@/types';
import { useLanguage } from '@/i18n';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function EcommercePageClient() {
  const products = MOCK_PRODUCTS;
  const [cart, setCart] = useState<CartItem[]>([]);
  const { language, translations, translateCategory } = useLanguage();
  const isTa = language === 'ta';

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Categories list
  const categories: (string | ProductCategory)[] = [
    'All',
    'Seeds',
    'Fertilizers',
    'Pesticides',
    'Equipment',
    'Other'
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = p.description.toLowerCase();
      const dealer = p.dealer?.shop_name.toLowerCase() || '';
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase()) || dealer.includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutSuccess(true);
    setTimeout(() => {
      clearCart();
      setCheckoutSuccess(false);
      setCartDrawerOpen(false);
    }, 2500);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Header Hero Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-agri-950 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-purple-500/30">
                <ShoppingBag className="w-3.5 h-3.5" />
                {isTa ? 'விவசாய உள்ளீடுகள் மற்றும் பண்ணைப் பொருட்கள் கடை' : 'Agricultural Inputs & Farm Store (Demo Marketplace)'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {translations.ecommerce.title}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
                {translations.ecommerce.subtitle}
              </p>
            </div>

            {/* View Cart Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCartDrawerOpen(true)}
                className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 shadow-lg relative"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{translations.ecommerce.cart} ({cartCount})</span>
                {cartCount > 0 && (
                  <span className="bg-harvest-400 text-harvest-950 text-[11px] font-extrabold px-1.5 py-0.2 rounded-full">
                    ₹{cartTotal.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-amber-800">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isTa
              ? 'பொருட்கள் மாதிரிக்காகக் காட்டப்பட்டுள்ளன. வாங்குதல் செயல்முறை மாதிரி ஆர்டராகப் பதிவு செய்யப்படுகிறது.'
              : 'Products shown below are sample inventory items. Orders are simulated with Cash on Delivery / Dealer Pickup without live online payment processing.'}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="w-full md:w-96 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={translations.ecommerce.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  {isTa ? 'அழிக்க' : 'Clear'}
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'All' ? (isTa ? 'அனைத்தும்' : 'All') : translateCategory(cat)}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{translations.ecommerce.title}</span>
              <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                {filteredProducts.length} {isTa ? 'பொருட்கள்' : 'Products'}
              </span>
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">{translations.ecommerce.noProductsFound}</h3>
              <p className="text-xs text-slate-500 mt-1">{translations.ecommerce.noProductsDescription}</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="mt-4 btn-secondary text-xs py-2 px-4"
              >
                {translations.common.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    cartQuantity={inCart ? inCart.quantity : 0}
                  />
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Slide-over Cart Drawer */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-agri-600" />
                  <h3 className="text-lg font-bold text-slate-900">{translations.ecommerce.cart}</h3>
                  <span className="text-xs bg-agri-100 text-agri-800 font-bold px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                </div>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body: Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {checkoutSuccess ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
                    <h4 className="text-lg font-bold text-slate-900">{translations.ecommerce.orderPlaced}</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      {isTa 
                        ? `₹${cartTotal.toLocaleString('en-IN')} மதிப்பிலான உங்கள் மாதிரி ஆர்டர் பதிவு செய்யப்பட்டது. வியாபாரி உங்களை விரைவில் தொடர்புகொள்வார்.`
                        : `Your order for ₹${cartTotal.toLocaleString('en-IN')} has been simulated. The local dealer will contact you for pickup or farm dispatch.`}
                    </p>
                  </div>
                ) : cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">{translations.ecommerce.emptyCart}</p>
                    <p className="text-xs text-slate-400 mt-1">{isTa ? 'விதைகள், உரங்கள் மற்றும் உபகரணங்களை மேலே உள்ள பட்டியலில் காண்க.' : 'Browse seeds, bio-pesticides, and tools above.'}</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80"
                    >
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 block">
                          ₹{item.product.price.toLocaleString('en-IN')} {isTa ? 'ஒன்று' : 'each'}
                        </span>

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-800 px-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 block">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 mt-1 transition-colors"
                          title={translations.common.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer: Total & Checkout */}
              {cart.length > 0 && !checkoutSuccess && (
                <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600">{translations.ecommerce.subtotal}</span>
                    <span className="font-black text-slate-900 text-base">
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                    {isTa 
                      ? 'கட்டண முறை: விநியோகத்தின் போது பணம் / கடை விற்பனை (மாதிரி ஆர்டர்).'
                      : 'Payment Method: Cash on Delivery / Dealer Store Pickup (Demo simulation).'}
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>{translations.ecommerce.checkout} (₹{cartTotal.toLocaleString('en-IN')})</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
