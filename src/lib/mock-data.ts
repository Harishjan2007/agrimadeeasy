import {
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
  Profile
} from '@/types';

export const MOCK_CROPS: Crop[] = [
  { id: 'c1', name: 'Paddy (Basmati)', category: 'Cereals', icon: '🌾' },
  { id: 'c2', name: 'Paddy (Common / Sona Masuri)', category: 'Cereals', icon: '🌾' },
  { id: 'c3', name: 'Groundnut (Peanut)', category: 'Oilseeds', icon: '🥜' },
  { id: 'c4', name: 'Maize (Corn)', category: 'Cereals', icon: '🌽' },
  { id: 'c5', name: 'Cotton (Long Staple)', category: 'Fiber', icon: '☁️' },
  { id: 'c6', name: 'Tomato (Hybrid)', category: 'Vegetables', icon: '🍅' },
  { id: 'c7', name: 'Wheat (Sharbati)', category: 'Cereals', icon: '🌾' },
  { id: 'c8', name: 'Soybean', category: 'Oilseeds', icon: '🌱' },
  { id: 'c9', name: 'Sugarcane', category: 'Commercial', icon: '🎋' },
  { id: 'c10', name: 'Onion (Red)', category: 'Vegetables', icon: '🧅' }
];

export const MOCK_MARKETS: Market[] = [
  { id: 'm1', name: 'Vellore Central APMC Mandi', location: 'Vellore, Tamil Nadu', state: 'Tamil Nadu', latitude: 12.9165, longitude: 79.1325 },
  { id: 'm2', name: 'Thiruvannamalai Regulated Market', location: 'Thiruvannamalai, Tamil Nadu', state: 'Tamil Nadu', latitude: 12.2253, longitude: 79.0747 },
  { id: 'm3', name: 'Kanchipuram Agricultural Market', location: 'Kanchipuram, Tamil Nadu', state: 'Tamil Nadu', latitude: 12.8342, longitude: 79.7036 },
  { id: 'm4', name: 'Salem Main Agri Market', location: 'Salem, Tamil Nadu', state: 'Tamil Nadu', latitude: 11.6643, longitude: 78.1460 },
  { id: 'm5', name: 'Guntur Mirchi & Grain Yard', location: 'Guntur, Andhra Pradesh', state: 'Andhra Pradesh', latitude: 16.3067, longitude: 80.4365 },
  { id: 'm6', name: 'Kurnool APMC Market', location: 'Kurnool, Andhra Pradesh', state: 'Andhra Pradesh', latitude: 15.8281, longitude: 78.0373 }
];

export const MOCK_CROP_PRICES: CropPrice[] = [
  {
    id: 'cp1',
    crop_id: 'c1',
    market_id: 'm1',
    price: 3450,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T06:30:00Z',
    source: 'Vellore Mandi Board',
    crop: MOCK_CROPS[0],
    market: MOCK_MARKETS[0]
  },
  {
    id: 'cp2',
    crop_id: 'c2',
    market_id: 'm1',
    price: 2380,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T06:30:00Z',
    source: 'Vellore Mandi Board',
    crop: MOCK_CROPS[1],
    market: MOCK_MARKETS[0]
  },
  {
    id: 'cp3',
    crop_id: 'c3',
    market_id: 'm2',
    price: 6850,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T07:15:00Z',
    source: 'Thiruvannamalai Regulated Market',
    crop: MOCK_CROPS[2],
    market: MOCK_MARKETS[1]
  },
  {
    id: 'cp4',
    crop_id: 'c4',
    market_id: 'm1',
    price: 2150,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T06:45:00Z',
    source: 'Vellore Mandi Board',
    crop: MOCK_CROPS[3],
    market: MOCK_MARKETS[0]
  },
  {
    id: 'cp5',
    crop_id: 'c5',
    market_id: 'm5',
    price: 7420,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T08:00:00Z',
    source: 'Guntur APMC Yard',
    crop: MOCK_CROPS[4],
    market: MOCK_MARKETS[4]
  },
  {
    id: 'cp6',
    crop_id: 'c6',
    market_id: 'm3',
    price: 1850,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T06:00:00Z',
    source: 'Kanchipuram Farmers Market',
    crop: MOCK_CROPS[5],
    market: MOCK_MARKETS[2]
  },
  {
    id: 'cp7',
    crop_id: 'c7',
    market_id: 'm4',
    price: 2450,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T07:30:00Z',
    source: 'Salem Agri Board',
    crop: MOCK_CROPS[6],
    market: MOCK_MARKETS[3]
  },
  {
    id: 'cp8',
    crop_id: 'c10',
    market_id: 'm1',
    price: 2200,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T06:30:00Z',
    source: 'Vellore Mandi Board',
    crop: MOCK_CROPS[9],
    market: MOCK_MARKETS[0]
  },
  {
    id: 'cp9',
    crop_id: 'c2',
    market_id: 'm2',
    price: 2450,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T07:00:00Z',
    source: 'Thiruvannamalai Regulated Market',
    crop: MOCK_CROPS[1],
    market: MOCK_MARKETS[1]
  },
  {
    id: 'cp10',
    crop_id: 'c2',
    market_id: 'm3',
    price: 2320,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T06:15:00Z',
    source: 'Kanchipuram Agricultural Market',
    crop: MOCK_CROPS[1],
    market: MOCK_MARKETS[2]
  },
  {
    id: 'cp11',
    crop_id: 'c2',
    market_id: 'm4',
    price: 2510,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T07:45:00Z',
    source: 'Salem Main Agri Market',
    crop: MOCK_CROPS[1],
    market: MOCK_MARKETS[3]
  },
  {
    id: 'cp12',
    crop_id: 'c3',
    market_id: 'm1',
    price: 6720,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T06:30:00Z',
    source: 'Vellore Mandi Board',
    crop: MOCK_CROPS[2],
    market: MOCK_MARKETS[0]
  },
  {
    id: 'cp13',
    crop_id: 'c3',
    market_id: 'm4',
    price: 7050,
    unit: '₹/Quintal',
    recorded_at: '2026-08-24T07:30:00Z',
    source: 'Salem Agri Board',
    crop: MOCK_CROPS[2],
    market: MOCK_MARKETS[3]
  }
];

