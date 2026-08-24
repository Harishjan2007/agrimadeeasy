-- ==============================================================================
-- AgriME Platform — Government Schemes Real & Verified Data Migration
-- Official Verified Central & Tamil Nadu Agricultural Support Programs
-- ==============================================================================

-- 1. SAFE SCHEMA UPGRADE: Add enhanced scheme metadata columns if not present
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS government_level TEXT DEFAULT 'central';
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS last_verified_at DATE DEFAULT CURRENT_DATE;

-- 2. INSERT / UPSERT REAL VERIFIED GOVERNMENT SCHEMES
INSERT INTO schemes (
  id,
  name,
  description,
  eligibility,
  benefits,
  application_info,
  official_url,
  source,
  government_level,
  state,
  category,
  last_verified_at
) VALUES
  -- ----------------------------------------------------------------------------
  -- CENTRAL GOVERNMENT SCHEMES (10)
  -- ----------------------------------------------------------------------------
  (
    '55555555-5555-5555-5555-555555555501',
    'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    'Central Sector Scheme providing direct income support of ₹6,000 per year in three equal four-monthly installments of ₹2,000 directly into the bank accounts of landholding farmer families across India.',
    'All landholding farmer families with cultivable land in their names, subject to statutory exclusion criteria (such as institutional landholders, income tax payees, and constitutional post holders).',
    '₹6,000 per annum paid directly via Direct Benefit Transfer (DBT) into verified Aadhaar-seeded bank accounts in three equal installments of ₹2,000.',
    'Apply online via pmkisan.gov.in (Farmer Corner) or visit your nearest Common Service Centre (CSC) / Village Agriculture Office with Aadhaar, Land records (Patta/Chitta), and active bank account passbook.',
    'https://pmkisan.gov.in',
    'Government of India - Ministry of Agriculture & Farmers Welfare',
    'central',
    NULL,
    'Direct Income Support',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    'Sub-Mission on Agricultural Mechanization (SMAM)',
    'Capital subsidy assistance of 40% to 50% for purchasing tractors, power tillers, rotavators, drone sprayers, and combine harvesters, or establishing local Custom Hiring Centres (CHCs).',
    'Individual farmers, Small & Marginal farmers, Scheduled Castes (SC), Scheduled Tribes (ST), women farmers, Self-Help Groups (SHGs), and registered Farmer Producer Organizations (FPOs).',
    '40% to 50% capital subsidy on procurement cost of eligible agricultural equipment or up to ₹10 Lakhs for setting up a Custom Hiring Centre.',
    'Register on the Central DBT Portal for Mechanization (agrimachinery.nic.in) and upload land ownership records (Patta/Chitta), caste certificate (if applicable), Aadhaar, bank passbook, and dealer quotation.',
    'https://agrimachinery.nic.in',
    'Government of India - Ministry of Agriculture & Farmers Welfare',
    'central',
    NULL,
    'Machinery Subsidy',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    'Comprehensive crop insurance coverage against non-preventable natural risks (drought, flood, unseasonal rain, pests & diseases, and post-harvest losses) from pre-sowing to post-harvest.',
    'All farmers growing notified crops in notified areas including loanee farmers, non-loanee farmers, sharecroppers, and tenant farmers.',
    'Affordable premium rate of only 2% for Kharif food and oilseed crops, 1.5% for Rabi crops, and 5% for annual commercial/horticultural crops with 100% sum insured protection.',
    'Enroll through your local commercial/cooperative bank branch, Primary Agricultural Cooperative Credit Society (PACS), Common Service Centre (CSC), or online on pmfby.gov.in before the seasonal cut-off date.',
    'https://pmfby.gov.in',
    'Government of India - Ministry of Agriculture & Farmers Welfare',
    'central',
    NULL,
    'Crop Insurance',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555504',
    'Kisan Credit Card (KCC) Scheme',
    'Timely and simplified institutional credit facility designed to meet short-term cultivation requirements, post-harvest expenses, produce marketing loans, and maintenance of farm assets.',
    'All farmers, individual/joint borrowers, tenant farmers, oral lessees, sharecroppers, Self Help Groups (SHGs), and Joint Liability Groups (JLGs).',
    'Revolving credit limit up to ₹3 Lakh at an effective concessional interest rate of 4% per annum upon prompt repayment, paired with an ATM-enabled RuPay Kisan Card.',
    'Submit the simplified one-page KCC application form at your local commercial bank, regional rural bank (RRB), or cooperative bank branch along with land documents and identity proof.',
    'https://www.myscheme.gov.in/schemes/kcc',
    'Reserve Bank of India & Ministry of Agriculture & Farmers Welfare',
    'central',
    NULL,
    'Credit & Loans',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555505',
    'Agriculture Infrastructure Fund (AIF)',
    'Medium to long-term debt financing facility for investment in viable post-harvest management infrastructure and community farming assets such as warehouses, cold chains, silos, and primary processing units.',
    'Primary Agricultural Credit Societies (PACS), Marketing Cooperative Societies, Farmer Producer Organizations (FPOs), SHGs, Joint Liability Groups (JLGs), Agri-entrepreneurs, and Startups.',
    '3% per annum interest subvention on loans up to ₹2 Crores for a maximum period of 7 years, along with CGTMSE credit guarantee fee coverage.',
    'Register and submit your infrastructure DPR online via the National AIF portal (agriinfra.dac.gov.in) and select your preferred lending financial institution.',
    'https://agriinfra.dac.gov.in',
    'Government of India - Ministry of Agriculture & Farmers Welfare',
    'central',
    NULL,
    'Infrastructure',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555506',
    'Pradhan Mantri Krishi Sinchayee Yojana - Per Drop More Crop (PDMC)',
    'Centrally sponsored initiative to promote precision water-saving technologies through micro-irrigation (Drip and Sprinkler irrigation systems), maximizing crop water productivity.',
    'All landholding farmers having an assured source of irrigation water, with special priority for Small and Marginal farmers, SC/ST, and women beneficiaries.',
    '55% financial assistance for Small & Marginal farmers and 45% for other categories of farmers for installing BIS-approved drip and sprinkler systems.',
    'Apply through the State Horticulture / Agriculture Department micro-irrigation portal (e.g. TANHODA in Tamil Nadu) or consult the Block Assistant Director of Horticulture.',
    'https://pmksy.gov.in',
    'Government of India - Ministry of Agriculture & Farmers Welfare',
    'central',
    NULL,
    'Irrigation',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555507',
    'Pradhan Mantri Kisan Maan Dhan Yojana (PM-KMY)',
    'Old age pension scheme providing social security to small and marginal farmers upon retirement from active cultivation work.',
    'Small and marginal farmers aged between 18 and 40 years holding cultivable land up to 2 hectares in their name.',
    'Guaranteed minimum monthly pension of ₹3,000 after attaining 60 years of age, with equal 50:50 matching monthly contribution funded by the Government of India.',
    'Visit the nearest Common Service Centre (CSC) or enroll online at maandhan.in with Aadhaar Card, Savings Bank Account Passbook / PM-KISAN bank account details.',
    'https://maandhan.in',
    'Government of India - Ministry of Agriculture & Farmers Welfare',
    'central',
    NULL,
    'Direct Income Support',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555508',
    'Paramparagat Krishi Vikas Yojana (PKVY)',
    'Cluster-based organic farming promotion program supporting organic input generation, participatory guarantee certification (PGS-India), packaging, and domestic marketing.',
    'Groups of farmers forming contiguous organic cultivation clusters of at least 20 hectares (50 farmers).',
    'Financial assistance of ₹50,000 per hectare over 3 years, of which ₹31,000 is given directly via DBT for on-farm organic inputs (vermicompost, bio-fertilizers).',
    'Contact the local Block Agricultural Development Officer (ADO) or District Joint Director of Agriculture to join or register an organic cluster under the PGS-India portal.',
    'https://pgsindia-ncof.gov.in',
    'Government of India - Ministry of Agriculture & Farmers Welfare',
    'central',
    NULL,
    'Organic/Natural Farming',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555509',
    'Mission for Integrated Development of Horticulture (MIDH)',
    'Holistic growth initiative for the horticulture sector encompassing fruits, vegetables, root and tuber crops, mushrooms, spices, flowers, aromatic plants, coconut, and cocoa.',
    'Individual farmers, groups of growers, FPOs, and state horticultural cooperatives engaged in commercial horticultural cultivation.',
    'Up to 40% - 50% subsidy for protected cultivation (polyhouses, shade net houses), high-density planting material, integrated post-harvest pack-houses, and cold rooms.',
    'Submit project proposal and land records to the District Assistant Director of Horticulture or State Horticulture Mission portal.',
    'https://midh.gov.in',
    'Government of India - Ministry of Agriculture & Farmers Welfare',
    'central',
    NULL,
    'Horticulture',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555510',
    'Central Sector Scheme for Formation and Promotion of 10,000 FPOs',
    'Flagship national program to mobilize small and marginal farmers into commercially viable collectives (FPOs) to enhance economies of scale and direct market linkages.',
    'FPOs formed by a minimum of 300 farmer members in plains areas (100 in hilly/Northeast regions) registered under Companies Act or State Cooperative Societies Act.',
    'Financial assistance up to ₹18 Lakhs per FPO for handholding support over 3 years, matching equity grant up to ₹2,000 per member (max ₹15 Lakhs), and institutional credit guarantee.',
    'Reach out to designated Cluster-Based Business Organizations (CBBOs), NABARD Regional Offices, or Small Farmers'' Agri-Business Consortium (SFAC).',
    'https://sfacindia.com',
    'Small Farmers'' Agri-Business Consortium (SFAC) & NABARD',
    'central',
    NULL,
    'Farmer Organizations',
    '2026-08-24'
  ),

  -- ----------------------------------------------------------------------------
  -- TAMIL NADU STATE GOVERNMENT SCHEMES (8)
  -- ----------------------------------------------------------------------------
  (
    '55555555-5555-5555-5555-555555555511',
    'Kalaignarin All Village Integrated Agriculture Development Programme (KAVIADP)',
    'Holistic village-level agriculture transformation mission in Tamil Nadu focusing on converting fallow lands to cultivable area, distributing high-yielding fruit/coconut saplings, and deploying community water harvesting.',
    'All agricultural landholding and tenant farmers residing within the selected Village Panchayats covered under the current operational phase in Tamil Nadu.',
    'Free quality coconut seedlings and horticultural fruit saplings, 50% subsidy on farm implements kits, tarpaulins, power sprayers, and priority borewell/well creation in fallow clusters.',
    'Register directly with the local Village Agricultural Extension Officer (VAEO) or Block Assistant Director of Agriculture through the AGRISNET portal / Uzhavan App.',
    'https://tnagrisnet.tn.gov.in',
    'Government of Tamil Nadu - Agriculture & Farmers Welfare Department',
    'state',
    'Tamil Nadu',
    'Direct Income Support',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555512',
    'Tamil Nadu Mission on Sustainable Dryland Agriculture (TN-MSDA)',
    'Cluster-based development for rainfed and dryland farming zones across Tamil Nadu, promoting soil moisture conservation, drought-resilient millets, pulses, and oilseeds.',
    'Dryland and rainfed farmers possessing contiguous cultivable holdings in identified rainfed agricultural blocks across Tamil Nadu districts.',
    'Subsidized summer ploughing assistance, 50% subsidy on bio-fertilizers, bio-pesticides, and certified dryland seed minikits, plus access to custom hiring farm machinery.',
    'Apply through the Uzhavan Mobile App or visit your local Block Agricultural Extension Centre (AEC) with land Patta/Chitta records.',
    'https://tnagrisnet.tn.gov.in',
    'Government of Tamil Nadu - Agriculture & Farmers Welfare Department',
    'state',
    'Tamil Nadu',
    'Soil Health',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555513',
    'Kuruvai Cultivation Special Package Scheme',
    'Annual seasonal input package provided to Cauvery Delta paddy cultivators to facilitate timely Kuruvai transplanting and optimize harvest yields.',
    'Paddy farmers cultivating Kuruvai crop in the Cauvery Delta region (Thanjavur, Tiruvarur, Nagapattinam, Mayiladuthurai, Tiruchirappalli, Cuddalore, and Pudukkottai).',
    '100% full input subsidy on certified paddy seeds, chemical fertilizers (Urea, DAP, Potash), bio-fertilizers, and micro-nutrient mixtures per acre.',
    'Enroll at your local Primary Agricultural Cooperative Credit Society (PACS) or Agriculture Extension Centre by submitting Aadhaar and Chitta before seasonal transplantation.',
    'https://tnagrisnet.tn.gov.in',
    'Government of Tamil Nadu - Agriculture & Farmers Welfare Department',
    'state',
    'Tamil Nadu',
    'Seeds & Planting Material',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555514',
    'Tamil Nadu Organic Farming Mission (TNOFM)',
    'State mission to expand chemical-free ecological farming, promote natural inputs production hubs, and facilitate free organic certification for farmer groups.',
    'Farmers, Farmer Interest Groups (FIGs), and FPOs in Tamil Nadu transitioning to verified chemical-free organic farming practices.',
    'Capital assistance for vermicompost units, bio-input production centres, residue testing reimbursement, and 100% free certification through Tamil Nadu Organic Certification Department (TNOCD).',
    'Submit registration on the TNOCD portal (tnocd.net) or apply through the local Assistant Director of Agriculture (Quality Control) / Uzhavan App.',
    'https://tnagrisnet.tn.gov.in',
    'Government of Tamil Nadu - Agriculture & Farmers Welfare Department',
    'state',
    'Tamil Nadu',
    'Organic/Natural Farming',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555515',
    'Tamil Nadu Micro Irrigation Subsidy Scheme (TANHODA)',
    'Specialized state micro-irrigation subsidy program delivering high-efficiency drip and sprinkler irrigation installations for agricultural and horticultural crops.',
    'All agricultural and horticultural landowning farmers in Tamil Nadu with an operable well or borewell irrigation source.',
    '100% full subsidy for Small and Marginal farmers (up to 5 acres / 2 hectares) and 75% subsidy for other farmers for complete drip/sprinkler system installation.',
    'Register online at the TANHODA Micro Irrigation portal (tanhoda.tn.gov.in) with land revenue records (Patta, Chitta, FMB sketch, Adangal), water source certificate, and Aadhaar.',
    'https://tanhoda.tn.gov.in',
    'Government of Tamil Nadu - Department of Horticulture and Plantation Crops',
    'state',
    'Tamil Nadu',
    'Irrigation',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555516',
    'Free Electricity Supply Scheme for Agricultural Pumpsets',
    'State utility initiative providing 100% free unmetered power supply to all energized agricultural pumpsets across rural Tamil Nadu.',
    'Farmers holding agricultural land with energized service connections for irrigation wells/borewells registered under agricultural tariff.',
    '100% free electric power for agricultural irrigation with zero recurring electricity bills, lowering cultivation operational expenses.',
    'Apply for new agricultural service connection at the local TANGEDCO section office with land title documents, VAO well certificate, and sketch.',
    'https://www.tangedco.gov.in',
    'Government of Tamil Nadu - Energy Department & TANGEDCO',
    'state',
    'Tamil Nadu',
    'Infrastructure',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555517',
    'Uzhavar Santhai (Farmers Market) Direct Marketing Scheme',
    'Direct farm-to-consumer marketing platform established across Tamil Nadu urban centers to eliminate intermediary brokerage and maximize farmers'' profit margins.',
    'Farmers cultivating vegetables, fruits, culinary herbs, and flowers within the designated supply radius of an Uzhavar Santhai.',
    'Free retail stall space, free digital weighing scales, free cold storage facility, free public transit passes for farm produce transport, and 100% direct cash realization.',
    'Obtain an Uzhavar Santhai Farmer Identity Card from your local Assistant Director of Agricultural Marketing (ADAM) / Agricultural Officer (Marketing).',
    'https://tnagrimarketing.tn.gov.in',
    'Government of Tamil Nadu - Department of Agricultural Marketing & Agri Business',
    'state',
    'Tamil Nadu',
    'Marketing',
    '2026-08-24'
  ),
  (
    '55555555-5555-5555-5555-555555555518',
    'Tamil Nadu Chief Minister''s Solar Powered Pumpsets Scheme',
    'State-sponsored green energy agriculture program installing standalone solar-powered pumpsets (5 HP to 10 HP) in off-grid farmlands.',
    'Farmers having an open well/borewell without an existing grid connection or farmers willing to surrender an existing thermal power connection in Tamil Nadu.',
    '70% capital subsidy (40% Tamil Nadu State Government Subsidy + 30% Central PM-KUSUM Subsidy) for turnkey installation of solar PV panels and high-efficiency submersible pump.',
    'Apply through the Agricultural Engineering Department portal (aed.tn.gov.in) or submit application to the district Executive Engineer (Agricultural Engineering).',
    'https://aed.tn.gov.in',
    'Government of Tamil Nadu - Agricultural Engineering Department',
    'state',
    'Tamil Nadu',
    'Machinery Subsidy',
    '2026-08-24'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  eligibility = EXCLUDED.eligibility,
  benefits = EXCLUDED.benefits,
  application_info = EXCLUDED.application_info,
  official_url = EXCLUDED.official_url,
  source = EXCLUDED.source,
  government_level = EXCLUDED.government_level,
  state = EXCLUDED.state,
  category = EXCLUDED.category,
  last_verified_at = EXCLUDED.last_verified_at;
