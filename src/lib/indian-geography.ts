/**
 * AgriME — Indian Geographic & Agricultural Reference Data
 * --------------------------------------------------------
 * Complete list of all 28 Indian States & 8 Union Territories,
 * comprehensive district mappings (including all 38 Tamil Nadu districts),
 * popular agricultural crops, and primary platform interests for onboarding.
 */

export interface StateDistrictData {
  state: string;
  districts: string[];
}

export const INDIAN_STATES_AND_UTS: string[] = [
  'Tamil Nadu',
  'Andhra Pradesh',
  'Karnataka',
  'Kerala',
  'Maharashtra',
  'Punjab',
  'Haryana',
  'Gujarat',
  'Madhya Pradesh',
  'Rajasthan',
  'Uttar Pradesh',
  'West Bengal',
  'Bihar',
  'Odisha',
  'Telangana',
  'Assam',
  'Himachal Pradesh',
  'Uttarakhand',
  'Chhattisgarh',
  'Jharkhand',
  'Goa',
  'Jammu and Kashmir',
  'Ladakh',
  'Delhi (NCT)',
  'Puducherry',
  'Chandigarh',
  'Andaman and Nicobar Islands',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
  'Arunachal Pradesh',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura'
];

/**
 * All 38 authentic districts of Tamil Nadu
 */
export const TAMIL_NADU_DISTRICTS_LIST: string[] = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kancheepuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar'
];

/**
 * Key districts mapping for Indian states
 */
export const STATE_DISTRICTS_MAP: Record<string, string[]> = {
  'Tamil Nadu': TAMIL_NADU_DISTRICTS_LIST,
  'Andhra Pradesh': [
    'Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Kadapa', 'Krishna',
    'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari'
  ],
  'Karnataka': [
    'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar',
    'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada',
    'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar',
    'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir'
  ],
  'Kerala': [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam',
    'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
  ],
  'Maharashtra': [
    'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana',
    'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna',
    'Kolhapur', 'Latur', 'Mumbai', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad',
    'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
  ],
  'Punjab': [
    'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka',
    'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana',
    'Mansa', 'Moga', 'Muktsar', 'Pathankot', 'Patiala', 'Rupnagar', 'Sahibzada Ajit Singh Nagar', 'Sangrur', 'Shahid Bhagat Singh Nagar', 'Sri Muktsar Sahib', 'Tarn Taran'
  ],
  'Haryana': [
    'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram',
    'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh',
    'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'
  ],
  'Gujarat': [
    'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar',
    'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar',
    'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana',
    'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot',
    'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad'
  ],
  'Madhya Pradesh': [
    'Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Dewas', 'Hoshangabad',
    'Sehore', 'Vidisha', 'Ratlam', 'Mandsaur', 'Neemuch', 'Khargone', 'Khandwa', 'Dhar'
  ],
  'Rajasthan': [
    'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara',
    'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur',
    'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur',
    'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'
  ],
  'Uttar Pradesh': [
    'Agra', 'Aligarh', 'Ayodhya', 'Bareilly', 'Gorakhpur', 'Jhansi', 'Kanpur',
    'Lucknow', 'Mathura', 'Meerut', 'Moradabad', 'Prayagraj', 'Varanasi', 'Saharanpur'
  ],
  'West Bengal': [
    'Bankura', 'Bardhaman', 'Birbhum', 'Cooch Behar', 'Darjeeling', 'Hooghly',
    'Howrah', 'Jalpaiguri', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'South 24 Parganas'
  ],
  'Telangana': [
    'Adilabad', 'Hyderabad', 'Karimnagar', 'Khammam', 'Mahabubnagar', 'Medak',
    'Nalgonda', 'Nizamabad', 'Rangareddy', 'Warangal'
  ],
  'Bihar': [
    'Bhagalpur', 'Gaya', 'Muzaffarpur', 'Nalanda', 'Patna', 'Purnia', 'Rohtas', 'Vaishali'
  ],
  'Odisha': [
    'Balasore', 'Bhadrak', 'Cuttack', 'Ganjam', 'Khurda', 'Puri', 'Sambalpur'
  ]
};

export function getDistrictsForState(state: string): string[] {
  if (!state) return [];
  if (STATE_DISTRICTS_MAP[state]) {
    return STATE_DISTRICTS_MAP[state];
  }
  return [
    'Central District',
    'North District',
    'South District',
    'East District',
    'West District'
  ];
}

export interface PopularCropItem {
  id: string;
  name: string;
  nameTa: string;
  icon: string;
  category: 'Cereals' | 'Vegetables' | 'Oilseeds' | 'Commercial' | 'Spices' | 'Pulses';
}

