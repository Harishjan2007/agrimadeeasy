'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  Profile,
  Crop,
  Market,
  CropPrice,
  CropPrediction,
  GovernmentScheme,
  Dealer,
  DealerCropPrice,
  Product,
  Machinery,
  MachineryBooking,
  BookingStatus,
  FarmerProduceListing,
  ProduceRequest,
  ProduceRequestStatus
} from '@/types';
import {
  MOCK_CROPS,
  MOCK_MARKETS,
  MOCK_CROP_PRICES,
  MOCK_PREDICTIONS,
  MOCK_SCHEMES,
  MOCK_PROFILES,
  MOCK_DEALERS,
  MOCK_DEALER_CROP_PRICES,
  MOCK_PRODUCTS,
  MOCK_MACHINERY,
  MOCK_BOOKINGS
} from '@/lib/mock-data';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProduceInquiry {
  id: string;
  dealerId: string;
  dealerName: string;
  farmerName: string;
  farmerPhone: string;
  cropName: string;
  estimatedQuantity: string;
  expectedPrice: string;
  message?: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'completed';
}

export interface AgriContextType {
  // Current user & role
  currentUser: Profile;
  userRole: UserRole;
  switchRole: (role: UserRole) => void;
  setUser: (profile: Profile) => void;

  // Data collections
  crops: Crop[];
  markets: Market[];
  cropPrices: CropPrice[];
  predictions: CropPrediction[];
  schemes: GovernmentScheme[];
  dealers: Dealer[];
  dealerCropPrices: DealerCropPrice[];
  products: Product[];
  machinery: Machinery[];
  bookings: MachineryBooking[];
  inquiries: ProduceInquiry[];

  // Machinery actions
  bookMachinery: (bookingData: {
    machineryId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
  }) => MachineryBooking;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  cancelBooking: (bookingId: string) => void;
  toggleMachineryAvailability: (machineryId: string) => void;
  addMachinery: (newMachine: Omit<Machinery, 'id' | 'created_at' | 'updated_at'>) => void;

