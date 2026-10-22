/**
 * AgriME Platform — Demonstration Produce Dealers & Buyer Directory
 * Exactly 10 fictional demonstration dealer profiles distributed across Tamil Nadu agricultural hubs.
 * 
 * STRICT COMPLIANCE RULES:
 * 1. Clearly marked as Demo Dealer with `isDemo: true`.
 * 2. Distinct from real enrolled dealers (cannot be booked or contacted as real traders).
 * 3. Structured coordinates for geodesic distance calculation (Haversine).
 * 4. Structured crop-specific purchase quotes with min quantity, capacity, and terms.
 * 5. Supports highest-offered-price first ranking and radius filtering.
 */

import { Dealer, DealerCropPrice } from '@/types';
import { MOCK_CROPS } from '@/lib/mock-data';

export const BUYER_TYPES = [
  'All Buyer Types',
  'Wholesale Mandi Merchant',
  'Modern Rice Mill & Processing Hub',
  'FPO / Farmer Cooperative Buying Hub',
  'Oilseed Expeller & Commercial Processor',
  'Feed Mill & Poultry Grain Buyer',
  'Vegetable Commission & Cold Storage Merchant',
  'Cotton Ginning & Commercial Buyer'
] as const;

export const DEMO_DEALERS: Dealer[] = [
  {
    id: 'demo-dealer-1',
    profile_id: 'u-demo-dealer-1',
    shop_name: 'Cauvery Delta Rice Mill & Direct Buying Hub [Demo Dealer]',
    address: 'Old Thanjavur Road, Near APMC Market Yard, Thanjavur - 613001',
    phone: '+91 90000 00001 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 6:30 AM - 7:00 PM',
    latitude: 10.7870,
    longitude: 79.1378,
    district: 'Thanjavur',
    created_at: '2026-03-01T08:00:00Z',
    isDemo: true,
    buyer_type: 'Modern Rice Mill & Processing Hub',
    purchase_conditions: 'Moisture < 14%, immediate electronic weighment & spot RTGS/NEFT payment.',
    verified: false
  },
  {
    id: 'demo-dealer-2',
    profile_id: 'u-demo-dealer-2',
    shop_name: 'Kongu Commercial Grains & Oilseed Traders [Demo Dealer]',
    address: 'Leigh Bazaar Commercial Complex, Salem - 636009',
    phone: '+91 90000 00002 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 7:00 AM - 8:00 PM',
    latitude: 11.6643,
    longitude: 78.1460,
    district: 'Salem',
    created_at: '2026-03-01T08:30:00Z',
    isDemo: true,
    buyer_type: 'Wholesale Mandi Merchant',
    purchase_conditions: 'Standard 50kg gunny bags preferred; moisture test done on-site; spot payout.',
    verified: false
  },
  {
    id: 'demo-dealer-3',
    profile_id: 'u-demo-dealer-3',
    shop_name: 'Trichy Regional Farmer Cooperative Procurement Hub [Demo Dealer]',
    address: 'Subramaniapuram Agri Warehousing Zone, Tiruchirappalli - 620020',
    phone: '+91 90000 00003 (Sample Demo Only)',
    opening_hours: 'Mon - Fri: 8:00 AM - 6:00 PM',
    latitude: 10.7905,
    longitude: 78.7047,
    district: 'Tiruchirappalli',
    created_at: '2026-03-01T09:00:00Z',
    isDemo: true,
    buyer_type: 'FPO / Farmer Cooperative Buying Hub',
    purchase_conditions: 'FPO member bonus applicable; direct DBT settlement within 24 hours of delivery.',
    verified: false
  },
  {
    id: 'demo-dealer-4',
    profile_id: 'u-demo-dealer-4',
    shop_name: 'Madurai Pandian Agro Commodities & Cotton Yard [Demo Dealer]',
    address: 'Mattuthavani Wholesale Yard, Madurai - 625007',
    phone: '+91 90000 00004 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 6:00 AM - 7:30 PM',
    latitude: 9.9252,
    longitude: 78.1198,
    district: 'Madurai',
    created_at: '2026-03-01T09:30:00Z',
    isDemo: true,
    buyer_type: 'Cotton Ginning & Commercial Buyer',
    purchase_conditions: 'Moisture < 8% for cotton, trash content < 3%; automated electronic grading.',
    verified: false
  },
  {
    id: 'demo-dealer-5',
    profile_id: 'u-demo-dealer-5',
    shop_name: 'Erode Agro Processing & Turmeric Expellers [Demo Dealer]',
    address: 'Perundurai SIPCOT Agri Zone, Erode - 638052',
    phone: '+91 90000 00005 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 7:30 AM - 7:30 PM',
    latitude: 11.3410,
    longitude: 77.7172,
    district: 'Erode',
    created_at: '2026-03-01T10:00:00Z',
    isDemo: true,
    buyer_type: 'Oilseed Expeller & Commercial Processor',
    purchase_conditions: 'Oil content > 42% for groundnut pods; free unloading at mill yard for > 20Q.',
    verified: false
  },
  {
    id: 'demo-dealer-6',
    profile_id: 'u-demo-dealer-6',
    shop_name: 'Oddanchatram Fresh Harvest Cold Storage & Mandi [Demo Dealer]',
    address: 'Vegetable Wholesale Market Road, Oddanchatram, Dindigul - 624619',
    phone: '+91 90000 00006 (Sample Demo Only)',
    opening_hours: 'Daily: 4:30 AM - 4:00 PM',
    latitude: 10.4900,
    longitude: 77.7470,
    district: 'Dindigul',
    created_at: '2026-03-01T10:30:00Z',
    isDemo: true,
    buyer_type: 'Vegetable Commission & Cold Storage Merchant',
    purchase_conditions: 'Graded produce (A-grade crates preferred); immediate daily auction settlement.',
    verified: false
  },
  {
    id: 'demo-dealer-7',
    profile_id: 'u-demo-dealer-7',
    shop_name: 'Namakkal Poultry Feed Mills & Grain Buyers [Demo Dealer]',
    address: 'Paramathi Velur Road, Namakkal - 637001',
    phone: '+91 90000 00007 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 8:00 AM - 8:00 PM',
    latitude: 11.2189,
    longitude: 78.1674,
    district: 'Namakkal',
    created_at: '2026-03-01T11:00:00Z',
    isDemo: true,
    buyer_type: 'Feed Mill & Poultry Grain Buyer',
    purchase_conditions: 'Bulk corn and soya; aflatoxin < 20 ppb, moisture < 12%; truck weighbridge on site.',
    verified: false
  },
  {
    id: 'demo-dealer-8',
    profile_id: 'u-demo-dealer-8',
    shop_name: 'Panruti Golden Groundnut & Cashew Mart [Demo Dealer]',
    address: 'Cuddalore Main Road, Panruti, Cuddalore - 607106',
    phone: '+91 90000 00008 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 7:00 AM - 6:30 PM',
    latitude: 11.7753,
    longitude: 79.5537,
    district: 'Cuddalore',
    created_at: '2026-03-01T11:30:00Z',
    isDemo: true,
    buyer_type: 'Oilseed Expeller & Commercial Processor',
    purchase_conditions: 'Well-dried pods only; moisture < 9%; shell-out ratio minimum 70%.',
    verified: false
  },
  {
    id: 'demo-dealer-9',
    profile_id: 'u-demo-dealer-9',
    shop_name: 'Dharmapuri Tomato & Millet Procurement Agency [Demo Dealer]',
    address: 'Pennagaram Road, Dharmapuri - 636701',
    phone: '+91 90000 00009 (Sample Demo Only)',
    opening_hours: 'Daily: 5:00 AM - 3:00 PM',
    latitude: 12.1211,
    longitude: 78.1582,
    district: 'Dharmapuri',
    created_at: '2026-03-01T12:00:00Z',
    isDemo: true,
    buyer_type: 'Vegetable Commission & Cold Storage Merchant',
    purchase_conditions: 'Direct collection for lots over 30 plastic crates; daily cash/UPI settlement.',
    verified: false
  },
  {
    id: 'demo-dealer-10',
    profile_id: 'u-demo-dealer-10',
    shop_name: 'Tirunelveli Nellai Agro Traders & Pulses Hub [Demo Dealer]',
    address: 'Tiruchendur Road, Palayamkottai, Tirunelveli - 627002',
    phone: '+91 90000 00010 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 7:00 AM - 7:00 PM',
    latitude: 8.7139,
    longitude: 77.7567,
    district: 'Tirunelveli',
    created_at: '2026-03-01T12:30:00Z',
    isDemo: true,
    buyer_type: 'Wholesale Mandi Merchant',
    purchase_conditions: 'Clean dry pulses and paddy; no insect damage; direct bank payout on weighing.',
    verified: false
  }
];