export const MOCK_PREDICTIONS: CropPrediction[] = [
  {
    id: 'pr1',
    crop_id: 'c1',
    market_id: 'm1',
    current_price: 3450,
    predicted_min: 3600,
    predicted_max: 3850,
    trend: 'up',
    prediction_date: '2026-08-24',
    prediction_period: 'Next 15 Days (Harvest Peak)',
    crop: MOCK_CROPS[0],
    market: MOCK_MARKETS[0]
  },
  {
    id: 'pr1b',
    crop_id: 'c1',
    market_id: 'm1',
    current_price: 3450,
    predicted_min: 3750,
    predicted_max: 4050,
    trend: 'up',
    prediction_date: '2026-08-24',
    prediction_period: 'Next 30 Days (Post-Harvest Stabilization)',
    crop: MOCK_CROPS[0],
    market: MOCK_MARKETS[0]
  },
  {
    id: 'pr1c',
    crop_id: 'c1',
    market_id: 'm4',
    current_price: 3520,
    predicted_min: 3680,
    predicted_max: 3950,
    trend: 'up',
    prediction_date: '2026-08-24',
    prediction_period: 'Next 15 Days (Mill Procurement)',
    crop: MOCK_CROPS[0],
    market: MOCK_MARKETS[3]
  },
  {
    id: 'pr2',
    crop_id: 'c3',
    market_id: 'm2',
    current_price: 6850,
    predicted_min: 7100,
    predicted_max: 7400,
    trend: 'up',
    prediction_date: '2026-08-24',
    prediction_period: 'Next 30 Days (High Mill Demand)',
    crop: MOCK_CROPS[2],
    market: MOCK_MARKETS[1]
  },
  {
    id: 'pr2b',
    crop_id: 'c3',
    market_id: 'm4',
    current_price: 7050,
    predicted_min: 7200,
    predicted_max: 7550,
    trend: 'up',
    prediction_date: '2026-08-24',
    prediction_period: 'Next 15 Days (Oil Mill Inflow)',
    crop: MOCK_CROPS[2],
    market: MOCK_MARKETS[3]
  },
  {
    id: 'pr3',
    crop_id: 'c4',
    market_id: 'm1',
    current_price: 2150,
    predicted_min: 2050,
    predicted_max: 2200,
    trend: 'stable',
    prediction_date: '2026-08-24',
    prediction_period: 'Next 15 Days',
    crop: MOCK_CROPS[3],
    market: MOCK_MARKETS[0]
  },
  {
    id: 'pr4',
    crop_id: 'c6',
    market_id: 'm3',
    current_price: 1850,
    predicted_min: 1400,
    predicted_max: 1650,
    trend: 'down',
    prediction_date: '2026-08-24',
    prediction_period: 'Next 7 Days (Arrival Surge)',
    crop: MOCK_CROPS[5],
    market: MOCK_MARKETS[2]
  },
  {
    id: 'pr5',
    crop_id: 'c5',
    market_id: 'm5',
    current_price: 7420,
    predicted_min: 7600,
    predicted_max: 7900,
    trend: 'up',
    prediction_date: '2026-08-24',
    prediction_period: 'Next 20 Days (Textile Demand)',
    crop: MOCK_CROPS[4],
    market: MOCK_MARKETS[4]
  },
  {
    id: 'pr6',
    crop_id: 'c10',
    market_id: 'm1',
    current_price: 2200,
    predicted_min: 2600,
    predicted_max: 3100,
    trend: 'up',
    prediction_date: '2026-08-24',
    prediction_period: 'Next 15 Days (Seasonal Inflow Drop)',
    crop: MOCK_CROPS[9],
    market: MOCK_MARKETS[0]
  },
  {
    id: 'pr7',
    crop_id: 'c7',
    market_id: 'm4',
    current_price: 2450,
    predicted_min: 2400,
    predicted_max: 2520,
    trend: 'stable',
    prediction_date: '2026-08-24',
    prediction_period: 'Next 30 Days (Steady Buffer)',
    crop: MOCK_CROPS[6],
    market: MOCK_MARKETS[3]
  }
];

