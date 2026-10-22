import { GovernmentScheme } from '@/types';

/**
 * Normalizes strings by lowercasing, trimming, removing redundant punctuation.
 */
export function normalizeSchemeText(text: string | null | undefined): string {
  if (!text) return '';
  return text.toLowerCase().trim();
}

/**
 * Validates state availability.
 * Central government schemes are Pan-India and applicable to Tamil Nadu farmers.
 * State government schemes must match Tamil Nadu.
 */
export function checkStateMatch(
  stateAnswer: string,
  scheme: GovernmentScheme
): boolean {
  if (stateAnswer === 'All' || !stateAnswer) return true;
  if (stateAnswer === 'Central Only') {
    return scheme.government_level === 'central';
  }
  if (stateAnswer === 'Tamil Nadu') {
    // Both Central schemes and Tamil Nadu state schemes are applicable in TN
    return (
      scheme.government_level === 'central' ||
      scheme.government_level === 'state' ||
      (scheme.state || '').toLowerCase().includes('tamil') ||
      (scheme.state || '').toLowerCase().includes('all')
    );
  }
  return true;
}

/**
 * Validates district availability.
 * Central schemes and statewide schemes are available across all districts in Tamil Nadu.
 */
export function checkDistrictMatch(
  selectedDistrict: string,
  scheme: GovernmentScheme
): boolean {
  if (selectedDistrict === 'All' || selectedDistrict === 'all' || !selectedDistrict) {
    return true;
  }

  // Central schemes apply across all districts in Tamil Nadu
  if (scheme.government_level === 'central') {
    return true;
  }

  const districts = scheme.districts || [];
  if (districts.length === 0) {
    return true; // No explicit restriction = statewide
  }

  const distLower = selectedDistrict.toLowerCase();
  return districts.some((d) => {
    const dLower = d.toLowerCase();
    return (
      dLower.includes('all') ||
      dLower.includes('statewide') ||
      dLower === distLower ||
      dLower.includes(distLower) ||
      distLower.includes(dLower)
    );
  });
}

/**
 * Checks crop and farming-activity match using keyword mappings and synonyms (English + Tamil).
 */
export function checkCropMatch(
  selectedCrop: string,
  scheme: GovernmentScheme
): boolean {
  if (selectedCrop === 'All' || selectedCrop === 'all' || !selectedCrop) {
    return true;
  }

  const supportedCrops = (scheme.supported_crops || []).map((c) => c.toLowerCase());
  const text = `${scheme.name || ''} ${scheme.description || ''} ${scheme.eligibility || ''} ${scheme.category || ''} ${scheme.support_type || ''}`.toLowerCase();

  // If the scheme covers all crops or general agriculture, it's open to this crop
  if (
    supportedCrops.length === 0 ||
    supportedCrops.some((c) =>
      c.includes('all') ||
      c.includes('general agriculture') ||
      c.includes('any crop') ||
      c.includes('all crops & activities')
    )
  ) {
    return true;
  }

  const cropKey = selectedCrop.toLowerCase();

  // Keyword dictionary mapping crop categories to search tokens
  const cropKeywords: Record<string, string[]> = {
    paddy: ['paddy', 'rice', 'cereal', 'kuruvai', 'samba', 'kodai', 'grain', 'basmati', 'sona masuri', 'நெல்', 'தானியம்'],
    cereal: ['paddy', 'rice', 'cereal', 'wheat', 'maize', 'corn', 'barley', 'grain', 'தானியம்'],
    millet: ['millet', 'ragi', 'bajra', 'jowar', 'sorghum', 'kuthiraivali', 'samai', 'varagu', 'thinai', 'கேழ்வரகு', 'கம்பு', 'திணை'],
    pulse: ['pulse', 'gram', 'urad', 'moong', 'tur', 'toor', 'dal', 'redgram', 'blackgram', 'greengram', 'bengal gram', 'பருப்பு'],
    oilseed: ['oilseed', 'groundnut', 'peanut', 'sesame', 'gingelly', 'sunflower', 'castor', 'mustard', 'soybean', 'எண்ணெய்'],
    vegetable: ['vegetable', 'tomato', 'onion', 'chilli', 'brinjal', 'potato', 'okra', 'bhendi', 'tapioca', 'gourd', 'காய்கறி', 'தக்காளி', 'வெங்காயம்'],
    horticulture: ['horticulture', 'fruit', 'vegetable', 'plantation', 'spices', 'flower', 'mango', 'banana', 'guava', 'citrus', 'தோட்டக்கலை', 'பழங்கள்'],
    fruit: ['fruit', 'mango', 'banana', 'guava', 'papaya', 'citrus', 'sapota', 'pomegranate', 'jackfruit', 'பழங்கள்'],
    coconut: ['coconut', 'arecanut', 'palm', 'plantation', 'தென்னை'],
    cotton: ['cotton', 'fiber', 'பருத்தி'],
    sugarcane: ['sugarcane', 'cane', 'sugar', 'கரும்பு'],
    commercial: ['cotton', 'sugarcane', 'tobacco', 'plantation', 'commercial', 'வணிக'],
    organic: ['organic', 'natural farming', 'sustainable', 'bio-fertilizer', 'vermicompost', 'paramparagat', 'இயற்கை'],
    dairy: ['dairy', 'livestock', 'cattle', 'cow', 'buffalo', 'milk', 'fodder', 'கால்நடை', 'பால்'],
    livestock: ['livestock', 'dairy', 'animal husbandry', 'cattle', 'cow', 'buffalo', 'goat', 'sheep', 'கால்நடை', 'ஆடு', 'மாடு'],
    poultry: ['poultry', 'chicken', 'broiler', 'layer', 'egg', 'backyard poultry', 'கோழி'],
    fisheries: ['fisheries', 'aquaculture', 'fish', 'prawn', 'shrimp', 'pond', 'marine', 'inland fisheries', 'மீன்']
  };

  const applicableKeywords: string[] = [];
  for (const [key, words] of Object.entries(cropKeywords)) {
    if (cropKey.includes(key)) {
      applicableKeywords.push(...words);
    }
  }

  if (applicableKeywords.length === 0) {
    applicableKeywords.push(cropKey);
  }

  return applicableKeywords.some((kw) =>
    supportedCrops.some((c) => c.includes(kw)) || text.includes(kw)
  );
}