  // Dealer actions
  updateDealerCropPrice: (priceId: string, newPrice: number) => void;
  addDealerCropPrice: (cropId: string, buyingPrice: number, unit?: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  updateProductStock: (productId: string, newStock: number) => void;
  submitProduceInquiry: (inquiry: Omit<ProduceInquiry, 'id' | 'createdAt' | 'status'>) => void;
  updateInquiryStatus: (inquiryId: string, status: 'new' | 'contacted' | 'completed') => void;

  // E-commerce Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;

  // Farmer Produce Marketplace
  produceListings: FarmerProduceListing[];
  produceRequests: ProduceRequest[];
  addProduceListing: (listing: Omit<FarmerProduceListing, 'id' | 'created_at' | 'updated_at'>) => FarmerProduceListing;
  updateProduceListingInContext: (id: string, updates: Partial<FarmerProduceListing>) => void;
  deleteProduceListingInContext: (id: string) => void;
  addProduceRequest: (request: Omit<ProduceRequest, 'id' | 'created_at' | 'updated_at'>) => ProduceRequest;
  updateProduceRequestStatusInContext: (requestId: string, status: ProduceRequestStatus) => void;
}

const defaultAgriContext: AgriContextType = {
  currentUser: MOCK_PROFILES[0],
  userRole: 'farmer',
  switchRole: () => {},
  setUser: () => {},
  crops: MOCK_CROPS,
  markets: MOCK_MARKETS,
  cropPrices: MOCK_CROP_PRICES,
  predictions: MOCK_PREDICTIONS,
  schemes: MOCK_SCHEMES,
  dealers: MOCK_DEALERS,
  dealerCropPrices: MOCK_DEALER_CROP_PRICES,
  updateDealerCropPrice: () => {},
  addDealerCropPrice: () => {},
  machinery: MOCK_MACHINERY,
  toggleMachineryAvailability: () => {},
  addMachinery: () => {},
  bookings: MOCK_BOOKINGS,
  bookMachinery: () => ({} as MachineryBooking),
  updateBookingStatus: () => {},
  cancelBooking: () => {},
  products: MOCK_PRODUCTS,
  addProduct: () => {},
  updateProductStock: () => {},
  inquiries: [],
  submitProduceInquiry: () => {},
  updateInquiryStatus: () => {},
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateCartQuantity: () => {},
  clearCart: () => {},
  cartCount: 0,
  cartTotal: 0,
  produceListings: [],
  produceRequests: [],
  addProduceListing: () => ({} as FarmerProduceListing),
  updateProduceListingInContext: () => {},
  deleteProduceListingInContext: () => {},
  addProduceRequest: () => ({} as ProduceRequest),
  updateProduceRequestStatusInContext: () => {}
};

const AgriContext = createContext<AgriContextType>(defaultAgriContext);

const STORAGE_KEYS = {
  USER: 'agrime_current_user',
  DEALER_PRICES: 'agrime_dealer_prices',
  MACHINERY: 'agrime_machinery',
  BOOKINGS: 'agrime_bookings',
  PRODUCTS: 'agrime_products',
  INQUIRIES: 'agrime_inquiries',
  CART: 'agrime_cart',
  PRODUCE_LISTINGS: 'agrime_produce_listings',
  PRODUCE_REQUESTS: 'agrime_produce_requests'
};

export const AgriProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State initialization with fallbacks
  const [currentUser, setCurrentUser] = useState<Profile>(MOCK_PROFILES[0]);
  const [dealerCropPrices, setDealerCropPrices] = useState<DealerCropPrice[]>(MOCK_DEALER_CROP_PRICES);
  const [machinery, setMachinery] = useState<Machinery[]>(MOCK_MACHINERY);
  const [bookings, setBookings] = useState<MachineryBooking[]>(MOCK_BOOKINGS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [inquiries, setInquiries] = useState<ProduceInquiry[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [produceListings, setProduceListings] = useState<FarmerProduceListing[]>([]);
  const [produceRequests, setProduceRequests] = useState<ProduceRequest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted state on mount (client-side only)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedPrices = localStorage.getItem(STORAGE_KEYS.DEALER_PRICES);
      if (savedPrices) setDealerCropPrices(JSON.parse(savedPrices));

      const savedMachinery = localStorage.getItem(STORAGE_KEYS.MACHINERY);
      if (savedMachinery) setMachinery(JSON.parse(savedMachinery));

      const savedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (savedBookings) setBookings(JSON.parse(savedBookings));

      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedInquiries = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      if (savedInquiries) setInquiries(JSON.parse(savedInquiries));

      const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedListings = localStorage.getItem(STORAGE_KEYS.PRODUCE_LISTINGS);
      if (savedListings) setProduceListings(JSON.parse(savedListings));

      const savedRequests = localStorage.getItem(STORAGE_KEYS.PRODUCE_REQUESTS);
      if (savedRequests) setProduceRequests(JSON.parse(savedRequests));
    } catch (e) {
      console.warn('Could not load localStorage state in AgriProvider', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.DEALER_PRICES, JSON.stringify(dealerCropPrices));
      localStorage.setItem(STORAGE_KEYS.MACHINERY, JSON.stringify(machinery));
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      localStorage.setItem(STORAGE_KEYS.PRODUCE_LISTINGS, JSON.stringify(produceListings));
      localStorage.setItem(STORAGE_KEYS.PRODUCE_REQUESTS, JSON.stringify(produceRequests));
    } catch (e) {
      console.warn('Could not persist state to localStorage', e);
    }
  }, [currentUser, dealerCropPrices, machinery, bookings, products, inquiries, cart, produceListings, produceRequests, isLoaded]);

  // Switch role helper
  const switchRole = (role: UserRole) => {
    let profileToSwitch = MOCK_PROFILES.find((p) => p.role === role);
    if (!profileToSwitch) {
      profileToSwitch = {
        id: `u-${role}-demo`,
        name: role === 'farmer' ? 'Murugan Ramasamy' : role === 'dealer' ? 'K. Balasubramanian' : 'R. Velayudham',
        email: `${role}@agrime.demo`,
        phone: '+91 98451 00000',
        role: role,
        location: 'Vellore, Tamil Nadu',
        created_at: new Date().toISOString()
      };
    }
    setCurrentUser(profileToSwitch);
  };

  const setUser = (profile: Profile) => {
    setCurrentUser(profile);
  };

  // Machinery Booking
  const bookMachinery = ({
    machineryId,
    bookingDate,
    startTime,
    endTime,
    totalAmount
  }: {
    machineryId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
  }): MachineryBooking => {
    const targetMachine = machinery.find((m) => m.id === machineryId) || MOCK_MACHINERY[0];
    const newBooking: MachineryBooking = {
      id: `bk-${Date.now()}`,
      farmer_id: currentUser.id,
      machinery_id: machineryId,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      farmer: currentUser,
      machinery: targetMachine
    };

    setBookings((prev) => [newBooking, ...prev]);
    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status, updated_at: new Date().toISOString() }
          : b
      )
    );
  };

  const cancelBooking = (bookingId: string) => {
    updateBookingStatus(bookingId, 'cancelled');
  };

  const toggleMachineryAvailability = (machineryId: string) => {
    setMachinery((prev) =>
      prev.map((m) =>
        m.id === machineryId
          ? { ...m, available: !m.available, updated_at: new Date().toISOString() }
          : m
      )
    );
  };

  const addMachinery = (newMachineData: Omit<Machinery, 'id' | 'created_at' | 'updated_at'>) => {
    const newMachine: Machinery = {
      ...newMachineData,
      id: `mch-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      provider: currentUser
    };
    setMachinery((prev) => [newMachine, ...prev]);
  };

  // Dealer actions
  const updateDealerCropPrice = (priceId: string, newPrice: number) => {
    setDealerCropPrices((prev) =>
      prev.map((p) =>
        p.id === priceId
          ? { ...p, buying_price: newPrice, updated_at: new Date().toISOString() }
          : p
      )
    );
  };

  const addDealerCropPrice = (cropId: string, buyingPrice: number, unit = '₹/Quintal') => {
    const cropObj = MOCK_CROPS.find((c) => c.id === cropId);
    const dealerObj = MOCK_DEALERS[0];

    const newPriceEntry: DealerCropPrice = {
      id: `dcp-${Date.now()}`,
      dealer_id: dealerObj.id,
      crop_id: cropId,
      buying_price: buyingPrice,
      unit,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      crop: cropObj,
      dealer: dealerObj
    };

    setDealerCropPrices((prev) => [newPriceEntry, ...prev]);
  };

  const addProduct = (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const newProduct: Product = {
      ...productData,
      id: `p-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dealer: MOCK_DEALERS[0]
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stock: newStock, updated_at: new Date().toISOString() }
          : p
      )
    );
  };

  const submitProduceInquiry = (inquiryData: Omit<ProduceInquiry, 'id' | 'createdAt' | 'status'>) => {
    const newInquiry: ProduceInquiry = {
      ...inquiryData,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    setInquiries((prev) => [newInquiry, ...prev]);
  };

  const updateInquiryStatus = (inquiryId: string, status: 'new' | 'contacted' | 'completed') => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === inquiryId ? { ...inq, status } : inq))
    );
  };

  // Cart actions
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

  // Farmer Produce Marketplace actions
  const addProduceListing = (
    listingData: Omit<FarmerProduceListing, 'id' | 'created_at' | 'updated_at'>
  ): FarmerProduceListing => {
    const newListing: FarmerProduceListing = {
      ...listingData,
      id: `pl-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      farmer: currentUser
    };
    setProduceListings((prev) => [newListing, ...prev]);
    return newListing;
  };

  const updateProduceListingInContext = (id: string, updates: Partial<FarmerProduceListing>) => {
    setProduceListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
      )
    );
  };

  const deleteProduceListingInContext = (id: string) => {
    setProduceListings((prev) => prev.filter((item) => item.id !== id));
  };

  const addProduceRequest = (
    requestData: Omit<ProduceRequest, 'id' | 'created_at' | 'updated_at'>
  ): ProduceRequest => {
    const newRequest: ProduceRequest = {
      ...requestData,
      id: `pr-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      buyer: currentUser
    };
    setProduceRequests((prev) => [newRequest, ...prev]);
    return newRequest;
  };

  const updateProduceRequestStatusInContext = (
    requestId: string,
    status: ProduceRequestStatus
  ) => {
    setProduceRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status, updated_at: new Date().toISOString() } : r
      )
    );
  };

  return (
    <AgriContext.Provider
      value={{
        currentUser,
        userRole: currentUser.role,
        switchRole,
        setUser,
        crops: MOCK_CROPS,
        markets: MOCK_MARKETS,
        cropPrices: MOCK_CROP_PRICES,
        predictions: MOCK_PREDICTIONS,
        schemes: MOCK_SCHEMES,
        dealers: MOCK_DEALERS,
        dealerCropPrices,
        products,
        machinery,
        bookings,
        inquiries,
        bookMachinery,
        updateBookingStatus,
        cancelBooking,
        toggleMachineryAvailability,
        addMachinery,
        updateDealerCropPrice,
        addDealerCropPrice,
        addProduct,
        updateProductStock,
        submitProduceInquiry,
        updateInquiryStatus,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartTotal,
        produceListings,
        produceRequests,
        addProduceListing,
        updateProduceListingInContext,
        deleteProduceListingInContext,
        addProduceRequest,
        updateProduceRequestStatusInContext
      }}
    >
      {children}
    </AgriContext.Provider>
  );
};

export const useAgri = () => {
  const context = useContext(AgriContext);
  return context || defaultAgriContext;
};