export const MOCK_SCHEMES: GovernmentScheme[] = [
  // 10 Central Government Schemes
  {
    id: 'sch1',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    description: 'Central Sector Scheme providing direct income support of ₹6,000 per year in three equal four-monthly installments of ₹2,000 directly into the bank accounts of landholding farmer families across India.',
    eligibility: 'All landholding farmer families with cultivable land in their names, subject to statutory exclusion criteria (such as institutional landholders, income tax payees, and constitutional post holders).',
    benefits: '₹6,000 per annum paid directly via Direct Benefit Transfer (DBT) into verified Aadhaar-seeded bank accounts in three equal installments of ₹2,000.',
    application_info: 'Apply online via pmkisan.gov.in (Farmer Corner) or visit your nearest Common Service Centre (CSC) / Village Agriculture Office with Aadhaar, Land records (Patta/Chitta), and active bank account passbook.',
    official_url: 'https://pmkisan.gov.in',
    source: 'Government of India - Ministry of Agriculture & Farmers Welfare',
    government_level: 'central',
    state: null,
    category: 'Direct Income Support',
    last_verified_at: '2026-08-24',
    created_at: '2026-01-15T00:00:00Z'
  },
  {
    id: 'sch2',
    name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    description: 'Capital subsidy assistance of 40% to 50% for purchasing tractors, power tillers, rotavators, drone sprayers, and combine harvesters, or establishing local Custom Hiring Centres (CHCs).',
    eligibility: 'Individual farmers, Small & Marginal farmers, Scheduled Castes (SC), Scheduled Tribes (ST), women farmers, Self-Help Groups (SHGs), and registered Farmer Producer Organizations (FPOs).',
    benefits: '40% to 50% capital subsidy on procurement cost of eligible agricultural equipment or up to ₹10 Lakhs for setting up a Custom Hiring Centre.',
    application_info: 'Register on the Central DBT Portal for Mechanization (agrimachinery.nic.in) and upload land ownership records (Patta/Chitta), caste certificate (if applicable), Aadhaar, bank passbook, and dealer quotation.',
    official_url: 'https://agrimachinery.nic.in',
    source: 'Government of India - Ministry of Agriculture & Farmers Welfare',
    government_level: 'central',
    state: null,
    category: 'Machinery Subsidy',
    last_verified_at: '2026-08-24',
    created_at: '2026-02-01T00:00:00Z'
  },
  {
    id: 'sch3',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    description: 'Comprehensive crop insurance coverage against non-preventable natural risks (drought, flood, unseasonal rain, pests & diseases, and post-harvest losses) from pre-sowing to post-harvest.',
    eligibility: 'All farmers growing notified crops in notified areas including loanee farmers, non-loanee farmers, sharecroppers, and tenant farmers.',
    benefits: 'Affordable premium rate of only 2% for Kharif food and oilseed crops, 1.5% for Rabi crops, and 5% for annual commercial/horticultural crops with 100% sum insured protection.',
    application_info: 'Enroll through your local commercial/cooperative bank branch, Primary Agricultural Cooperative Credit Society (PACS), Common Service Centre (CSC), or online on pmfby.gov.in before the seasonal cut-off date.',
    official_url: 'https://pmfby.gov.in',
    source: 'Government of India - Ministry of Agriculture & Farmers Welfare',
    government_level: 'central',
    state: null,
    category: 'Crop Insurance',
    last_verified_at: '2026-08-24',
    created_at: '2026-02-10T00:00:00Z'
  },
  {
    id: 'sch4',
    name: 'Kisan Credit Card (KCC) Scheme',
    description: 'Timely and simplified institutional credit facility designed to meet short-term cultivation requirements, post-harvest expenses, produce marketing loans, and maintenance of farm assets.',
    eligibility: 'All farmers, individual/joint borrowers, tenant farmers, oral lessees, sharecroppers, Self Help Groups (SHGs), and Joint Liability Groups (JLGs).',
    benefits: 'Revolving credit limit up to ₹3 Lakh at an effective concessional interest rate of 4% per annum upon prompt repayment, paired with an ATM-enabled RuPay Kisan Card.',
    application_info: 'Submit the simplified one-page KCC application form at your local commercial bank, regional rural bank (RRB), or cooperative bank branch along with land documents and identity proof.',
    official_url: 'https://www.myscheme.gov.in/schemes/kcc',
    source: 'Reserve Bank of India & Ministry of Agriculture & Farmers Welfare',
    government_level: 'central',
    state: null,
    category: 'Credit & Loans',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'sch5',
    name: 'Agriculture Infrastructure Fund (AIF)',
    description: 'Medium to long-term debt financing facility for investment in viable post-harvest management infrastructure and community farming assets such as warehouses, cold chains, silos, and primary processing units.',
    eligibility: 'Primary Agricultural Credit Societies (PACS), Marketing Cooperative Societies, Farmer Producer Organizations (FPOs), SHGs, Joint Liability Groups (JLGs), Agri-entrepreneurs, and Startups.',
    benefits: '3% per annum interest subvention on loans up to ₹2 Crores for a maximum period of 7 years, along with CGTMSE credit guarantee fee coverage.',
    application_info: 'Register and submit your infrastructure DPR online via the National AIF portal (agriinfra.dac.gov.in) and select your preferred lending financial institution.',
    official_url: 'https://agriinfra.dac.gov.in',
    source: 'Government of India - Ministry of Agriculture & Farmers Welfare',
    government_level: 'central',
    state: null,
    category: 'Infrastructure',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-05T00:00:00Z'
  },
  {
    id: 'sch6',
    name: 'Pradhan Mantri Krishi Sinchayee Yojana - Per Drop More Crop (PDMC)',
    description: 'Centrally sponsored initiative to promote precision water-saving technologies through micro-irrigation (Drip and Sprinkler irrigation systems), maximizing crop water productivity.',
    eligibility: 'All landholding farmers having an assured source of irrigation water, with special priority for Small and Marginal farmers, SC/ST, and women beneficiaries.',
    benefits: '55% financial assistance for Small & Marginal farmers and 45% for other categories of farmers for installing BIS-approved drip and sprinkler systems.',
    application_info: 'Apply through the State Horticulture / Agriculture Department micro-irrigation portal (e.g. TANHODA in Tamil Nadu) or consult the Block Assistant Director of Horticulture.',
    official_url: 'https://pmksy.gov.in',
    source: 'Government of India - Ministry of Agriculture & Farmers Welfare',
    government_level: 'central',
    state: null,
    category: 'Irrigation',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-08T00:00:00Z'
  },
  {
    id: 'sch7',
    name: 'Pradhan Mantri Kisan Maan Dhan Yojana (PM-KMY)',
    description: 'Old age pension scheme providing social security to small and marginal farmers upon retirement from active cultivation work.',
    eligibility: 'Small and marginal farmers aged between 18 and 40 years holding cultivable land up to 2 hectares in their name.',
    benefits: 'Guaranteed minimum monthly pension of ₹3,000 after attaining 60 years of age, with equal 50:50 matching monthly contribution funded by the Government of India.',
    application_info: 'Visit the nearest Common Service Centre (CSC) or enroll online at maandhan.in with Aadhaar Card, Savings Bank Account Passbook / PM-KISAN bank account details.',
    official_url: 'https://maandhan.in',
    source: 'Government of India - Ministry of Agriculture & Farmers Welfare',
    government_level: 'central',
    state: null,
    category: 'Direct Income Support',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-10T00:00:00Z'
  },
  {
    id: 'sch8',
    name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    description: 'Cluster-based organic farming promotion program supporting organic input generation, participatory guarantee certification (PGS-India), packaging, and domestic marketing.',
    eligibility: 'Groups of farmers forming contiguous organic cultivation clusters of at least 20 hectares (50 farmers).',
    benefits: 'Financial assistance of ₹50,000 per hectare over 3 years, of which ₹31,000 is given directly via DBT for on-farm organic inputs (vermicompost, bio-fertilizers).',
    application_info: 'Contact the local Block Agricultural Development Officer (ADO) or District Joint Director of Agriculture to join or register an organic cluster under the PGS-India portal.',
    official_url: 'https://pgsindia-ncof.gov.in',
    source: 'Government of India - Ministry of Agriculture & Farmers Welfare',
    government_level: 'central',
    state: null,
    category: 'Organic/Natural Farming',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-12T00:00:00Z'
  },
  {
    id: 'sch9',
    name: 'Mission for Integrated Development of Horticulture (MIDH)',
    description: 'Holistic growth initiative for the horticulture sector encompassing fruits, vegetables, root and tuber crops, mushrooms, spices, flowers, aromatic plants, coconut, and cocoa.',
    eligibility: 'Individual farmers, groups of growers, FPOs, and state horticultural cooperatives engaged in commercial horticultural cultivation.',
    benefits: 'Up to 40% - 50% subsidy for protected cultivation (polyhouses, shade net houses), high-density planting material, integrated post-harvest pack-houses, and cold rooms.',
    application_info: 'Submit project proposal and land records to the District Assistant Director of Horticulture or State Horticulture Mission portal.',
    official_url: 'https://midh.gov.in',
    source: 'Government of India - Ministry of Agriculture & Farmers Welfare',
    government_level: 'central',
    state: null,
    category: 'Horticulture',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-15T00:00:00Z'
  },
  {
    id: 'sch10',
    name: 'Central Sector Scheme for Formation and Promotion of 10,000 FPOs',
    description: 'Flagship national program to mobilize small and marginal farmers into commercially viable collectives (FPOs) to enhance economies of scale and direct market linkages.',
    eligibility: 'FPOs formed by a minimum of 300 farmer members in plains areas (100 in hilly/Northeast regions) registered under Companies Act or State Cooperative Societies Act.',
    benefits: 'Financial assistance up to ₹18 Lakhs per FPO for handholding support over 3 years, matching equity grant up to ₹2,000 per member (max ₹15 Lakhs), and institutional credit guarantee.',
    application_info: 'Reach out to designated Cluster-Based Business Organizations (CBBOs), NABARD Regional Offices, or Small Farmers\' Agri-Business Consortium (SFAC).',
    official_url: 'https://sfacindia.com',
    source: 'Small Farmers\' Agri-Business Consortium (SFAC) & NABARD',
    government_level: 'central',
    state: null,
    category: 'Farmer Organizations',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-18T00:00:00Z'
  },

  // 8 Tamil Nadu State Government Schemes
  {
    id: 'sch11',
    name: 'Kalaignarin All Village Integrated Agriculture Development Programme (KAVIADP)',
    description: 'Holistic village-level agriculture transformation mission in Tamil Nadu focusing on converting fallow lands to cultivable area, distributing high-yielding fruit/coconut saplings, and deploying community water harvesting.',
    eligibility: 'All agricultural landholding and tenant farmers residing within the selected Village Panchayats covered under the current operational phase in Tamil Nadu.',
    benefits: 'Free quality coconut seedlings and horticultural fruit saplings, 50% subsidy on farm implements kits, tarpaulins, power sprayers, and priority borewell/well creation in fallow clusters.',
    application_info: 'Register directly with the local Village Agricultural Extension Officer (VAEO) or Block Assistant Director of Agriculture through the AGRISNET portal / Uzhavan App.',
    official_url: 'https://tnagrisnet.tn.gov.in',
    source: 'Government of Tamil Nadu - Agriculture & Farmers Welfare Department',
    government_level: 'state',
    state: 'Tamil Nadu',
    category: 'Direct Income Support',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-20T00:00:00Z'
  },
  {
    id: 'sch12',
    name: 'Tamil Nadu Mission on Sustainable Dryland Agriculture (TN-MSDA)',
    description: 'Cluster-based development for rainfed and dryland farming zones across Tamil Nadu, promoting soil moisture conservation, drought-resilient millets, pulses, and oilseeds.',
    eligibility: 'Dryland and rainfed farmers possessing contiguous cultivable holdings in identified rainfed agricultural blocks across Tamil Nadu districts.',
    benefits: 'Subsidized summer ploughing assistance, 50% subsidy on bio-fertilizers, bio-pesticides, and certified dryland seed minikits, plus access to custom hiring farm machinery.',
    application_info: 'Apply through the Uzhavan Mobile App or visit your local Block Agricultural Extension Centre (AEC) with land Patta/Chitta records.',
    official_url: 'https://tnagrisnet.tn.gov.in',
    source: 'Government of Tamil Nadu - Agriculture & Farmers Welfare Department',
    government_level: 'state',
    state: 'Tamil Nadu',
    category: 'Soil Health',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-22T00:00:00Z'
  },
  {
    id: 'sch13',
    name: 'Kuruvai Cultivation Special Package Scheme',
    description: 'Annual seasonal input package provided to Cauvery Delta paddy cultivators to facilitate timely Kuruvai transplanting and optimize harvest yields.',
    eligibility: 'Paddy farmers cultivating Kuruvai crop in the Cauvery Delta region (Thanjavur, Tiruvarur, Nagapattinam, Mayiladuthurai, Tiruchirappalli, Cuddalore, and Pudukkottai).',
    benefits: '100% full input subsidy on certified paddy seeds, chemical fertilizers (Urea, DAP, Potash), bio-fertilizers, and micro-nutrient mixtures per acre.',
    application_info: 'Enroll at your local Primary Agricultural Cooperative Credit Society (PACS) or Agriculture Extension Centre by submitting Aadhaar and Chitta before seasonal transplantation.',
    official_url: 'https://tnagrisnet.tn.gov.in',
    source: 'Government of Tamil Nadu - Agriculture & Farmers Welfare Department',
    government_level: 'state',
    state: 'Tamil Nadu',
    category: 'Seeds & Planting Material',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-24T00:00:00Z'
  },
  {
    id: 'sch14',
    name: 'Tamil Nadu Organic Farming Mission (TNOFM)',
    description: 'State mission to expand chemical-free ecological farming, promote natural inputs production hubs, and facilitate free organic certification for farmer groups.',
    eligibility: 'Farmers, Farmer Interest Groups (FIGs), and FPOs in Tamil Nadu transitioning to verified chemical-free organic farming practices.',
    benefits: 'Capital assistance for vermicompost units, bio-input production centres, residue testing reimbursement, and 100% free certification through Tamil Nadu Organic Certification Department (TNOCD).',
    application_info: 'Submit registration on the TNOCD portal (tnocd.net) or apply through the local Assistant Director of Agriculture (Quality Control) / Uzhavan App.',
    official_url: 'https://tnagrisnet.tn.gov.in',
    source: 'Government of Tamil Nadu - Agriculture & Farmers Welfare Department',
    government_level: 'state',
    state: 'Tamil Nadu',
    category: 'Organic/Natural Farming',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-25T00:00:00Z'
  },
  {
    id: 'sch15',
    name: 'Tamil Nadu Micro Irrigation Subsidy Scheme (TANHODA)',
    description: 'Specialized state micro-irrigation subsidy program delivering high-efficiency drip and sprinkler irrigation installations for agricultural and horticultural crops.',
    eligibility: 'All agricultural and horticultural landowning farmers in Tamil Nadu with an operable well or borewell irrigation source.',
    benefits: '100% full subsidy for Small and Marginal farmers (up to 5 acres / 2 hectares) and 75% subsidy for other farmers for complete drip/sprinkler system installation.',
    application_info: 'Register online at the TANHODA Micro Irrigation portal (tanhoda.tn.gov.in) with land revenue records (Patta, Chitta, FMB sketch, Adangal), water source certificate, and Aadhaar.',
    official_url: 'https://tanhoda.tn.gov.in',
    source: 'Government of Tamil Nadu - Department of Horticulture and Plantation Crops',
    government_level: 'state',
    state: 'Tamil Nadu',
    category: 'Irrigation',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-26T00:00:00Z'
  },
  {
    id: 'sch16',
    name: 'Free Electricity Supply Scheme for Agricultural Pumpsets',
    description: 'State utility initiative providing 100% free unmetered power supply to all energized agricultural pumpsets across rural Tamil Nadu.',
    eligibility: 'Farmers holding agricultural land with energized service connections for irrigation wells/borewells registered under agricultural tariff.',
    benefits: '100% free electric power for agricultural irrigation with zero recurring electricity bills, lowering cultivation operational expenses.',
    application_info: 'Apply for new agricultural service connection at the local TANGEDCO section office with land title documents, VAO well certificate, and sketch.',
    official_url: 'https://www.tangedco.gov.in',
    source: 'Government of Tamil Nadu - Energy Department & TANGEDCO',
    government_level: 'state',
    state: 'Tamil Nadu',
    category: 'Infrastructure',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-27T00:00:00Z'
  },
  {
    id: 'sch17',
    name: 'Uzhavar Santhai (Farmers Market) Direct Marketing Scheme',
    description: 'Direct farm-to-consumer marketing platform established across Tamil Nadu urban centers to eliminate intermediary brokerage and maximize farmers\' profit margins.',
    eligibility: 'Farmers cultivating vegetables, fruits, culinary herbs, and flowers within the designated supply radius of an Uzhavar Santhai.',
    benefits: 'Free retail stall space, free digital weighing scales, free cold storage facility, free public transit passes for farm produce transport, and 100% direct cash realization.',
    application_info: 'Obtain an Uzhavar Santhai Farmer Identity Card from your local Assistant Director of Agricultural Marketing (ADAM) / Agricultural Officer (Marketing).',
    official_url: 'https://tnagrimarketing.tn.gov.in',
    source: 'Government of Tamil Nadu - Department of Agricultural Marketing & Agri Business',
    government_level: 'state',
    state: 'Tamil Nadu',
    category: 'Marketing',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-28T00:00:00Z'
  },
  {
    id: 'sch18',
    name: 'Tamil Nadu Chief Minister\'s Solar Powered Pumpsets Scheme',
    description: 'State-sponsored green energy agriculture program installing standalone solar-powered pumpsets (5 HP to 10 HP) in off-grid farmlands.',
    eligibility: 'Farmers having an open well/borewell without an existing grid connection or farmers willing to surrender an existing thermal power connection in Tamil Nadu.',
    benefits: '70% capital subsidy (40% Tamil Nadu State Government Subsidy + 30% Central PM-KUSUM Subsidy) for turnkey installation of solar PV panels and high-efficiency submersible pump.',
    application_info: 'Apply through the Agricultural Engineering Department portal (aed.tn.gov.in) or submit application to the district Executive Engineer (Agricultural Engineering).',
    official_url: 'https://aed.tn.gov.in',
    source: 'Government of Tamil Nadu - Agricultural Engineering Department',
    government_level: 'state',
    state: 'Tamil Nadu',
    category: 'Machinery Subsidy',
    last_verified_at: '2026-08-24',
    created_at: '2026-03-29T00:00:00Z'
  }
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'u-farmer-1',
    name: 'Murugan Ramasamy',
    email: 'murugan.farmer@agrime.demo',
    phone: '+91 98451 23456',
    role: 'farmer',
    location: 'Katpadi, Vellore',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'u-dealer-1',
    name: 'K. Balasubramanian',
    email: 'bala.traders@agrime.demo',
    phone: '+91 94432 78901',
    role: 'dealer',
    location: 'Vellore Main Market',
    created_at: '2026-02-15T09:00:00Z'
  },
  {
    id: 'u-dealer-2',
    name: 'S. Anbarasan',
    email: 'greenvalley.dealers@agrime.demo',
    phone: '+91 97890 45612',
    role: 'dealer',
    location: 'Gandhi Nagar, Thiruvannamalai',
    created_at: '2026-02-20T11:30:00Z'
  },
  {
    id: 'u-provider-1',
    name: 'R. Velayudham',
    email: 'velan.machinery@agrime.demo',
    phone: '+91 98409 67890',
    role: 'machinery_provider',
    location: 'Anaicut, Vellore',
    created_at: '2026-02-10T08:30:00Z'
  }
];

