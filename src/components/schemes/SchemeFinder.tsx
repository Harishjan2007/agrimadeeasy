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
  Users,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Edit3,
  Info,
  IndianRupee,
  ShieldCheck,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { GovernmentScheme } from '@/types';
import { useLanguage } from '@/i18n';
import { 
  TAMIL_NADU_DISTRICTS, 
  SCHEME_CROP_ACTIVITIES, 
  SCHEME_SUPPORT_TYPES, 
  SCHEME_LANDHOLDING_OPTIONS 
} from '@/lib/schemes-data';
import {
  checkCropMatch,
  checkSupportMatch,
  checkLandholdingMatch,
  checkDistrictMatch,
  checkStateMatch
} from '@/lib/schemes-matching';

interface SchemeFinderProps {
  schemes: GovernmentScheme[];
  loading?: boolean;
  onSelectSchemeForDetails: (scheme: GovernmentScheme) => void;
}

export type MatchTier = 'likely' | 'more_info' | 'not_matched';

export interface ClassifiedSchemeResult {
  scheme: GovernmentScheme;
  tier: MatchTier;
  reasons: string[];
  conditionsToVerify: string[];
  unmetCriteria?: string[];
}

export default function SchemeFinder({
  schemes,
  loading = false,
  onSelectSchemeForDetails
}: SchemeFinderProps) {
  const { language, translations, translateCategory } = useLanguage();
  const isTa = language === 'ta';
  const t = translations.schemes;

  // Questionnaire Flow State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [activeResultsTier, setActiveResultsTier] = useState<MatchTier>('likely');

  // Answers State
  const [stateAnswer, setStateAnswer] = useState<'Tamil Nadu' | 'Central Only' | 'All'>('Tamil Nadu');
  const [districtAnswer, setDistrictAnswer] = useState<string>('All');
  const [landholdingAnswer, setLandholdingAnswer] = useState<string>('all');
  const [cropAnswer, setCropAnswer] = useState<string>('all');
  const [supportAnswer, setSupportAnswer] = useState<string>('all');
  const [applicantCategoryAnswer, setApplicantCategoryAnswer] = useState<string>('all');

  // Reset / Clear questionnaire
  const handleClear = () => {
    setCurrentStep(1);
    setIsSubmitted(false);
    setStateAnswer('Tamil Nadu');
    setDistrictAnswer('All');
    setLandholdingAnswer('all');
    setCropAnswer('all');
    setSupportAnswer('all');
    setApplicantCategoryAnswer('all');
  };

  const handleEditAnswers = () => {
    setIsSubmitted(false);
    setCurrentStep(1);
  };

  // Rule-Based Classification Engine: Categorizes every scheme into 1 of 3 tiers
  const classifiedResults = useMemo<{
    likely: ClassifiedSchemeResult[];
    more_info: ClassifiedSchemeResult[];
    not_matched: ClassifiedSchemeResult[];
  }>(() => {
    const likely: ClassifiedSchemeResult[] = [];
    const more_info: ClassifiedSchemeResult[] = [];
    const not_matched: ClassifiedSchemeResult[] = [];

    for (const scheme of schemes) {
      const reasons: string[] = [];
      const conditionsToVerify: string[] = [];
      const unmetCriteria: string[] = [];

      const name = (scheme.name || '').toLowerCase();
      const desc = (scheme.description || '').toLowerCase();
      const elig = (scheme.eligibility || '').toLowerCase();
      const benefits = (scheme.benefits || '').toLowerCase();
      const isCentral = scheme.government_level === 'central';
      const isTamilNaduState = scheme.government_level === 'state' || (scheme.state || '').toLowerCase().includes('tamil');

      // -------------------------------------------------------------
      // 1. STATE & DISTRICT ELIGIBILITY
      // -------------------------------------------------------------
      if (!checkStateMatch(stateAnswer, scheme)) {
        unmetCriteria.push(
          isTa ? 'இத்திட்டம் தமிழ்நாட்டிற்கு பொருந்தாது (பிற மாநில திட்டம்)' : 'This scheme is restricted to other states.'
        );
      } else {
        reasons.push(
          isTamilNaduState 
            ? (isTa ? 'தமிழ்நாடு அரசு திட்டம்' : 'State Govt of Tamil Nadu program')
            : (isTa ? 'மத்திய அரசு திட்டம் (தமிழ்நாடு விவசாயிகள் தகுதியானவர்கள்)' : 'Central program available in Tamil Nadu')
        );
      }

      if (districtAnswer !== 'All') {
        if (!checkDistrictMatch(districtAnswer, scheme)) {
          unmetCriteria.push(
            isTa ? `${districtAnswer} மாவட்டத்திற்கு அறிவிக்கப்படவில்லை` : `Not notified for ${districtAnswer} district.`
          );
        } else {
          reasons.push(
            isTa ? `${districtAnswer} மாவட்டத்தில் செயல்பாட்டில் உள்ளது` : `Active in ${districtAnswer} district`
          );
        }
      }

      // -------------------------------------------------------------
      // 2. LANDHOLDING SIZE RESTRICTIONS
      // -------------------------------------------------------------
      if (landholdingAnswer !== 'all') {
        if (!checkLandholdingMatch(landholdingAnswer, scheme)) {
          unmetCriteria.push(
            isTa ? 'நில உடைமை அளவு அல்லது சாகுபடி நிலை பொருந்தவில்லை' : 'Requires landholding profile matching specific parameters.'
          );
        } else {
          reasons.push(
            isTa ? 'உங்கள் நில உடைமை அளவுக்கு தகுதியானது' : 'Matches your landholding category'
          );
        }
      }

      // -------------------------------------------------------------
      // 3. CROPS / FARMING ACTIVITY
      // -------------------------------------------------------------
      let cropMatched = true;
      if (cropAnswer !== 'all') {
        cropMatched = checkCropMatch(cropAnswer, scheme);
        if (!cropMatched) {
          const category = (scheme.category || '').toLowerCase();
          const cropLower = cropAnswer.toLowerCase();
          const isHortiOnly = category.includes('horticulture') && !cropLower.includes('horticulture') && !cropLower.includes('vegetable') && !cropLower.includes('fruit');
          const isLivestockOnly = (category.includes('animal') || category.includes('dairy') || category.includes('fisheries')) && !cropLower.includes('dairy') && !cropLower.includes('livestock') && !cropLower.includes('poultry');

          if (isHortiOnly || isLivestockOnly) {
            unmetCriteria.push(
              isTa ? `தேர்வு செய்யப்பட்ட பயிர்களுக்குப் பதிலாக ${scheme.category} தேவைகளுக்கானது` : `Targeted specifically at ${scheme.category}.`
            );
          } else {
            conditionsToVerify.push(
              isTa ? `உங்கள் ${cropAnswer} பயிர் நடப்பு பருவ அறிவிப்பில் உள்ளதா என்பதை வட்டார அலுவலகத்தில் உறுதிசெய்யவும்` : `Verify whether your crop is notified in current seasonal schedule.`
            );
          }
        } else {
          reasons.push(
            isTa ? `உங்கள் பயிர் (${cropAnswer}) திட்ட வரம்பிற்குள் வருகிறது` : `Supports your chosen crop/activity (${cropAnswer})`
          );
        }
      }

      // -------------------------------------------------------------
      // 4. PURPOSE / SUPPORT NEEDED
      // -------------------------------------------------------------
      let supportMatched = true;
      if (supportAnswer !== 'all') {
        supportMatched = checkSupportMatch(supportAnswer, scheme);
        if (supportMatched) {
          reasons.push(
            isTa ? `உங்கள் தேவைக்குரிய (${supportAnswer}) ஆதரவு வழங்கப்படுகிறது` : `Matches your support requirement (${supportAnswer})`
          );
        } else {
          conditionsToVerify.push(
            isTa ? 'இத்திட்டம் பிற தேவைகளுக்கானது; குறிப்பிட்ட பலன் விதிமுறைகளை சரிபார்க்கவும்' : 'Scheme primary scope differs; check benefit provisions.'
          );
        }
      }

      // -------------------------------------------------------------
      // 5. APPLICANT PROFILE / CATEGORY
      // -------------------------------------------------------------
      if (applicantCategoryAnswer !== 'all') {
        if (applicantCategoryAnswer === 'women') {
          if (benefits.includes('women') || elig.includes('women')) {
            reasons.push(
              isTa ? 'பெண் விவசாயிகளுக்கு முன்னுரிமை / கூடுதல் மானிய சலுகை' : 'Priority quota or extra subsidy for women farmers'
            );
          } else {
            conditionsToVerify.push(
              isTa ? 'பொது விண்ணப்பதாரர் பிரிவின் கீழ் விண்ணப்பிக்கலாம்' : 'Eligible under general applicant category'
            );
          }
        } else if (applicantCategoryAnswer === 'sc_st') {
          if (benefits.includes('sc') || elig.includes('sc/st') || benefits.includes('100%')) {
            reasons.push(
              isTa ? 'ஆதிதிராவிடர் & பழங்குடியினருக்கு சிறப்பு ஒதுக்கீடு / கூடுதல் மானியம்' : 'Special quota or enhanced subsidy for SC/ST farmers'
            );
          } else {
            conditionsToVerify.push(
              isTa ? 'சாதி சான்றிதழ் சமர்ப்பிக்க வேண்டியிருக்கலாம்' : 'Community certificate verification required'
            );
          }
        } else if (applicantCategoryAnswer === 'fpo') {
          const category = (scheme.category || '').toLowerCase();
          if (category.includes('organization') || name.includes('fpo')) {
            reasons.push(
              isTa ? 'உழவர் உற்பத்தியாளர் நிறுவனங்களுக்கான (FPO) சிறப்பு மானியம்' : 'Tailored equity grant for Farmer Producer Organizations'
            );
          } else {
            unmetCriteria.push(
              isTa ? 'தனிநபர் விவசாயிகளுக்கு மட்டுமே பொருந்தும் (குழுவிற்கு அல்ல)' : 'For individual farmers only, not FPO collectives'
            );
          }
        }
      }

      // Mandatory general conditions to verify
      if (name.includes('pm-kisan') || name.includes('samman')) {
        conditionsToVerify.push(
          isTa ? 'வருமான வரி செலுத்துவோர் மற்றும் அரசு ஊழியர்கள் குடும்பங்கள் விலக்கப்படுவர்' : 'Income tax payers & institutional landholders excluded'
        );
      } else if (name.includes('kuruvai') || name.includes('delta')) {
        conditionsToVerify.push(
          isTa ? 'டெல்டா பாசன வட்டாரங்களில் மட்டுமே பருவகால தொகுப்பு கிடைக்கும்' : 'Restricted to notified Cauvery Delta blocks'
        );
      } else {
        conditionsToVerify.push(
          isTa ? 'பட்டா/சிட்டா மற்றும் ஆதார் இணைக்கப்பட்ட வங்கிக் கணக்கு சரிபார்க்கப்படும்' : 'Patta/Chitta and Aadhaar-seeded bank account required'
        );
      }

      // Final Classification Logic into 3 Tiers
      if (unmetCriteria.length > 0) {
        not_matched.push({
          scheme,
          tier: 'not_matched',
          reasons,
          conditionsToVerify,
          unmetCriteria
        });
      } else if ((supportAnswer === 'all' || supportMatched) && (cropAnswer === 'all' || cropMatched)) {
        likely.push({
          scheme,
          tier: 'likely',
          reasons,
          conditionsToVerify
        });
      } else {
        more_info.push({
          scheme,
          tier: 'more_info',
          reasons,
          conditionsToVerify
        });
      }
    }

    return { likely, more_info, not_matched };
  }, [
    schemes,
    stateAnswer,
    districtAnswer,
    landholdingAnswer,
    cropAnswer,
    supportAnswer,
    applicantCategoryAnswer,
    isTa
  ]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-emerald-200/80 mb-8 space-y-6">
      
      {/* Questionnaire Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-300/80">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isTa ? 'வழிகாட்டப்பட்ட தகுதி வினாத்தாள்' : 'Guided Eligibility Questionnaire'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.finderTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {isTa 
              ? 'உங்கள் நில அளவு, பயிர், மாவட்டம் மற்றும் தேவைகளுக்கு ஏற்ப அரசு திட்டங்களை 3 நிலைகளில் ஒப்பிட்டுப் பாருங்கள். (இது விருப்பத்தேர்வு மட்டுமே; எந்நேரமும் முழு பட்டியலையும் பார்க்கலாம்).'
              : 'Answer simple questions to match your farm against published requirements. Results are classified into Likely Matches, Needs Verification, and Ineligible.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {isSubmitted && (
            <button
              type="button"
              onClick={handleEditAnswers}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>{isTa ? 'பதில்களைத் திருத்து' : 'Edit Answers'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.finderResetBtn}</span>
          </button>
        </div>
      </div>

      {/* QUESTIONNAIRE NOT YET SUBMITTED: 5-STEP WIZARD */}
      {!isSubmitted ? (
        <div className="space-y-6">
          {/* Progress Tracker Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
              <span>{isTa ? `படி ${currentStep} / 5` : `Step ${currentStep} of 5`}</span>
              <span className="text-emerald-700 font-extrabold">
                {currentStep === 1 && (isTa ? 'இருப்பிடம் & மாவட்டம்' : 'Location & District')}
                {currentStep === 2 && (isTa ? 'நில உடைமை விவரம்' : 'Landholding Size')}
                {currentStep === 3 && (isTa ? 'பயிர் / விவசாய முறை' : 'Crop / Activity')}
                {currentStep === 4 && (isTa ? 'தேவைப்படும் உதவி' : 'Support Needed')}
                {currentStep === 5 && (isTa ? 'விவசாயி பிரிவு' : 'Applicant Category')}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: LOCATION & DISTRICT */}
          {currentStep === 1 && (
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{isTa ? 'உங்கள் மாநிலம் மற்றும் மாவட்டம் என்ன?' : 'Select your State and District'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isTa ? 'மாநிலம்' : 'State / Region'}
                  </label>
                  <select
                    value={stateAnswer}
                    onChange={(e) => setStateAnswer(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  >
                    <option value="Tamil Nadu">{isTa ? 'தமிழ்நாடு (Tamil Nadu)' : 'Tamil Nadu'}</option>
                    <option value="All">{isTa ? 'அனைத்து இந்தியா (All India)' : 'All India'}</option>
                    <option value="Central Only">{isTa ? 'பிற மாநிலங்கள் (மத்திய அரசு திட்டங்கள்)' : 'Central Schemes Only'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isTa ? 'தமிழ்நாடு மாவட்டம்' : 'Tamil Nadu District'}
                  </label>
                  <select
                    value={districtAnswer}
                    onChange={(e) => setDistrictAnswer(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  >
                    <option value="All">{isTa ? 'அனைத்து மாவட்டங்கள் (மாநிலம் முழுவதும்)' : 'All Districts (Statewide)'}</option>
                    {TAMIL_NADU_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LANDHOLDING SIZE & TENANCY */}
          {currentStep === 2 && (
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>{isTa ? 'உங்கள் நில உடைமை அல்லது சாகுபடி நிலை என்ன?' : 'What is your landholding size or tenancy status?'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'all', labelEn: 'Any Land Size / Not Restricted', labelTa: 'எந்த நில அளவும் / குறிப்பிடவில்லை' },
                  { id: 'marginal', labelEn: 'Marginal Farmer (< 1 Hectare / < 2.5 Acres)', labelTa: 'குறு விவசாயி (1 ஹெக்டேருக்கு கீழ் / < 2.5 ஏக்கர்)' },
                  { id: 'small', labelEn: 'Small Farmer (1 - 2 Hectares / 2.5 - 5 Acres)', labelTa: 'சிறு விவசாயி (1 முதல் 2 ஹெக்டேர் / 2.5 - 5 ஏக்கர்)' },
                  { id: 'above_5_acres', labelEn: 'Medium / Large Farmer (> 2 Hectares / > 5 Acres)', labelTa: 'நடுத்தர / பெரிய விவசாயி (2 ஹெக்டேருக்கு மேல் / > 5 ஏக்கர்)' },
                  { id: 'tenant', labelEn: 'Tenant Farmer / Landless Cultivator', labelTa: 'குத்தகை விவசாயி / நிலமற்ற பயிரிடுவோர்' }
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      landholdingAnswer === item.id 
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-xs'
                        : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="landholding"
                      value={item.id}
                      checked={landholdingAnswer === item.id}
                      onChange={(e) => setLandholdingAnswer(e.target.value)}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{isTa ? item.labelTa : item.labelEn}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CROPS & ACTIVITIES */}
          {currentStep === 3 && (
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>{isTa ? 'நீங்கள் பயிரிடும் முதன்மைப் பயிர் அல்லது விவசாயம் என்ன?' : 'What is your primary crop or agricultural enterprise?'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    cropAnswer === 'all' 
                      ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                      : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="crop"
                    value="all"
                    checked={cropAnswer === 'all'}
                    onChange={(e) => setCropAnswer(e.target.value)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{isTa ? 'அனைத்துப் பயிர்கள் / பொது விவசாயம்' : 'All Crops / General Agriculture'}</span>
                </label>

                {SCHEME_CROP_ACTIVITIES.filter((c) => c !== 'All Crops & Activities').map((cropName) => (
                  <label
                    key={cropName}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      cropAnswer === cropName 
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                        : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="crop"
                      value={cropName}
                      checked={cropAnswer === cropName}
                      onChange={(e) => setCropAnswer(e.target.value)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="truncate">{cropName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: PRIMARY SUPPORT NEEDED */}
          {currentStep === 4 && (
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>{isTa ? 'உங்களுக்குத் தேவைப்படும் முதன்மை உதவி என்ன?' : 'What type of government support are you seeking?'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    supportAnswer === 'all' 
                      ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                      : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="support"
                    value="all"
                    checked={supportAnswer === 'all'}
                    onChange={(e) => setSupportAnswer(e.target.value)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{isTa ? 'அனைத்து ஆதரவு வகைகள்' : 'All Support Types'}</span>
                </label>

                {SCHEME_SUPPORT_TYPES.filter((s) => s !== 'All Support Types').map((supportName) => (
                  <label
                    key={supportName}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      supportAnswer === supportName 
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                        : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="support"
                      value={supportName}
                      checked={supportAnswer === supportName}
                      onChange={(e) => setSupportAnswer(e.target.value)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="truncate">{supportName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: APPLICANT CATEGORY */}
          {currentStep === 5 && (
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{isTa ? 'விண்ணப்பதாரர் பிரிவு / முன்னுரிமை ஏதேனும் உள்ளதா?' : 'Applicant profile or special category (if applicable)'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'all', labelEn: 'General / No Special Category', labelTa: 'பொதுப் பிரிவு / எந்த சிறப்புப் பிரிவும் இல்லை' },
                  { id: 'small_marginal', labelEn: 'Small & Marginal Farmer (< 5 Acres)', labelTa: 'சிறு & குறு விவசாயி (< 5 ஏக்கர்)' },
                  { id: 'women', labelEn: 'Women Farmer', labelTa: 'பெண் விவசாயி' },
                  { id: 'sc_st', labelEn: 'SC / ST Community Farmer', labelTa: 'ஆதிதிராவிடர் / பழங்குடியின விவசாயி' },
                  { id: 'fpo', labelEn: 'Farmer Producer Organization (FPO / SHG)', labelTa: 'உழவர் உற்பத்தியாளர் குழு (FPO / மகளிர் குழு)' }
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      applicantCategoryAnswer === item.id 
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-xs'
                        : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={item.id}
                      checked={applicantCategoryAnswer === item.id}
                      onChange={(e) => setApplicantCategoryAnswer(e.target.value)}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{isTa ? item.labelTa : item.labelEn}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isTa ? 'முந்தையது' : 'Back'}</span>
              </button>
            ) : <div />}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>{isTa ? 'அடுத்த படி' : 'Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(true);
                  if (classifiedResults.likely.length > 0) {
                    setActiveResultsTier('likely');
                  } else if (classifiedResults.more_info.length > 0) {
                    setActiveResultsTier('more_info');
                  } else {
                    setActiveResultsTier('not_matched');
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isTa ? 'பொருந்தும் திட்டங்களைக் காண்க' : 'Find Matching Schemes'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* QUESTIONNAIRE SUBMITTED: 3-TIER RESULTS VIEW */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Statutory Verification Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-start gap-3 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">{t.finderVerificationBadge}: </span>
              <span>{t.finderVerificationNotice} {t.finderOfficialDisclaimer}</span>
            </div>
          </div>

          {/* Three Tiers Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveResultsTier('likely')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeResultsTier === 'likely'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isTa ? 'பொருந்தக்கூடியது' : 'Likely Match'}</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] ${
                activeResultsTier === 'likely' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {classifiedResults.likely.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveResultsTier('more_info')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeResultsTier === 'more_info'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isTa ? 'கூடுதல் தகவல் தேவை' : 'More Information Needed'}</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] ${
                activeResultsTier === 'more_info' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {classifiedResults.more_info.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveResultsTier('not_matched')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeResultsTier === 'not_matched'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isTa ? 'விதிகளுக்கு பொருந்தவில்லை' : 'Does Not Match Known Criteria'}</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] ${
                activeResultsTier === 'not_matched' ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {classifiedResults.not_matched.length}
              </span>
            </button>
          </div>

          {/* Results List for Current Tier */}
          {classifiedResults[activeResultsTier].length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                {isTa ? 'இப்பிரிவில் திட்டங்கள் எதுவும் இல்லை.' : 'No schemes in this classification category.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {classifiedResults[activeResultsTier].map(({ scheme, tier, reasons, conditionsToVerify, unmetCriteria }) => {
                const isState = scheme.government_level === 'state';

                return (
                  <div
                    key={scheme.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isState ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isState ? translations.schemes.stateGov : translations.schemes.centralGov}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {translateCategory(scheme.category || 'Welfare Scheme')}
                          </span>
                        </div>

                        {/* Tier Status Badge */}
                        {tier === 'likely' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {isTa ? 'பொருந்தக்கூடியது' : 'Likely Match'}
                          </span>
                        )}
                        {tier === 'more_info' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300">
                            <HelpCircle className="w-3 h-3 text-amber-600" />
                            {isTa ? 'கூடுதல் தகவல் தேவை' : 'More Info Needed'}
                          </span>
                        )}
                        {tier === 'not_matched' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            {isTa ? 'விதிகளுக்கு பொருந்தவில்லை' : 'Does Not Match'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {scheme.name}
                      </h3>

                      {scheme.benefit_amount && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold">
                          <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{scheme.benefit_amount}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">
                        {scheme.description}
                      </p>

                      {/* Reasons Box */}
                      {reasons.length > 0 && (
                        <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-950 space-y-1">
                          <span className="font-bold block">{isTa ? 'பொருந்தியதற்கான காரணங்கள்:' : 'Why this matches:'}</span>
                          <ul className="list-disc pl-3.5 space-y-0.5">
                            {reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Unmet Criteria Box (For Not Matched tier) */}
                      {unmetCriteria && unmetCriteria.length > 0 && (
                        <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900 space-y-1">
                          <span className="font-bold block">{isTa ? 'விதிகளுக்கு பொருந்தாத காரணம்:' : 'Unmet Condition:'}</span>
                          <ul className="list-disc pl-3.5 space-y-0.5">
                            {unmetCriteria.map((u, i) => (
                              <li key={i}>{u}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Verification Notice */}
                      {conditionsToVerify.length > 0 && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-[11px] text-amber-900 space-y-0.5">
                          <span className="font-bold block">{isTa ? 'சரிபார்க்க வேண்டிய நிபந்தனைகள்:' : 'To verify on official portal:'}</span>
                          <ul className="list-disc pl-3.5 space-y-0.5">
                            {conditionsToVerify.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectSchemeForDetails(scheme)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        {translations.schemes.viewDetails}
                      </button>

                      {scheme.official_url && (
                        <a
                          href={scheme.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold"
                        >
                          <span>{translations.schemes.officialWebsite}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