export const DEMO_DEALER_CROP_PRICES: DealerCropPrice[] = [
  // demo-dealer-1 (Thanjavur): Paddy Basmati, Paddy Common, Groundnut
  {
    id: 'demo-dcp-1',
    dealer_id: 'demo-dealer-1',
    crop_id: 'c1',
    buying_price: 3620, // High paddy basmati price
    unit: '₹/Quintal',
    active: true,
    min_quantity: 10,
    max_capacity: 1500,
    quantity_unit: 'Quintals',
    payment_terms: 'Instant NEFT/RTGS upon weighment',
    grading_terms: 'Moisture < 14%, foreign matter < 1%',
    created_at: '2026-03-01T08:00:00Z',
    updated_at: '2026-03-01T08:00:00Z',
    crop: MOCK_CROPS[0],
    dealer: DEMO_DEALERS[0]
  },
  {
    id: 'demo-dcp-2',
    dealer_id: 'demo-dealer-1',
    crop_id: 'c2',
    buying_price: 2540, // High paddy common price
    unit: '₹/Quintal',
    active: true,
    min_quantity: 15,
    max_capacity: 2500,
    quantity_unit: 'Quintals',
    payment_terms: 'Direct bank transfer within 4 hours',
    grading_terms: 'BPT 5204 or equivalent, clean grain',
    created_at: '2026-03-01T08:00:00Z',
    updated_at: '2026-03-01T08:00:00Z',
    crop: MOCK_CROPS[1],
    dealer: DEMO_DEALERS[0]
  },

  // demo-dealer-2 (Salem): Groundnut, Maize, Cotton
  {
    id: 'demo-dcp-3',
    dealer_id: 'demo-dealer-2',
    crop_id: 'c3',
    buying_price: 7250, // Competitive groundnut
    unit: '₹/Quintal',
    active: true,
    min_quantity: 5,
    max_capacity: 600,
    quantity_unit: 'Quintals',
    payment_terms: 'Spot cash or UPI payout',
    grading_terms: 'Dry pods, moisture < 9%',
    created_at: '2026-03-01T08:30:00Z',
    updated_at: '2026-03-01T08:30:00Z',
    crop: MOCK_CROPS[2],
    dealer: DEMO_DEALERS[1]
  },
  {
    id: 'demo-dealer-4',
    dealer_id: 'demo-dealer-2',
    crop_id: 'c4',
    buying_price: 2380, // Solid maize price
    unit: '₹/Quintal',
    active: true,
    min_quantity: 20,
    max_capacity: 1200,
    quantity_unit: 'Quintals',
    payment_terms: 'IMPS on weighbridge printout',
    grading_terms: 'Clean yellow corn, moisture < 13%',
    created_at: '2026-03-01T08:30:00Z',
    updated_at: '2026-03-01T08:30:00Z',
    crop: MOCK_CROPS[3],
    dealer: DEMO_DEALERS[1]
  },
  {
    id: 'demo-dcp-5',
    dealer_id: 'demo-dealer-2',
    crop_id: 'c5',
    buying_price: 7750, // Cotton
    unit: '₹/Quintal',
    active: true,
    min_quantity: 8,
    max_capacity: 400,
    quantity_unit: 'Quintals',
    payment_terms: 'Same-day bank settlement',
    grading_terms: 'Staple length > 29mm, trash < 3%',
    created_at: '2026-03-01T08:30:00Z',
    updated_at: '2026-03-01T08:30:00Z',
    crop: MOCK_CROPS[4],
    dealer: DEMO_DEALERS[1]
  },

  // demo-dealer-3 (Trichy): Paddy Basmati, Paddy Common, Maize
  {
    id: 'demo-dcp-6',
    dealer_id: 'demo-dealer-3',
    crop_id: 'c1',
    buying_price: 3550,
    unit: '₹/Quintal',
    active: true,
    min_quantity: 5,
    max_capacity: 800,
    quantity_unit: 'Quintals',
    payment_terms: 'Govt cooperative DBT in 24 hrs',
    grading_terms: 'Fair Average Quality (FAQ) standards',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-03-01T09:00:00Z',
    crop: MOCK_CROPS[0],
    dealer: DEMO_DEALERS[2]
  },
  {
    id: 'demo-dcp-7',
    dealer_id: 'demo-dealer-3',
    crop_id: 'c2',
    buying_price: 2490,
    unit: '₹/Quintal',
    active: true,
    min_quantity: 5,
    max_capacity: 1500,
    quantity_unit: 'Quintals',
    payment_terms: 'Govt cooperative DBT in 24 hrs',
    grading_terms: 'FAQ Grade-A paddy',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-03-01T09:00:00Z',
    crop: MOCK_CROPS[1],
    dealer: DEMO_DEALERS[2]
  },

  // demo-dealer-4 (Madurai): Cotton, Maize, Groundnut
  {
    id: 'demo-dcp-8',
    dealer_id: 'demo-dealer-4',
    crop_id: 'c5',
    buying_price: 7920, // Top cotton offer!
    unit: '₹/Quintal',
    active: true,
    min_quantity: 10,
    max_capacity: 800,
    quantity_unit: 'Quintals',
    payment_terms: 'Instant RTGS upon digital grading',
    grading_terms: 'Moisture < 8%, zero discolored lint',
    created_at: '2026-03-01T09:30:00Z',
    updated_at: '2026-03-01T09:30:00Z',
    crop: MOCK_CROPS[4],
    dealer: DEMO_DEALERS[3]
  },
  {
    id: 'demo-dcp-9',
    dealer_id: 'demo-dealer-4',
    crop_id: 'c4',
    buying_price: 2320,
    unit: '₹/Quintal',
    active: true,
    min_quantity: 15,
    max_capacity: 900,
    quantity_unit: 'Quintals',
    payment_terms: 'Same day bank transfer',
    grading_terms: 'Commercial poultry feed quality',
    created_at: '2026-03-01T09:30:00Z',
    updated_at: '2026-03-01T09:30:00Z',
    crop: MOCK_CROPS[3],
    dealer: DEMO_DEALERS[3]
  },

  // demo-dealer-5 (Erode): Groundnut, Sugarcane, Cotton
  {
    id: 'demo-dcp-10',
    dealer_id: 'demo-dealer-5',
    crop_id: 'c3',
    buying_price: 7420, // Very high groundnut quote!
    unit: '₹/Quintal',
    active: true,
    min_quantity: 10,
    max_capacity: 1000,
    quantity_unit: 'Quintals',
    payment_terms: 'Direct mill gate check or NEFT',
    grading_terms: 'Oil recovery > 42%, tested on site',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    crop: MOCK_CROPS[2],
    dealer: DEMO_DEALERS[4]
  },
  {
    id: 'demo-dcp-11',
    dealer_id: 'demo-dealer-5',
    crop_id: 'c9',
    buying_price: 3350, // Sugarcane (ton basis converted/quintal)
    unit: '₹/Quintal',
    active: true,
    min_quantity: 50,
    max_capacity: 5000,
    quantity_unit: 'Quintals',
    payment_terms: 'Factory cane receipt & DBT',
    grading_terms: 'Brix > 18%, freshly harvested',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    crop: MOCK_CROPS[8],
    dealer: DEMO_DEALERS[4]
  },

  // demo-dealer-6 (Oddanchatram / Dindigul): Tomato, Onion
  {
    id: 'demo-dcp-12',
    dealer_id: 'demo-dealer-6',
    crop_id: 'c6',
    buying_price: 1950, // Top Tomato quote!
    unit: '₹/Quintal',
    active: true,
    min_quantity: 5,
    max_capacity: 500,
    quantity_unit: 'Quintals',
    payment_terms: 'Daily cash or immediate UPI',
    grading_terms: 'Grade A hybrid, firm ripe, 25kg crates',
    created_at: '2026-03-01T10:30:00Z',
    updated_at: '2026-03-01T10:30:00Z',
    crop: MOCK_CROPS[5],
    dealer: DEMO_DEALERS[5]
  },
  {
    id: 'demo-dcp-13',
    dealer_id: 'demo-dealer-6',
    crop_id: 'c10',
    buying_price: 2850, // Top Onion quote!
    unit: '₹/Quintal',
    active: true,
    min_quantity: 10,
    max_capacity: 800,
    quantity_unit: 'Quintals',
    payment_terms: 'Same-day mandi settlement',
    grading_terms: 'Dry outer skin, 45mm+ size',
    created_at: '2026-03-01T10:30:00Z',
    updated_at: '2026-03-01T10:30:00Z',
    crop: MOCK_CROPS[9],
    dealer: DEMO_DEALERS[5]
  },

  // demo-dealer-7 (Namakkal): Maize, Soybean
  {
    id: 'demo-dcp-14',
    dealer_id: 'demo-dealer-7',
    crop_id: 'c4',
    buying_price: 2450, // Top Maize quote!
    unit: '₹/Quintal',
    active: true,
    min_quantity: 25,
    max_capacity: 3500,
    quantity_unit: 'Quintals',
    payment_terms: 'Truck weighbridge printout & IMPS',
    grading_terms: 'Moisture < 12%, no mold, yellow corn',
    created_at: '2026-03-01T11:00:00Z',
    updated_at: '2026-03-01T11:00:00Z',
    crop: MOCK_CROPS[3],
    dealer: DEMO_DEALERS[6]
  },
  {
    id: 'demo-dcp-15',
    dealer_id: 'demo-dealer-7',
    crop_id: 'c8',
    buying_price: 4950, // Soybean
    unit: '₹/Quintal',
    active: true,
    min_quantity: 15,
    max_capacity: 1000,
    quantity_unit: 'Quintals',
    payment_terms: 'Electronic bank transfer within 2 hrs',
    grading_terms: 'Protein > 38%, moisture < 10%',
    created_at: '2026-03-01T11:00:00Z',
    updated_at: '2026-03-01T11:00:00Z',
    crop: MOCK_CROPS[7],
    dealer: DEMO_DEALERS[6]
  },

  // demo-dealer-8 (Panruti / Cuddalore): Groundnut
  {
    id: 'demo-dcp-16',
    dealer_id: 'demo-dealer-8',
    crop_id: 'c3',
    buying_price: 7520, // Highest groundnut quote!
    unit: '₹/Quintal',
    active: true,
    min_quantity: 5,
    max_capacity: 1200,
    quantity_unit: 'Quintals',
    payment_terms: 'Instant cash or UPI payout at yard',
    grading_terms: 'TMV-7 pods, clean, moisture < 9%',
    created_at: '2026-03-01T11:30:00Z',
    updated_at: '2026-03-01T11:30:00Z',
    crop: MOCK_CROPS[2],
    dealer: DEMO_DEALERS[7]
  },

  // demo-dealer-9 (Dharmapuri): Tomato, Maize
  {
    id: 'demo-dcp-17',
    dealer_id: 'demo-dealer-9',
    crop_id: 'c6',
    buying_price: 1880,
    unit: '₹/Quintal',
    active: true,
    min_quantity: 5,
    max_capacity: 400,
    quantity_unit: 'Quintals',
    payment_terms: 'On-spot cash or UPI at mandi',
    grading_terms: 'Freshly picked, firm skin',
    created_at: '2026-03-01T12:00:00Z',
    updated_at: '2026-03-01T12:00:00Z',
    crop: MOCK_CROPS[5],
    dealer: DEMO_DEALERS[8]
  },
  {
    id: 'demo-dcp-18',
    dealer_id: 'demo-dealer-9',
    crop_id: 'c4',
    buying_price: 2340,
    unit: '₹/Quintal',
    active: true,
    min_quantity: 10,
    max_capacity: 800,
    quantity_unit: 'Quintals',
    payment_terms: 'Immediate bank transfer',
    grading_terms: 'Standard grain quality',
    created_at: '2026-03-01T12:00:00Z',
    updated_at: '2026-03-01T12:00:00Z',
    crop: MOCK_CROPS[3],
    dealer: DEMO_DEALERS[8]
  },

  // demo-dealer-10 (Tirunelveli): Paddy Basmati, Paddy Common, Cotton
  {
    id: 'demo-dcp-19',
    dealer_id: 'demo-dealer-10',
    crop_id: 'c1',
    buying_price: 3680, // Highest Basmati quote in South TN!
    unit: '₹/Quintal',
    active: true,
    min_quantity: 10,
    max_capacity: 1200,
    quantity_unit: 'Quintals',
    payment_terms: 'Spot RTGS settlement',
    grading_terms: 'Moisture < 13%, minimum broken grain',
    created_at: '2026-03-01T12:30:00Z',
    updated_at: '2026-03-01T12:30:00Z',
    crop: MOCK_CROPS[0],
    dealer: DEMO_DEALERS[9]
  },
  {
    id: 'demo-dcp-20',
    dealer_id: 'demo-dealer-10',
    crop_id: 'c2',
    buying_price: 2510,
    unit: '₹/Quintal',
    active: true,
    min_quantity: 10,
    max_capacity: 2000,
    quantity_unit: 'Quintals',
    payment_terms: 'Direct bank transfer within 2 hours',
    grading_terms: 'Common paddy FAQ grade',
    created_at: '2026-03-01T12:30:00Z',
    updated_at: '2026-03-01T12:30:00Z',
    crop: MOCK_CROPS[1],
    dealer: DEMO_DEALERS[9]
  },
  {
    id: 'demo-dcp-21',
    dealer_id: 'demo-dealer-10',
    crop_id: 'c5',
    buying_price: 7650,
    unit: '₹/Quintal',
    active: true,
    min_quantity: 10,
    max_capacity: 500,
    quantity_unit: 'Quintals',
    payment_terms: 'Same day RTGS payout',
    grading_terms: 'Long staple cotton, dry condition',
    created_at: '2026-03-01T12:30:00Z',
    updated_at: '2026-03-01T12:30:00Z',
    crop: MOCK_CROPS[4],
    dealer: DEMO_DEALERS[9]
  }
];