export const MOCK_DEALERS: Dealer[] = [
  {
    id: 'd1',
    profile_id: 'u-dealer-1',
    shop_name: 'Sri Balaji Agro Crop Buyers & Traders',
    address: 'No. 42, Mandi Street, Old Town, Vellore, Tamil Nadu - 632004',
    phone: '+91 94432 78901',
    opening_hours: 'Mon - Sat: 7:00 AM - 7:30 PM (Sunday Closed)',
    created_at: '2026-02-15T09:00:00Z'
  },
  {
    id: 'd2',
    profile_id: 'u-dealer-2',
    shop_name: 'Green Valley Grain & Oilseed Merchants',
    address: 'Opp. APMC Complex, Arni Road, Thiruvannamalai - 606601',
    phone: '+91 97890 45612',
    opening_hours: 'Mon - Sun: 6:30 AM - 8:00 PM',
    created_at: '2026-02-20T11:30:00Z'
  },
  {
    id: 'd3',
    profile_id: 'u-dealer-1',
    shop_name: 'Vellore Cotton & Maize Procurement Center',
    address: 'Near Bye-pass Junction, Ranipet Road, Vellore - 632009',
    phone: '+91 98450 11223',
    opening_hours: 'Mon - Sat: 8:00 AM - 6:00 PM',
    created_at: '2026-03-01T10:00:00Z'
  }
];

