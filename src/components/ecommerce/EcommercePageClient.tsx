'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  PackageCheck,
  Sprout,
  Store
} from 'lucide-react';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import ProductCard from '@/components/ecommerce/ProductCard';
import FarmerMarketplace from '@/components/ecommerce/FarmerMarketplace';
import { Product, ProductCategory } from '@/types';
import { useLanguage } from '@/i18n';
import { useAgri } from '@/context/AgriContext';
import { PageHeader, SearchBar, CategoryTabs, EmptyState } from '@/components/ui';

interface ConfirmedOrder {
  id: string;
  method: 'cod' | 'pickup';
  address: string;
  phone: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  placedAt: string;
}

export default function EcommercePageClient() {
  const { cart, addToCart, removeFromCart, updateCartQuantity, clearCart, currentUser } = useAgri();
  const products = MOCK_PRODUCTS;
  const { language, translations, translateCategory } = useLanguage();
  const isTa = language === 'ta';
  const tMarketplace = translations.farmerMarketplace;
  const tEcom = translations.ecommerce;

  // Active section tab: 'inputs' (Buy Agri-Inputs) or 'produce' (Farmer Produce Marketplace)
  const [activeTab, setActiveTab] = useState<'inputs' | 'produce'>('inputs');

  // Checkout states
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'cod' | 'pickup'>('cod');
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser?.location || 'Vellore, Tamil Nadu');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '+91 98451 00000');
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  // Sync tab with URL query parameter if present (?tab=produce)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'produce' || tabParam === 'farmer-produce') {
        setActiveTab('produce');
      }
    }
  }, []);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Categories list for inputs
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

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: ConfirmedOrder = {
      id: orderId,
      method: fulfillmentMethod,
      address: fulfillmentMethod === 'cod' ? deliveryAddress : 'Dealer Store Pickup',
      phone: contactPhone,
      total: cartTotal,
      items: cart.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })),
      placedAt: new Date().toLocaleTimeString(isTa ? 'ta-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    setConfirmedOrder(newOrder);
    clearCart();
    setIsCheckingOut(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Modern Page Header */}
      <PageHeader
        title={activeTab === 'inputs' ? translations.ecommerce.title : tMarketplace.title}
        subtitle={activeTab === 'inputs' ? translations.ecommerce.subtitle : tMarketplace.subtitle}
        badge={isTa ? 'வேளாண் வணிகத் தளம்' : 'Agricultural Commerce & Direct Marketplace'}
        icon={activeTab === 'inputs' ? ShoppingBag : Sprout}
        iconColor={activeTab === 'inputs' ? 'text-purple-700' : 'text-emerald-700'}
        iconBg={activeTab === 'inputs' ? 'bg-purple-50 border-purple-200' : 'bg-emerald-50 border-emerald-200'}
        stats={
          activeTab === 'inputs'
            ? [
                { label: isTa ? 'பொருட்கள்' : 'Products', value: products.length },
                { label: isTa ? 'கூடை' : 'Cart Items', value: cartCount },
                { label: isTa ? 'மதிப்பு' : 'Cart Value', value: `₹${cartTotal.toLocaleString('en-IN')}` }
              ]
            : undefined
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'inputs' && (
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-2 shadow-xs relative"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{translations.ecommerce.cart} ({cartCount})</span>
                {cartCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    ₹{cartTotal.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            )}
          </div>
        }
      />

      {/* Modern Section Switch Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            id="tab-buy-inputs"
            onClick={() => setActiveTab('inputs')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'inputs'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>🛒</span>
            <span>{tMarketplace.buyInputsTab}</span>
          </button>

          <button
            type="button"
            id="tab-farmer-produce"
            onClick={() => setActiveTab('produce')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'produce'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>🌾</span>
            <span>{tMarketplace.farmerProduceTab}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
              {isTa ? 'புதியது' : 'NEW'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {activeTab === 'produce' ? (
          /* ======================================================== */
          /* TAB 2: FARMER PRODUCE MARKETPLACE (NEW FEATURE)         */
          /* ======================================================== */
          <FarmerMarketplace />
        ) : (
          /* ======================================================== */
          /* TAB 1: BUY AGRI-INPUTS (ORIGINAL PRESERVED SHOPPING)    */
          /* ======================================================== */
          <div>
            {/* Demo Notice for Agri-Inputs */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 mb-6">
              <div className="flex items-center gap-2.5 text-xs text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {isTa
                    ? 'பொருட்கள் மாதிரிக்காகக் காட்டப்பட்டுள்ளன. வாங்குதல் செயல்முறை மாதிரி ஆர்டராகப் பதிவு செய்யப்படுகிறது.'
                    : 'Products shown below are sample inventory items. Orders are simulated with Cash on Delivery / Dealer Pickup without live online payment processing.'}
                </span>
              </div>
            </div>

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
                      {cat === 'All' ? (isTa ? 'அனைத்தும்' : 'All') : translateCategory(cat as any)}
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
        )}

      </div>

      {/* Slide-over Cart Drawer (Preserved from Original) */}
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

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {confirmedOrder ? (
                  <div className="space-y-5">
                    <div className="text-center py-4">
                      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-300 text-emerald-600">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">{tEcom.orderConfirmationTitle}</h4>
                      <div className="inline-block mt-1 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800">
                        {tEcom.orderReference}: {confirmedOrder.id}
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">{tEcom.fulfillmentMethod}</span>
                        <span className="font-bold text-slate-900">
                          {confirmedOrder.method === 'cod' ? tEcom.cashOnDelivery : tEcom.storePickup}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">{tEcom.deliveryAddress}</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                          {confirmedOrder.address}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">{tEcom.contactNumber}</span>
                        <span className="font-semibold text-slate-800">{confirmedOrder.phone}</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold text-slate-900 text-sm">
                        <span>{tEcom.subtotal}</span>
                        <span className="text-agri-700">₹{confirmedOrder.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Transparency Notice */}
                    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        {tEcom.codNotice}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setConfirmedOrder(null);
                        setCartDrawerOpen(false);
                      }}
                      className="btn-primary w-full py-2.5 text-xs font-bold"
                    >
                      {tEcom.closeReceipt}
                    </button>
                  </div>
                ) : isCheckingOut ? (
                  <form onSubmit={handleConfirmOrder} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900">{translations.ecommerce.checkout}</h4>
                      <button
                        type="button"
                        onClick={() => setIsCheckingOut(false)}
                        className="text-xs text-agri-600 hover:text-agri-700 font-semibold"
                      >
                        ← {translations.common.back}
                      </button>
                    </div>

                    {/* Fulfillment Method */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        {tEcom.fulfillmentMethod}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFulfillmentMethod('cod')}
                          className={`p-3 rounded-xl border text-left text-xs transition-all ${
                            fulfillmentMethod === 'cod'
                              ? 'border-agri-500 bg-agri-50/60 ring-2 ring-agri-500/20 font-bold text-agri-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold">{tEcom.cashOnDelivery}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Pay on delivery</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFulfillmentMethod('pickup')}
                          className={`p-3 rounded-xl border text-left text-xs transition-all ${
                            fulfillmentMethod === 'pickup'
                              ? 'border-agri-500 bg-agri-50/60 ring-2 ring-agri-500/20 font-bold text-agri-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold">{tEcom.storePickup}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Collect at shop</div>
                        </button>
                      </div>
                    </div>

                    {/* Delivery Address or Pickup Notice */}
                    {fulfillmentMethod === 'cod' ? (
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          {tEcom.deliveryAddress}
                        </label>
                        <input
                          type="text"
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-agri-500"
                          placeholder="Village, Taluk, District"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                        {isTa
                          ? 'ஆர்டர் உறுதிசெய்யப்பட்டதும் வியாபாரியின் முகவரியில் நேரில் பெற்றுக்கொள்ளலாம்.'
                          : 'You can collect the items directly from the authorized dealer shop once confirmed.'}
                      </div>
                    )}

                    {/* Contact Phone */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {tEcom.contactNumber}
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-agri-500"
                        placeholder="+91 98451 00000"
                      />
                    </div>

                    {/* Order summary table */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{tEcom.orderSummary}</span>
                        <span>{cartCount} items</span>
                      </div>
                      <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                        <span>{translations.ecommerce.subtotal}</span>
                        <span className="font-bold">₹{cartTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Fulfillment fee</span>
                        <span className="text-emerald-600 font-bold">FREE</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-200 text-sm">
                        <span>Total Due</span>
                        <span className="text-agri-700">₹{cartTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Transparency Notice */}
                    <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                      {tEcom.codNotice}
                    </div>

                    <button
                      type="submit"
                      className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>{tEcom.placeOrderBtn}</span>
                    </button>
                  </form>
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

              {/* Drawer Footer: Total & Checkout trigger */}
              {cart.length > 0 && !isCheckingOut && !confirmedOrder && (
                <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600">{translations.ecommerce.subtotal}</span>
                    <span className="font-black text-slate-900 text-base">
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsCheckingOut(true)}
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