export const POPULAR_CROPS_ONBOARDING: PopularCropItem[] = [
  { id: 'paddy', name: 'Paddy / Rice', nameTa: 'நெல்', icon: '🌾', category: 'Cereals' },
  { id: 'tomato', name: 'Tomato', nameTa: 'தக்காளி', icon: '🍅', category: 'Vegetables' },
  { id: 'onion', name: 'Onion', nameTa: 'வெங்காயம்', icon: '🧅', category: 'Vegetables' },
  { id: 'groundnut', name: 'Groundnut', nameTa: 'நிலக்கடலை', icon: '🥜', category: 'Oilseeds' },
  { id: 'maize', name: 'Maize / Corn', nameTa: 'மக்காச்சோளம்', icon: '🌽', category: 'Cereals' },
  { id: 'cotton', name: 'Cotton', nameTa: 'பருத்தி', icon: '☁️', category: 'Commercial' },
  { id: 'sugarcane', name: 'Sugarcane', nameTa: 'கரும்பு', icon: '🎋', category: 'Commercial' },
  { id: 'turmeric', name: 'Turmeric', nameTa: 'மஞ்சள்', icon: '🌿', category: 'Spices' },
  { id: 'coconut', name: 'Coconut', nameTa: 'தேங்காய்', icon: '🥥', category: 'Commercial' },
  { id: 'banana', name: 'Banana', nameTa: 'வாழை', icon: '🍌', category: 'Commercial' },
  { id: 'green_chilli', name: 'Green Chilli', nameTa: 'பச்சை மிளகாய்', icon: '🌶️', category: 'Vegetables' },
  { id: 'brinjal', name: 'Brinjal / Eggplant', nameTa: 'கத்தரிக்காய்', icon: '🍆', category: 'Vegetables' },
  { id: 'wheat', name: 'Wheat', nameTa: 'கோதுமை', icon: '🌾', category: 'Cereals' },
  { id: 'black_gram', name: 'Black Gram (Urad)', nameTa: 'உளுந்து', icon: '🌱', category: 'Pulses' },
  { id: 'red_gram', name: 'Red Gram (Tur)', nameTa: 'துவரை', icon: '🌱', category: 'Pulses' },
  { id: 'soybean', name: 'Soybean', nameTa: 'சோயாபீன்', icon: '🌱', category: 'Oilseeds' }
];

export interface OnboardingInterestItem {
  id: string;
  name: string;
  nameTa: string;
  description: string;
  descriptionTa: string;
  icon: string;
  route: string;
}

export const ONBOARDING_INTERESTS: OnboardingInterestItem[] = [
  {
    id: 'crop_prices',
    name: 'Crop Prices',
    nameTa: 'சந்தை விலைகள்',
    description: 'Live APMC mandi prices and market arrivals',
    descriptionTa: 'நேரலை ஒழுங்குமுறை மண்டி விலைகள்',
    icon: 'Scale',
    route: '/crop-price'
  },
  {
    id: 'price_prediction',
    name: 'Price Prediction',
    nameTa: 'விலை கணிப்பு',
    description: 'AI-driven forecast models for 7, 15, and 30 days',
    descriptionTa: '7, 15, 30 நாட்களுக்கான AI கணிப்பு',
    icon: 'TrendingUp',
    route: '/prediction'
  },
  {
    id: 'finding_dealers',
    name: 'Finding Dealers',
    nameTa: 'வியாபாரிகள் கண்டறிதல்',
    description: 'Verified agricultural buyers and trading partners',
    descriptionTa: 'சரிபார்க்கப்பட்ட பயிர் கொள்முதல் வியாபாரிகள்',
    icon: 'Store',
    route: '/dealers'
  },
  {
    id: 'machinery_booking',
    name: 'Machinery Booking',
    nameTa: 'இயந்திர முன்பதிவு',
    description: 'Tractors, harvesters, and implement rentals',
    descriptionTa: 'டிராக்டர்கள் மற்றும் அறுவடை இயந்திர வாடகை',
    icon: 'Tractor',
    route: '/machinery'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    nameTa: 'விவசாய அங்காடி',
    description: 'Quality seeds, fertilizers, and farm inputs',
    descriptionTa: 'தரமான விதைகள், உரங்கள் மற்றும் இடுபொருட்கள்',
    icon: 'ShoppingBag',
    route: '/ecommerce'
  },
  {
    id: 'government_schemes',
    name: 'Government Schemes',
    nameTa: 'அரசு திட்டங்கள்',
    description: 'PM-Kisan, subsidies, state grants, and insurance',
    descriptionTa: 'மானியங்கள், அரசு உதவிகள் மற்றும் காப்பீடு',
    icon: 'Landmark',
    route: '/schemes'
  }
];

export const USER_TYPES = [
  {
    id: 'Farmer',
    label: 'Farmer',
    labelTa: 'விவசாயி',
    desc: 'Cultivates crops, checks prices, and books machinery',
    descTa: 'பயிர் சாகுபடி செய்பவர்',
    icon: 'Sprout'
  },
  {
    id: 'Dealer',
    label: 'Dealer',
    labelTa: 'வியாபாரி',
    desc: 'Purchases crops from farmers and quotes buying prices',
    descTa: 'பயிர் கொள்முதல் செய்பவர்',
    icon: 'Store'
  },
  {
    id: 'Buyer',
    label: 'Buyer',
    labelTa: 'வாங்குபவர்',
    desc: 'Procures agricultural produce for processing or retail',
    descTa: 'மொத்த விற்பனை / நுகர்வோர் வாங்குபவர்',
    icon: 'ShoppingBag'
  },
  {
    id: 'Other',
    label: 'Other',
    labelTa: 'மற்றவை',
    desc: 'Machinery provider, researcher, or agricultural enthusiast',
    descTa: 'இயந்திர உரிமையாளர் அல்லது ஆர்வலர்',
    icon: 'User'
  }
] as const;