export const MOCK_DEALER_CROP_PRICES: DealerCropPrice[] = [
  {
    id: 'dcp1',
    dealer_id: 'd1',
    crop_id: 'c1',
    buying_price: 3520,
    unit: '₹/Quintal',
    active: true,
    created_at: '2026-08-20T00:00:00Z',
    updated_at: '2026-08-24T06:00:00Z',
    crop: MOCK_CROPS[0],
    dealer: MOCK_DEALERS[0]
  },
  {
    id: 'dcp2',
    dealer_id: 'd1',
    crop_id: 'c2',
    buying_price: 2420,
    unit: '₹/Quintal',
    active: true,
    created_at: '2026-08-20T00:00:00Z',
    updated_at: '2026-08-24T06:00:00Z',
    crop: MOCK_CROPS[1],
    dealer: MOCK_DEALERS[0]
  },
  {
    id: 'dcp3',
    dealer_id: 'd2',
    crop_id: 'c3',
    buying_price: 6950,
    unit: '₹/Quintal',
    active: true,
    created_at: '2026-08-22T00:00:00Z',
    updated_at: '2026-08-24T07:00:00Z',
    crop: MOCK_CROPS[2],
    dealer: MOCK_DEALERS[1]
  },
  {
    id: 'dcp4',
    dealer_id: 'd2',
    crop_id: 'c4',
    buying_price: 2200,
    unit: '₹/Quintal',
    active: true,
    created_at: '2026-08-22T00:00:00Z',
    updated_at: '2026-08-24T07:00:00Z',
    crop: MOCK_CROPS[3],
    dealer: MOCK_DEALERS[1]
  },
  {
    id: 'dcp5',
    dealer_id: 'd3',
    crop_id: 'c5',
    buying_price: 7550,
    unit: '₹/Quintal',
    active: true,
    created_at: '2026-08-23T00:00:00Z',
    updated_at: '2026-08-24T08:00:00Z',
    crop: MOCK_CROPS[4],
    dealer: MOCK_DEALERS[2]
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    dealer_id: 'd1',
    name: 'Certified Paddy Seeds (BPT 5204 Samba Masuri)',
    category: 'Seeds',
    description: 'High germination rate (98%), pest-resistant certified seed bag (25 kg). Ideal for Kharif & Rabi seasons.',
    price: 1150,
    stock: 45,
    image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-24T00:00:00Z',
    dealer: MOCK_DEALERS[0]
  },
  {
    id: 'p2',
    dealer_id: 'd1',
    name: 'Organic Neem Oil Bio-Pesticide (1 Litre)',
    category: 'Pesticides',
    description: '100% cold-pressed pure neem oil with 10,000 ppm azadirachtin. Effective against leaf folders and sucking pests.',
    price: 420,
    stock: 80,
    image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    created_at: '2026-08-05T00:00:00Z',
    updated_at: '2026-08-24T00:00:00Z',
    dealer: MOCK_DEALERS[0]
  },
  {
    id: 'p3',
    dealer_id: 'd2',
    name: 'NPK 19:19:19 Water Soluble Fertilizer (1 kg)',
    category: 'Fertilizers',
    description: 'Balanced nutrient booster for vegetative growth and root strengthening for paddy, groundnut, and vegetables.',
    price: 210,
    stock: 120,
    image_url: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80',
    created_at: '2026-08-10T00:00:00Z',
    updated_at: '2026-08-24T00:00:00Z',
    dealer: MOCK_DEALERS[1]
  },
  {
    id: 'p4',
    dealer_id: 'd2',
    name: 'Battery Operated 16L Knapsack Sprayer',
    category: 'Equipment',
    description: 'Heavy duty 12V 12Ah lithium battery with adjustable brass nozzle and comfortable back padding.',
    price: 2850,
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80',
    created_at: '2026-08-12T00:00:00Z',
    updated_at: '2026-08-24T00:00:00Z',
    dealer: MOCK_DEALERS[1]
  }
];