/**
 * Checks support-type match with keyword taxonomy.
 */
export function checkSupportMatch(
  selectedSupport: string,
  scheme: GovernmentScheme
): boolean {
  if (selectedSupport === 'All' || selectedSupport === 'all' || !selectedSupport) {
    return true;
  }

  const text = `${scheme.support_type || ''} ${scheme.category || ''} ${scheme.benefits || ''} ${scheme.description || ''} ${scheme.name || ''} ${scheme.benefit_type || ''}`.toLowerCase();
  const supKey = selectedSupport.toLowerCase();

  const supportKeywords: Record<string, string[]> = {
    machinery: ['machinery', 'equipment', 'tractor', 'mechaniz', 'custom hiring', 'power tiller', 'rotavator', 'harvester', 'drone', 'implement', 'sprayer', 'solar pump', 'smam'],
    equipment: ['machinery', 'equipment', 'tractor', 'mechaniz', 'custom hiring', 'implement', 'sprayer', 'drone', 'solar pump'],
    income: ['income support', 'financial assistance', 'dbt', 'cash', 'direct benefit', 'pm-kisan', 'pension', 'assistance', 'relief', 'grant'],
    financial: ['financial assistance', 'income support', 'subsidy', 'grant', 'dbt', 'cash', 'pm-kisan', 'assistance'],
    seed: ['seed', 'planting material', 'seedling', 'bio-fertilizer', 'nursery', 'certified seed'],
    fertilizer: ['fertilizer', 'soil', 'soil health', 'compost', 'gypsum', 'micronutrient', 'organic input', 'silt'],
    irrigation: ['irrigation', 'water', 'drip', 'sprinkler', 'micro irrigation', 'solar pump', 'well', 'borewell', 'farm pond', 'aed'],
    insurance: ['insurance', 'pmfby', 'fasal bima', 'risk', 'disaster', 'calamity', 'damage', 'relief', 'crop loss'],
    disaster: ['disaster', 'insurance', 'calamity', 'drought', 'flood', 'relief', 'compensation', 'pmfby'],
    loan: ['loan', 'credit', 'kcc', 'kisan credit', 'interest subvention', 'working capital', 'short-term loan', 'bank'],
    credit: ['credit', 'loan', 'kcc', 'kisan credit', 'interest subvention', 'bank', 'capital'],
    horticulture: ['horticulture', 'polyhouse', 'greenhouse', 'shade net', 'packhouse', 'cold storage', 'plantation', 'orchard', 'nursery', 'tanhoda'],
    livestock: ['livestock', 'dairy', 'animal husbandry', 'cattle', 'cow', 'buffalo', 'goat', 'sheep', 'fodder'],
    dairy: ['dairy', 'milk', 'cattle', 'livestock', 'animal husbandry', 'fodder'],
    fisheries: ['fisheries', 'aquaculture', 'fish', 'prawn', 'shrimp', 'marine', 'pond'],
    storage: ['storage', 'godown', 'warehouse', 'processing', 'cold chain', 'packhouse', 'value addition', 'silos'],
    marketing: ['marketing', 'market', 'uzhavar santhai', 'enam', 'direct marketing', 'mandi', 'traders'],
    group: ['fpo', 'fpc', 'group', 'cooperative', 'collective', 'shg', 'fig'],
    cooperative: ['cooperative', 'fpo', 'fpc', 'group', 'collective', 'society'],
    training: ['training', 'capacity building', 'demonstration', 'exposure', 'extension', 'skill', 'advisory']
  };

  const applicableKeywords: string[] = [];
  for (const [key, words] of Object.entries(supportKeywords)) {
    if (supKey.includes(key)) {
      applicableKeywords.push(...words);
    }
  }

  if (applicableKeywords.length === 0) {
    applicableKeywords.push(supKey);
  }

  return applicableKeywords.some((kw) => text.includes(kw));
}

