'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Layers, 
  Sprout, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  RotateCcw, 
  Landmark, 
  Building2, 
  Gift,
  Users
} from 'lucide-react';
import { GovernmentScheme } from '@/types';
import { useLanguage } from '@/i18n';

interface SchemeFinderProps {
  schemes: GovernmentScheme[];
  loading?: boolean;
  onSelectSchemeForDetails: (scheme: GovernmentScheme) => void;
}

interface MatchedSchemeResult {
  scheme: GovernmentScheme;
  matchReasons: string[];
  requiresVerification: boolean;
  verificationHint: string;
}

export default function SchemeFinder({
  schemes,
  loading = false,
  onSelectSchemeForDetails
}: SchemeFinderProps) {
  const { language, translations, translateCategory } = useLanguage();
  const isTa = language === 'ta';
  const t = translations.schemes;

  // Criteria State
  const [selectedState, setSelectedState] = useState<'all' | 'Tamil Nadu' | 'other'>('Tamil Nadu');
  const [selectedLandSize, setSelectedLandSize] = useState<'all' | 'marginal' | 'small' | 'medium_large' | 'tenant'>('all');
  const [selectedCrop, setSelectedCrop] = useState<'all' | 'cereals' | 'horticulture' | 'oilseeds_pulses' | 'organic'>('all');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all');

  // Reset criteria handler
  const handleReset = () => {
    setSelectedState('Tamil Nadu');
    setSelectedLandSize('all');
    setSelectedCrop('all');
    setSelectedPurpose('all');
  };

  // Honest Rule-Based Matching
  const matchedResults = useMemo<MatchedSchemeResult[]>(() => {
    const results: MatchedSchemeResult[] = [];

    for (const scheme of schemes) {
      const matchReasons: string[] = [];
      const name = (scheme.name || '').toLowerCase();
      const desc = (scheme.description || '').toLowerCase();
      const elig = (scheme.eligibility || '').toLowerCase();
      const benefits = (scheme.benefits || '').toLowerCase();
      const category = (scheme.category || '').toLowerCase();
      const isCentral = scheme.government_level === 'central';
      const isTamilNaduState = scheme.government_level === 'state' || (scheme.state || '').toLowerCase().includes('tamil');

      // -------------------------------------------------------------
      // 1. STATE / LOCATION FILTER
      // -------------------------------------------------------------
      if (selectedState === 'Tamil Nadu') {
        if (!isCentral && !isTamilNaduState) {
          continue; // Exclude non-TN state schemes
        }
        if (isTamilNaduState) {
          matchReasons.push(
            isTa ? 'தமிழ்நாடு மாநில விவசாயிகளுக்கான சிறப்புத் திட்டம்' : 'Exclusive Government of Tamil Nadu welfare initiative'
          );
        } else if (isCentral) {
          matchReasons.push(
            isTa ? 'தமிழ்நாடு உள்ளிட்ட அனைத்து இந்திய விவசாயிகளுக்கும் கிடைக்கும் மத்திய அரசுத் திட்டம்' : 'Central Government program applicable across all districts of Tamil Nadu'
          );
        }
      } else if (selectedState === 'other') {
        if (!isCentral) {
          continue; // Exclude state-specific schemes for other states
        }
        matchReasons.push(
          isTa ? 'மத்திய அரசுத் திட்டம் (அனைத்து மாநில விவசாயிகளுக்கும் பொருந்தும்)' : 'Central Government program applicable nationwide'
        );
      } else {
        // 'all'
        matchReasons.push(
          isCentral
            ? (isTa ? 'மத்திய அரசுத் திட்டம்' : 'National Central Sector program')
            : (isTa ? 'மாநில அரசுத் திட்டம்' : 'State Government initiative')
        );
      }

      // -------------------------------------------------------------
      // 2. LANDHOLDING SIZE FILTER
      // -------------------------------------------------------------
      if (selectedLandSize === 'marginal') {
        // Marginal: < 1 hectare (< 2.5 acres)
        const explicitlyExcludes = elig.includes('minimum of') && !elig.includes('small') && !elig.includes('marginal');
        if (explicitlyExcludes) continue;

        if (elig.includes('marginal') || elig.includes('small & marginal') || benefits.includes('marginal') || desc.includes('marginal')) {
          matchReasons.push(
            isTa ? 'குறு விவசாயிகளுக்கு (< 1 ஹெக்டேர்) முன்னுரிமை மற்றும் கூடுதல் மானியம் வழங்கப்படுகிறது' : 'Offers special priority or higher subsidy tier for Marginal Farmers (< 1 ha / < 2.5 acres)'
          );
        } else if (elig.includes('all landholding') || elig.includes('all farmers') || elig.includes('cultivable land')) {
          matchReasons.push(
            isTa ? 'நில உடைமை உள்ள அனைத்து விவசாயிகளுக்கும் பொருந்தும்' : 'Eligible for all certified landholding cultivators'
          );
        }
      } else if (selectedLandSize === 'small') {
        // Small: 1 - 2 hectares (2.5 - 5 acres)
        const explicitlyExcludes = elig.includes('minimum of 20 hectares') || elig.includes('minimum of 300');
        if (explicitlyExcludes) continue;

        if (elig.includes('small') || benefits.includes('small') || desc.includes('small')) {
          matchReasons.push(
            isTa ? 'சிறு விவசாயிகளுக்கு (1 - 2 ஹெக்டேர்) சிறப்பு சலுகை மற்றும் மானியம் வழங்கப்படுகிறது' : 'Qualifies for Small Farmer benefits (1-2 ha / 2.5-5 acres)'
          );
        } else if (elig.includes('all landholding') || elig.includes('all farmers') || elig.includes('cultivable land')) {
          matchReasons.push(
            isTa ? 'நில உடைமை உள்ள விவசாயிகளுக்கு பொருந்தும்' : 'Open to all certified agricultural landholders'
          );
        }
      } else if (selectedLandSize === 'medium_large') {
        // Medium / Large: > 2 hectares (> 5 acres)
        // Check for schemes strictly restricted to small/marginal (e.g. PM-KMY up to 2 ha)
        if (elig.includes('up to 2 hectares') || desc.includes('up to 2 hectares') || name.includes('maan dhan')) {
          continue; // Exclude schemes capped at 2 ha
        }
        matchReasons.push(
          isTa ? 'நடுத்தர மற்றும் பெரிய விவசாயிகளுக்கான மானிய வரம்புகளுக்கு பொருந்துகிறது' : 'Open to medium and large landholders under general subsidy provisions'
        );
      } else if (selectedLandSize === 'tenant') {
        // Tenant farmer / Sharecropper / Oral lessee
        const coversTenant = elig.includes('tenant') || elig.includes('sharecropper') || elig.includes('lessee') || desc.includes('tenant') || desc.includes('sharecropper') || name.includes('uzhavar santhai');
        if (!coversTenant) {
          continue; // Exclude schemes that strictly require land ownership in applicant's name
        }
        matchReasons.push(
          isTa ? 'குத்தகை விவசாயிகள் மற்றும் பகிர்வு பயிரிடுவோரை வெளிப்படையாக உள்ளடக்கியது' : 'Explicitly covers tenant farmers and sharecroppers without requiring land title'
        );
      }

      // -------------------------------------------------------------
      // 3. CROP / AGRICULTURAL ACTIVITY FILTER
      // -------------------------------------------------------------
      if (selectedCrop === 'cereals') {
        const isCerealsRelated = category.includes('seed') || category.includes('income') || category.includes('insurance') || category.includes('credit') || category.includes('machinery') || category.includes('irrigation') || desc.includes('paddy') || desc.includes('rice') || desc.includes('wheat') || desc.includes('kuruvai') || elig.includes('notified crops');
        if (!isCerealsRelated) continue;

        if (desc.includes('paddy') || desc.includes('kuruvai') || name.includes('kuruvai')) {
          matchReasons.push(
            isTa ? 'நெல் / குறுவை சாகுபடிக்கான நேரடி இடுபொருள் மற்றும் ஆதரவுத் திட்டம்' : 'Direct input or seasonal assistance tailored for Paddy / Kuruvai cultivation'
          );
        } else {
          matchReasons.push(
            isTa ? 'உணவு தானியங்கள் மற்றும் தானியப் பயிர்களுக்கு பொருந்தும்' : 'Applicable for food grains and cereal crops'
          );
        }
      } else if (selectedCrop === 'horticulture') {
        const isHortiRelated = category.includes('horticulture') || category.includes('irrigation') || category.includes('credit') || category.includes('marketing') || desc.includes('fruit') || desc.includes('vegetable') || desc.includes('horticultur') || desc.includes('sapling') || name.includes('midh') || name.includes('tanhoda') || name.includes('uzhavar santhai') || name.includes('kaviadp');
        if (!isHortiRelated) continue;

        matchReasons.push(
          isTa ? 'தோட்டக்கலை, காய்கறிகள், பழங்கள் மற்றும் நறுமணப் பயிர்களுக்கான ஆதரவு' : 'Supports horticulture, fruits, vegetables, and plantation crops'
        );
      } else if (selectedCrop === 'oilseeds_pulses') {
        const isOilPulseRelated = category.includes('soil') || category.includes('credit') || category.includes('insurance') || category.includes('machinery') || desc.includes('oilseed') || desc.includes('pulse') || desc.includes('dryland') || desc.includes('rainfed') || name.includes('dryland') || name.includes('msda');
        if (!isOilPulseRelated) continue;

        matchReasons.push(
          isTa ? 'எண்ணெய்வித்துக்கள், பருப்பு வகைகள் மற்றும் மானாவாரி பயிர்களுக்கான திட்டம்' : 'Supports oilseeds, pulses, and dryland / rainfed farming systems'
        );
      } else if (selectedCrop === 'organic') {
        const isOrganicRelated = category.includes('organic') || desc.includes('organic') || desc.includes('natural') || desc.includes('chemical-free') || desc.includes('vermicompost') || name.includes('pkvy') || name.includes('tofm') || name.includes('organic');
        if (!isOrganicRelated) continue;

        matchReasons.push(
          isTa ? 'இயற்கை மற்றும் நஞ்சில்லா விவசாய நடைமுறைகளுக்கான பிரத்யேக உதவி' : 'Specifically dedicated to chemical-free organic farming and certification'
        );
      }

      // -------------------------------------------------------------
      // 4. PURPOSE / FARMING NEED FILTER
      // -------------------------------------------------------------
      if (selectedPurpose !== 'all') {
        let purposeMatched = false;

        if (selectedPurpose === 'income') {
          if (category.includes('direct income') || name.includes('pm-kisan') || name.includes('maan dhan') || name.includes('kaviadp') || desc.includes('income support') || desc.includes('pension')) {
            purposeMatched = true;
            matchReasons.push(
              isTa ? 'நோக்கம்: நேரடி வருமான ஆதரவு அல்லது ஓய்வூதிய பலன்' : 'Purpose: Direct income transfer or retirement pension assistance'
            );
          }
        } else if (selectedPurpose === 'machinery') {
          if (category.includes('machinery') || name.includes('smam') || desc.includes('mechaniz') || desc.includes('tractor') || desc.includes('sprayer') || desc.includes('harvester') || desc.includes('implements')) {
            purposeMatched = true;
            matchReasons.push(
              isTa ? 'நோக்கம்: விவசாய இயந்திரங்கள் மற்றும் கருவிகள் கொள்முதல் மானியம்' : 'Purpose: Capital subsidy for agricultural machinery, tractors, or spraying equipment'
            );
          }
        } else if (selectedPurpose === 'insurance') {
          if (category.includes('insurance') || name.includes('pmfby') || name.includes('bima') || desc.includes('insurance') || desc.includes('natural risks')) {
            purposeMatched = true;
            matchReasons.push(
              isTa ? 'நோக்கம்: இயற்கை பேரிடர் பயிர் சேத காப்பீட்டுப் பாதுகாப்பு' : 'Purpose: Comprehensive crop insurance coverage against seasonal natural calamities'
            );
          }
        } else if (selectedPurpose === 'irrigation') {
          if (category.includes('irrigation') || name.includes('pdmc') || name.includes('tanhoda') || name.includes('pump') || name.includes('electricity') || desc.includes('irrigation') || desc.includes('drip') || desc.includes('sprinkler') || desc.includes('pumpset')) {
            purposeMatched = true;
            matchReasons.push(
              isTa ? 'நோக்கம்: சொட்டுநீர் / தெளிப்புப் பாசன மானியம் அல்லது இலவச மின்சாரம்/சோலார் பம்புசெட்' : 'Purpose: Micro-irrigation (Drip/Sprinkler) subsidy, solar pumps, or farm electricity assistance'
            );
          }
        } else if (selectedPurpose === 'credit') {
          if (category.includes('credit') || name.includes('kcc') || desc.includes('kcc') || desc.includes('credit limit') || desc.includes('loan')) {
            purposeMatched = true;
            matchReasons.push(
              isTa ? 'நோக்கம்: கிசான் கிரெடிட் கார்டு (KCC) மற்றும் சலுகை வட்டி சாகுபடி கடன்' : 'Purpose: Institutional cultivation credit, KCC card, and concessional interest loans'
            );
          }
        } else if (selectedPurpose === 'organic') {
          if (category.includes('organic') || name.includes('pkvy') || name.includes('tofm') || desc.includes('organic') || desc.includes('vermicompost')) {
            purposeMatched = true;
            matchReasons.push(
              isTa ? 'நோக்கம்: இயற்கை இடுபொருட்கள் தயாரிப்பு மற்றும் இலவச சான்றிதழ் உதவி' : 'Purpose: On-farm organic input generation and free organic certification'
            );
          }
        } else if (selectedPurpose === 'infrastructure') {
          if (category.includes('infrastructure') || name.includes('aif') || desc.includes('infrastructure') || desc.includes('warehouse') || desc.includes('cold chain') || desc.includes('processing')) {
            purposeMatched = true;
            matchReasons.push(
              isTa ? 'நோக்கம்: சேமிப்புக் கிடங்கு, உலர் களம் மற்றும் பதப்படுத்தும் உள்கட்டமைப்பு கடன் உதவி' : 'Purpose: Post-harvest storage, warehouse creation, and value-addition infrastructure financing'
            );
          }
        } else if (selectedPurpose === 'fpo') {
          if (category.includes('farmer organizations') || name.includes('fpo') || desc.includes('fpo') || desc.includes('producer organization') || desc.includes('collective')) {
            purposeMatched = true;
            matchReasons.push(
              isTa ? 'நோக்கம்: உழவர் உற்பத்தியாளர் நிறுவனங்கள் (FPO) அமைத்தல் மற்றும் நிதி உதவி' : 'Purpose: Formation grants and matching equity support for Farmer Collectives (FPOs)'
            );
          }
        } else if (selectedPurpose === 'marketing') {
          if (category.includes('marketing') || name.includes('uzhavar santhai') || desc.includes('marketing') || desc.includes('santhai')) {
            purposeMatched = true;
            matchReasons.push(
              isTa ? 'நோக்கம்: இடைத்தரகர்கள் இன்றி உழவர் சந்தையில் நேரடி விற்பனை செய்யும் வசதி' : 'Purpose: Direct consumer marketing and free retail stall allocation in Uzhavar Santhais'
            );
          }
        } else if (selectedPurpose === 'seeds') {
          if (category.includes('seed') || name.includes('kuruvai') || desc.includes('seed') || desc.includes('sapling')) {
            purposeMatched = true;
            matchReasons.push(
              isTa ? 'நோக்கம்: சான்றளிக்கப்பட்ட விதைகள் மற்றும் நடவுப் பொருட்கள் மானியம்' : 'Purpose: Certified seed packages and high-yielding planting material subsidies'
            );
          }
        }

        if (!purposeMatched) {
          continue; // Exclude schemes not matching specific requested purpose
        }
      }

      // Verification note based on statutory requirements
      let verificationHint = isTa 
        ? 'நில உரிமை ஆவணங்கள் (பட்டா/சிட்டா) மற்றும் அதிகாரப்பூர்வ விலக்கு நிபந்தனைகளை அரசுத் தளத்தில் சரிபார்க்கவும்.'
        : 'Statutory land title (Patta/Chitta) and official exclusion criteria must be verified on the official portal.';

      if (name.toLowerCase().includes('pm-kisan') || name.toLowerCase().includes('samman')) {
        verificationHint = isTa
          ? 'வருமான வரி செலுத்துவோர் மற்றும் நிறுவன நில உரிமையாளர்கள் விலக்கப்படுவர். ஆதார் இணைக்கப்பட்ட வங்கி கணக்கு தேவை.'
          : 'Income-tax payees and institutional landholders are excluded. Active Aadhaar-seeded bank account is required.';
      } else if (name.toLowerCase().includes('kuruvai') || name.toLowerCase().includes('kaviadp')) {
        verificationHint = isTa
          ? 'குறிப்பிட்ட டெல்டா மாவட்டங்கள் அல்லது நடப்பு கட்டத்தில் தேர்வு செய்யப்பட்ட கிராம ஊராட்சிகளில் மட்டுமே கிடைக்கும்.'
          : 'Restricted to notified Cauvery Delta blocks or designated village panchayats covered in the current operational phase.';
      }

      results.push({
        scheme,
        matchReasons,
        requiresVerification: true,
        verificationHint
      });
    }

    return results;
  }, [schemes, selectedState, selectedLandSize, selectedCrop, selectedPurpose, isTa]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-emerald-200/80 mb-8 space-y-6">
      
      {/* Finder Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-300/80">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.finderBadge}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.finderTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {t.finderSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors self-start md:self-auto shrink-0 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>{t.finderResetBtn}</span>
        </button>
      </div>

      {/* Matching Criteria Input Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
        
        {/* Field 1: State / Location */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.finderStateLabel}</span>
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value as any)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          >
            <option value="Tamil Nadu">{t.finderStateTamilNadu}</option>
            <option value="all">{t.finderStateAll}</option>
            <option value="other">{t.finderStateOther}</option>
          </select>
        </div>

        {/* Field 2: Landholding Size */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.finderLandSizeLabel}</span>
          </label>
          <select
            value={selectedLandSize}
            onChange={(e) => setSelectedLandSize(e.target.value as any)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          >
            <option value="all">{t.finderLandAll}</option>
            <option value="marginal">{t.finderLandMarginal}</option>
            <option value="small">{t.finderLandSmall}</option>
            <option value="medium_large">{t.finderLandMediumLarge}</option>
            <option value="tenant">{t.finderLandTenant}</option>
          </select>
        </div>

        {/* Field 3: Crop / Agricultural Activity */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.finderCropLabel}</span>
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value as any)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          >
            <option value="all">{t.finderCropAll}</option>
            <option value="cereals">{t.finderCropCereals}</option>
            <option value="horticulture">{t.finderCropHorticulture}</option>
            <option value="oilseeds_pulses">{t.finderCropOilseedsPulses}</option>
            <option value="organic">{t.finderCropOrganic}</option>
          </select>
        </div>

        {/* Field 4: Primary Farming Need / Purpose */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.finderPurposeLabel}</span>
          </label>
          <select
            value={selectedPurpose}
            onChange={(e) => setSelectedPurpose(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          >
            <option value="all">{t.finderPurposeAll}</option>
            <option value="income">{t.finderPurposeIncome}</option>
            <option value="machinery">{t.finderPurposeMachinery}</option>
            <option value="insurance">{t.finderPurposeInsurance}</option>
            <option value="irrigation">{t.finderPurposeIrrigation}</option>
            <option value="credit">{t.finderPurposeCredit}</option>
            <option value="organic">{t.finderPurposeOrganic}</option>
            <option value="infrastructure">{t.finderPurposeInfrastructure}</option>
            <option value="fpo">{t.finderPurposeFpo}</option>
            <option value="marketing">{t.finderPurposeMarketing}</option>
            <option value="seeds">{t.finderPurposeSeeds}</option>
          </select>
        </div>

      </div>

      {/* Verification Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-start gap-3 text-amber-900 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">{t.finderVerificationBadge}: </span>
          <span>{t.finderVerificationNotice}</span>
        </div>
      </div>

      {/* Matched Results Header */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>{t.finderResultsTitle}</span>
          <span className="text-xs bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
            {matchedResults.length} {isTa ? 'பொருந்தும் திட்டங்கள்' : 'Matches'}
          </span>
        </h3>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          {t.finderOfficialDisclaimer}
        </span>
      </div>

      {/* Results Rendering */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3">
              <div className="flex gap-2">
                <div className="h-5 bg-slate-200 rounded-full w-24"></div>
                <div className="h-5 bg-slate-100 rounded-full w-32"></div>
              </div>
              <div className="h-6 bg-slate-200 rounded-lg w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded-md w-full"></div>
              <div className="h-4 bg-slate-100 rounded-md w-2/3"></div>
              <div className="h-16 bg-emerald-50/50 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      ) : matchedResults.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {t.finderNoMatchTitle}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {t.finderNoMatchDesc}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.finderResetBtn}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {matchedResults.map(({ scheme, matchReasons, verificationHint }) => {
            const isState = scheme.government_level === 'state';

            return (
              <div
                key={scheme.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isState ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                          <Landmark className="w-3 h-3 text-emerald-700" />
                          {translations.schemes.stateGov}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300/80">
                          <Building2 className="w-3 h-3 text-blue-700" />
                          {translations.schemes.centralGov}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {translateCategory(scheme.category || 'Welfare Scheme')}
                      </span>
                    </div>

                    {/* Verification Required Warning Tag */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 shrink-0">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>{t.finderVerificationBadge}</span>
                    </span>
                  </div>

                  {/* Scheme Name */}
                  <h4 className="text-base font-bold text-slate-900 leading-snug break-words">
                    {scheme.name}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                    {scheme.description}
                  </p>

                  {/* "Why it Matched" Box */}
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                    <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.finderWhyMatched}</span>
                    </span>
                    <ul className="space-y-1 text-xs text-emerald-950 font-medium">
                      {matchReasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span className="leading-tight">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Eligibility & Benefits Snippet */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="line-clamp-2">
                        <strong className="text-slate-800">{translations.schemes.eligibility}: </strong>
                        <span className="text-slate-600">{scheme.eligibility}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="line-clamp-2">
                        <strong className="text-emerald-800">{translations.schemes.benefits}: </strong>
                        <span className="text-emerald-700 font-medium">{scheme.benefits}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Requirement Helper Note */}
                  <p className="mt-2 text-[10px] text-amber-800 italic bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                    ℹ️ {verificationHint}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectSchemeForDetails(scheme)}
                    className="btn-secondary text-xs py-2 px-3 text-center justify-center shrink-0 min-h-[36px]"
                  >
                    {translations.schemes.viewDetails}
                  </button>

                  {scheme.official_url ? (
                    <a
                      href={scheme.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5 text-center shrink-0 min-h-[36px]"
                    >
                      <span className="truncate max-w-[180px]">{translations.schemes.officialWebsite}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : null}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