// Combine demo dealers with their crop prices for instant structured lookup
export const ALL_DEMO_DEALERS: Dealer[] = DEMO_DEALERS.map((dealer) => ({
  ...dealer,
  crop_prices: DEMO_DEALER_CROP_PRICES.filter((cp) => cp.dealer_id === dealer.id)
}));

import { ProduceInquiry } from '@/types';

export const INITIAL_DEMO_INQUIRIES: ProduceInquiry[] = [
  {
    id: 'inq-demo-1',
    dealerId: 'd1',
    dealerName: 'Sri Balaji Agro Crop Buyers & Traders',
    farmerName: 'Murugan Ramasamy',
    farmerPhone: '+91 98451 23456',
    cropName: 'Paddy Samba Masuri',
    estimatedQuantity: '45 Quintals',
    expectedPrice: '₹3,550/Quintal',
    message: 'Harvest completed yesterday. Moisture level ~13.5%. Available for immediate pickup at Katpadi farm.',
    createdAt: '2026-08-24T09:30:00Z',
    status: 'new'
  },
  {
    id: 'inq-demo-2',
    dealerId: 'd1',
    dealerName: 'Sri Balaji Agro Crop Buyers & Traders',
    farmerName: 'K. Selvam',
    farmerPhone: '+91 94421 88990',
    cropName: 'Tomato Hybrid',
    estimatedQuantity: '20 Crates (500 kg)',
    expectedPrice: '₹2,400/Quintal',
    message: 'Grade-A red ripe tomatoes packed in plastic crates. Looking to dispatch to your mandi yard tomorrow morning.',
    createdAt: '2026-08-23T14:15:00Z',
    status: 'contacted'
  }
];