export const MOCK_MACHINERY: Machinery[] = [
  {
    id: 'mch1',
    provider_id: 'u-provider-1',
    name: 'Mahindra 575 DI 45HP Tractor with Rotavator',
    type: 'Tractor',
    description: 'Powerful 4-cylinder diesel tractor equipped with heavy 42-blade rotavator for complete wet and dry field plowing.',
    price_per_hour: 750,
    location: 'Katpadi / Vellore',
    available: true,
    image_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-24T00:00:00Z',
    provider: MOCK_PROFILES[3]
  },
  {
    id: 'mch2',
    provider_id: 'u-provider-1',
    name: 'Kubota DC-68G Track-Type Paddy Combine Harvester',
    type: 'Paddy Harvester',
    description: 'High efficiency crawler harvester capable of harvesting, threshing, and cleaning paddy in marshy or wet soil conditions.',
    price_per_hour: 2200,
    location: 'Anaicut, Vellore',
    available: true,
    image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-08-05T00:00:00Z',
    updated_at: '2026-08-24T00:00:00Z',
    provider: MOCK_PROFILES[3]
  },
  {
    id: 'mch3',
    provider_id: 'u-provider-1',
    name: 'VST Shakti 130 DI Power Tiller (13 HP)',
    type: 'Power Tiller',
    description: 'Versatile compact power tiller ideal for small field preparation, bund forming, and inter-crop de-weeding.',
    price_per_hour: 450,
    location: 'Gudiyatham, Vellore',
    available: true,
    image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-08-10T00:00:00Z',
    updated_at: '2026-08-24T00:00:00Z',
    provider: MOCK_PROFILES[3]
  },
  {
    id: 'mch4',
    provider_id: 'u-provider-1',
    name: 'John Deere 5050 D (50 HP) Heavy Cultivator',
    type: 'Tractor',
    description: 'Equipped with 9-tyne rigid cultivator and disc harrow for deep soil breaking and aeration before sowing.',
    price_per_hour: 850,
    location: 'Vellore Rural',
    available: false,
    image_url: 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-08-12T00:00:00Z',
    updated_at: '2026-08-24T00:00:00Z',
    provider: MOCK_PROFILES[3]
  }
];

export const MOCK_BOOKINGS: MachineryBooking[] = [
  {
    id: 'bk1',
    farmer_id: 'u-farmer-1',
    machinery_id: 'mch1',
    booking_date: '2026-08-26',
    start_time: '08:00',
    end_time: '12:00',
    status: 'accepted',
    total_amount: 3000,
    created_at: '2026-08-23T14:30:00Z',
    updated_at: '2026-08-23T16:00:00Z',
    farmer: MOCK_PROFILES[0],
    machinery: MOCK_MACHINERY[0]
  },
  {
    id: 'bk2',
    farmer_id: 'u-farmer-1',
    machinery_id: 'mch2',
    booking_date: '2026-08-28',
    start_time: '07:00',
    end_time: '10:00',
    status: 'pending',
    total_amount: 6600,
    created_at: '2026-08-24T09:00:00Z',
    updated_at: '2026-08-24T09:00:00Z',
    farmer: MOCK_PROFILES[0],
    machinery: MOCK_MACHINERY[1]
  }
];
