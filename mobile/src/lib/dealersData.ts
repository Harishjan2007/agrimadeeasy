/**
 * AgriME Mobile — Demonstration Produce Dealers & Buyer Directory
 * Exact 10 demonstration dealer profiles distributed across Tamil Nadu agricultural hubs
 * matching website src/lib/dealers-data.ts.
 */

export interface DealerProfile {
  id: string;
  profile_id: string;
  shop_name: string;
  owner_name: string;
  address: string;
  phone: string;
  opening_hours: string;
  latitude: number;
  longitude: number;
  district: string;
  isDemo: boolean;
  buyer_type: string;
  purchase_conditions: string;
  verified: boolean;
  crops_handled: string[];
}

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

export const DEMO_DEALER_PROFILES: DealerProfile[] = [
  {
    id: 'demo-dealer-1',
    profile_id: 'u-demo-dealer-1',
    shop_name: 'Cauvery Delta Rice Mill & Direct Buying Hub [Demo Dealer]',
    owner_name: 'P. Shanmugam (Demo Buyer)',
    address: 'Old Thanjavur Road, Near APMC Market Yard, Thanjavur - 613001',
    phone: '+91 90000 00001 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 6:30 AM - 7:00 PM',
    latitude: 10.7870,
    longitude: 79.1378,
    district: 'Thanjavur',
    isDemo: true,
    buyer_type: 'Modern Rice Mill & Processing Hub',
    purchase_conditions: 'Moisture < 14%, immediate electronic weighment & spot RTGS/NEFT payment.',
    verified: true,
    crops_handled: ['Paddy (Basmati)', 'Paddy (Common)', 'Groundnut', 'Black Gram', 'Green Gram']
  },
  {
    id: 'demo-dealer-2',
    profile_id: 'u-demo-dealer-2',
    shop_name: 'Kongu Commercial Grains & Oilseed Traders [Demo Dealer]',
    owner_name: 'K. Rajendran (Demo Buyer)',
    address: 'Leigh Bazaar Commercial Complex, Salem - 636009',
    phone: '+91 90000 00002 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 7:00 AM - 8:00 PM',
    latitude: 11.6643,
    longitude: 78.1460,
    district: 'Salem',
    isDemo: true,
    buyer_type: 'Wholesale Mandi Merchant',
    purchase_conditions: 'Standard 50kg gunny bags preferred; moisture test done on-site; spot payout.',
    verified: true,
    crops_handled: ['Groundnut', 'Maize', 'Millets', 'Soybean', 'Commercial Grains']
  },
  {
    id: 'demo-dealer-3',
    profile_id: 'u-demo-dealer-3',
    shop_name: 'Trichy Regional Farmer Cooperative Procurement Hub [Demo Dealer]',
    owner_name: 'S. Chandrasekar (Demo Manager)',
    address: 'Subramaniapuram Agri Warehousing Zone, Tiruchirappalli - 620020',
    phone: '+91 90000 00003 (Sample Demo Only)',
    opening_hours: 'Mon - Fri: 8:00 AM - 6:00 PM',
    latitude: 10.7905,
    longitude: 78.7047,
    district: 'Tiruchirappalli',
    isDemo: true,
    buyer_type: 'FPO / Farmer Cooperative Buying Hub',
    purchase_conditions: 'FPO member bonus applicable; direct DBT settlement within 24 hours of delivery.',
    verified: true,
    crops_handled: ['Paddy (Common)', 'Maize', 'Pulses', 'Sesame', 'Millets']
  },
  {
    id: 'demo-dealer-4',
    profile_id: 'u-demo-dealer-4',
    shop_name: 'Madurai Pandian Agro Commodities & Cotton Yard [Demo Dealer]',
    owner_name: 'M. Pandi (Demo Buyer)',
    address: 'Mattuthavani Wholesale Yard, Madurai - 625007',
    phone: '+91 90000 00004 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 6:00 AM - 7:30 PM',
    latitude: 9.9252,
    longitude: 78.1198,
    district: 'Madurai',
    isDemo: true,
    buyer_type: 'Cotton Ginning & Commercial Buyer',
    purchase_conditions: 'Moisture < 8% for cotton, trash content < 3%; automated electronic grading.',
    verified: true,
    crops_handled: ['Cotton', 'Paddy', 'Chilli', 'Groundnut', 'Coriander']
  },
  {
    id: 'demo-dealer-5',
    profile_id: 'u-demo-dealer-5',
    shop_name: 'Erode Agro Processing & Turmeric Expellers [Demo Dealer]',
    owner_name: 'V. Sundaram (Demo Miller)',
    address: 'Perundurai SIPCOT Agri Zone, Erode - 638052',
    phone: '+91 90000 00005 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 7:30 AM - 7:30 PM',
    latitude: 11.3410,
    longitude: 77.7172,
    district: 'Erode',
    isDemo: true,
    buyer_type: 'Oilseed Expeller & Commercial Processor',
    purchase_conditions: 'Oil content > 42% for groundnut pods; free unloading at mill yard for > 20Q.',
    verified: true,
    crops_handled: ['Turmeric', 'Groundnut', 'Sesame', 'Sunflower', 'Tapioca']
  },
  {
    id: 'demo-dealer-6',
    profile_id: 'u-demo-dealer-6',
    shop_name: 'Oddanchatram Fresh Harvest Cold Storage & Mandi [Demo Dealer]',
    owner_name: 'R. Velusamy (Demo Merchant)',
    address: 'Vegetable Wholesale Market Road, Oddanchatram, Dindigul - 624619',
    phone: '+91 90000 00006 (Sample Demo Only)',
    opening_hours: 'Daily: 4:30 AM - 4:00 PM',
    latitude: 10.4900,
    longitude: 77.7470,
    district: 'Dindigul',
    isDemo: true,
    buyer_type: 'Vegetable Commission & Cold Storage Merchant',
    purchase_conditions: 'Graded produce (A-grade crates preferred); immediate daily auction settlement.',
    verified: true,
    crops_handled: ['Tomato', 'Onion', 'Drumstick', 'Chilli', 'Green Vegetables']
  },
  {
    id: 'demo-dealer-7',
    profile_id: 'u-demo-dealer-7',
    shop_name: 'Namakkal Poultry Feed Mills & Grain Buyers [Demo Dealer]',
    owner_name: 'K. Nallathambi (Demo Principal)',
    address: 'Paramathi Velur Road, Namakkal - 637001',
    phone: '+91 90000 00007 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 8:00 AM - 8:00 PM',
    latitude: 11.2189,
    longitude: 78.1674,
    district: 'Namakkal',
    isDemo: true,
    buyer_type: 'Feed Mill & Poultry Grain Buyer',
    purchase_conditions: 'Bulk corn and soya; aflatoxin < 20 ppb, moisture < 12%; truck weighbridge on site.',
    verified: true,
    crops_handled: ['Maize', 'Soybean', 'Bajra', 'Sorghum', 'Broken Rice']
  },
  {
    id: 'demo-dealer-8',
    profile_id: 'u-demo-dealer-8',
    shop_name: 'Panruti Golden Groundnut & Cashew Mart [Demo Dealer]',
    owner_name: 'T. Arulraj (Demo Trader)',
    address: 'Cuddalore Main Road, Panruti, Cuddalore - 607106',
    phone: '+91 90000 00008 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 7:00 AM - 6:30 PM',
    latitude: 11.7753,
    longitude: 79.5537,
    district: 'Cuddalore',
    isDemo: true,
    buyer_type: 'Oilseed Expeller & Commercial Processor',
    purchase_conditions: 'Well-dried pods only; moisture < 9%; shell-out ratio minimum 70%.',
    verified: true,
    crops_handled: ['Groundnut', 'Cashew', 'Jackfruit', 'Sesame', 'Paddy']
  },
  {
    id: 'demo-dealer-9',
    profile_id: 'u-demo-dealer-9',
    shop_name: 'Dharmapuri Tomato & Millet Procurement Agency [Demo Dealer]',
    owner_name: 'C. Govindaraj (Demo Commission Agent)',
    address: 'Pennagaram Road, Dharmapuri - 636701',
    phone: '+91 90000 00009 (Sample Demo Only)',
    opening_hours: 'Daily: 5:00 AM - 3:00 PM',
    latitude: 12.1211,
    longitude: 78.1582,
    district: 'Dharmapuri',
    isDemo: true,
    buyer_type: 'Vegetable Commission & Cold Storage Merchant',
    purchase_conditions: 'Direct collection for lots over 30 plastic crates; daily cash/UPI settlement.',
    verified: true,
    crops_handled: ['Tomato', 'Ragi (Finger Millet)', 'Samai', 'Mango', 'Chilli']
  },
  {
    id: 'demo-dealer-10',
    profile_id: 'u-demo-dealer-10',
    shop_name: 'Tirunelveli Nellai Agro Traders & Pulses Hub [Demo Dealer]',
    owner_name: 'A. Muthiah (Demo Buyer)',
    address: 'Tiruchendur Road, Palayamkottai, Tirunelveli - 627002',
    phone: '+91 90000 00010 (Sample Demo Only)',
    opening_hours: 'Mon - Sat: 7:00 AM - 7:00 PM',
    latitude: 8.7139,
    longitude: 77.7567,
    district: 'Tirunelveli',
    isDemo: true,
    buyer_type: 'Wholesale Mandi Merchant',
    purchase_conditions: 'Clean dry pulses and paddy; no insect damage; direct bank payout on weighing.',
    verified: true,
    crops_handled: ['Paddy', 'Black Gram', 'Green Gram', 'Sesame', 'Banana']
  }
];