/**
 * Checks landholding criteria across all option formats (below_1, 1_to_2, 2_to_5, above_5, landless, tenant).
 */
export function checkLandholdingMatch(
  selectedLandholding: string,
  scheme: GovernmentScheme
): boolean {
  if (selectedLandholding === 'All' || selectedLandholding === 'all' || !selectedLandholding) {
    return true;
  }

  const elig = (scheme.eligibility || '').toLowerCase();
  const criteria = (scheme.landholding_criteria || '').toLowerCase();
  const category = (scheme.category || '').toLowerCase();
  const name = (scheme.name || '').toLowerCase();

  const val = selectedLandholding.toLowerCase();

  if (val === 'landless' || val === 'tenant') {
    // Tenant farmer / Landless cultivator / Sharecropper
    return (
      elig.includes('tenant') ||
      elig.includes('sharecropper') ||
      elig.includes('oral lessee') ||
      elig.includes('landless') ||
      criteria.includes('tenant') ||
      criteria.includes('landless') ||
      criteria.includes('no land ownership') ||
      criteria.includes('any land') ||
      (scheme.min_land_acres !== undefined && scheme.min_land_acres <= 0) ||
      category.includes('marketing') ||
      category.includes('training') ||
      category.includes('animal husbandry') ||
      category.includes('fisheries') ||
      name.includes('uzhavar santhai') ||
      name.includes('maan dhan') ||
      name.includes('fpo')
    );
  }

  if (val === 'below_1' || val === 'below_1_acre' || val === 'marginal') {
    // Marginal farmer (< 1 acre or < 2.5 acres)
    const excludesMarginal = elig.includes('minimum of 20 hectares') || elig.includes('minimum 20 ha');
    return !excludesMarginal;
  }

  if (val === '1_to_2' || val === '1_to_2_acres' || val === 'small') {
    // Small farmer (1 - 2 acres / 2.5 - 5 acres)
    const excludesSmall = elig.includes('minimum of 20 hectares') || elig.includes('minimum 20 ha');
    return !excludesSmall;
  }

  if (val === '2_to_5' || val === '2_to_5_acres') {
    // Semi-medium (2 - 5 acres)
    const strictlySmallMarginalOnly =
      (elig.includes('up to 2 hectares only') || criteria.includes('up to 2 hectares')) &&
      name.includes('maan dhan');
    return !strictlySmallMarginalOnly;
  }

  if (val === 'above_5' || val === 'above_5_acres') {
    // Large farmers (> 5 acres)
    const isCappedAtSmall =
      ((elig.includes('up to 2 hectares') || criteria.includes('up to 2 hectares')) && name.includes('maan dhan')) ||
      criteria.includes('marginal and small farmers only');
    return !isCappedAtSmall;
  }

  return true;
}
