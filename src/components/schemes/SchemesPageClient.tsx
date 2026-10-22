'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Landmark, 
  Search, 
  ExternalLink, 
  FileText, 
  Gift, 
  Users, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  Sparkles, 
  ListFilter,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sprout,
  Layers,
  HelpCircle,
  SlidersHorizontal,
  X,
  IndianRupee,
  Calendar,
  Clock,
  BadgeCheck
} from 'lucide-react';
import { GovernmentScheme } from '@/types';
import { getSchemes } from '@/lib/supabase/schemes';
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
  checkDistrictMatch
} from '@/lib/schemes-matching';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/lib/supabase/useAuth';
import SchemeFinder from '@/components/schemes/SchemeFinder';
import { PageHeader, EmptyState } from '@/components/ui';

export default function SchemesPageClient() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, translations, translateCategory } = useLanguage();
  const { profile } = useAuth();

  const isTa = language === 'ta';
  const t = translations.schemes;

  // Navigation tab: 'finder' (Find Schemes for Me) | 'directory' (Browse All Schemes)
  const [activeTab, setActiveTab] = useState<'finder' | 'directory'>('finder');

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGovLevel, setSelectedGovLevel] = useState<'All' | 'central' | 'state'>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedCrop, setSelectedCrop] = useState<string>('All');
  const [selectedSupport, setSelectedSupport] = useState<string>('All');
  const [selectedLandholding, setSelectedLandholding] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);
  const [selectedApplicantType, setSelectedApplicantType] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedBenefitType, setSelectedBenefitType] = useState<string>('All');
  const [selectedSchemeForModal, setSelectedSchemeForModal] = useState<GovernmentScheme | null>(null);

  // Sync tab with URL query parameter (?tab=directory or ?tab=finder)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'directory' || tabParam === 'browse') {
        setActiveTab('directory');
      } else if (tabParam === 'finder') {
        setActiveTab('finder');
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getSchemes();
      if (res.error) {
        setError(translations.schemes.noSchemesDescription);
      } else {
        setSchemes(res.data);
      }
    } catch (err) {
      console.error('Failed to load schemes:', err);
      setError(translations.schemes.noSchemesDescription);
    } finally {
      setLoading(false);
    }
  }, [translations.schemes.noSchemesDescription]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived unique departments
  const departments = useMemo(() => {
    const deps = new Set<string>();
    schemes.forEach((s) => {
      if (s.department) deps.add(s.department);
    });
    return Array.from(deps).sort();
  }, [schemes]);

  // Derived categories
  const categories = useMemo(() => {
    const defaultCats = [
      'All',
      'Direct Income Support',
      'Machinery Subsidy',
      'Crop Insurance',
      'Credit & Loans',
      'Irrigation',
      'Organic/Natural Farming',
      'Infrastructure',
      'Seeds & Planting Material',
      'Horticulture & Protected Cultivation',
      'Animal Husbandry & Fisheries'
    ];
    const dataCats = Array.from(new Set(schemes.map((s) => s.category).filter(Boolean))) as string[];
    const set = new Set([...defaultCats, ...dataCats]);
    return Array.from(set);
  }, [schemes]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedGovLevel !== 'All') count++;
    if (selectedDistrict !== 'All') count++;
    if (selectedCrop !== 'All') count++;
    if (selectedSupport !== 'All') count++;
    if (selectedLandholding !== 'All') count++;
    if (selectedCategory !== 'All') count++;
    if (selectedApplicantType !== 'All') count++;
    if (selectedDepartment !== 'All') count++;
    if (selectedBenefitType !== 'All') count++;
    if (searchTerm.trim()) count++;
    return count;
  }, [
    selectedGovLevel,
    selectedDistrict,
    selectedCrop,
    selectedSupport,
    selectedLandholding,
    selectedCategory,
    selectedApplicantType,
    selectedDepartment,
    selectedBenefitType,
    searchTerm
  ]);

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedGovLevel('All');
    setSelectedDistrict('All');
    setSelectedCrop('All');
    setSelectedSupport('All');
    setSelectedLandholding('All');
    setSelectedCategory('All');
    setSelectedApplicantType('All');
    setSelectedDepartment('All');
    setSelectedBenefitType('All');
  };

  // Comprehensive Filtered schemes logic
  const filteredSchemes = useMemo(() => {
    return schemes.filter((scheme) => {
      const q = searchTerm.toLowerCase().trim();
      const name = (scheme.name || '').toLowerCase();
      const desc = (scheme.description || '').toLowerCase();
      const eligibility = (scheme.eligibility || '').toLowerCase();
      const benefits = (scheme.benefits || '').toLowerCase();
      const benefitAmount = (scheme.benefit_amount || '').toLowerCase();
      const category = (scheme.category || '').toLowerCase();
      const department = (scheme.department || '').toLowerCase();
      const source = (scheme.source || '').toLowerCase();
      const govLevel = (scheme.government_level || '').toLowerCase();
      const state = (scheme.state || '').toLowerCase();
      const supportType = (scheme.support_type || '').toLowerCase();
      const supportedCrops = (scheme.supported_crops || []).map((c) => c.toLowerCase());
      const requiredDocs = (scheme.required_documents || []).map((d) => d.toLowerCase());

      // 1. Search Query Match (Bilingual Tamil & English)
      let matchesSearch = true;
      if (q) {
        // Expand common Tamil synonyms for query matching
        const isTamilPaddy = q.includes('நெல்') || q.includes('குறுவை');
        const isTamilSubsidy = q.includes('மானியம்');
        const isTamilMachinery = q.includes('டிராக்டர்') || q.includes('இயந்திரம்') || q.includes('கருவி');
        const isTamilIrrigation = q.includes('பாசனம்') || q.includes('சொட்டு') || q.includes('பம்பு');
        const isTamilSeed = q.includes('விதை');
        const isTamilInsurance = q.includes('காப்பீடு');
        const isTamilLoan = q.includes('கடன்');

        matchesSearch = 
          name.includes(q) || 
          desc.includes(q) || 
          eligibility.includes(q) || 
          benefits.includes(q) || 
          benefitAmount.includes(q) ||
          category.includes(q) || 
          department.includes(q) ||
          source.includes(q) ||
          govLevel.includes(q) ||
          state.includes(q) ||
          supportType.includes(q) ||
          supportedCrops.some((c) => c.includes(q)) ||
          requiredDocs.some((d) => d.includes(q)) ||
          (isTamilPaddy && (supportedCrops.some((c) => c.includes('paddy') || c.includes('cereal')) || desc.includes('paddy') || name.includes('kuruvai'))) ||
          (isTamilSubsidy && (benefits.includes('subsidy') || benefitAmount.includes('subsidy') || desc.includes('subsidy'))) ||
          (isTamilMachinery && (category.includes('machinery') || desc.includes('tractor') || desc.includes('mechaniz'))) ||
          (isTamilIrrigation && (category.includes('irrigation') || desc.includes('drip') || desc.includes('sprinkler') || desc.includes('pump'))) ||
          (isTamilSeed && (category.includes('seed') || desc.includes('seed') || supportedCrops.some((c) => c.includes('seed')))) ||
          (isTamilInsurance && (category.includes('insurance') || name.includes('bima') || name.includes('pmfby'))) ||
          (isTamilLoan && (category.includes('credit') || desc.includes('loan') || name.includes('kcc')));
      }

      // 2. Government Level Match
      const matchesLevel = selectedGovLevel === 'All' || scheme.government_level === selectedGovLevel;

      // 3. District Match (Central schemes & statewide schemes remain discoverable across all TN districts)
      const matchesDistrict = checkDistrictMatch(selectedDistrict, scheme);

      // 4. Crop / Farming Activity Match (resilient keyword & taxonomy matching)
      const matchesCrop = checkCropMatch(selectedCrop, scheme);

      // 5. Support Type Match (resilient keyword & taxonomy matching)
      const matchesSupport = checkSupportMatch(selectedSupport, scheme);

      // 6. Landholding Match (resilient across below_1, 1_to_2, 2_to_5, above_5, landless, tenant)
      const matchesLandholding = checkLandholdingMatch(selectedLandholding, scheme);

      // 7. Category Filter Pill Match
      const matchesCategory = selectedCategory === 'All' || scheme.category === selectedCategory;

      // 8. Applicant Type Match
      let matchesApplicant = true;
      if (selectedApplicantType !== 'All') {
        const appType = selectedApplicantType.toLowerCase();
        if (appType === 'small_marginal') {
          matchesApplicant = eligibility.includes('small') || eligibility.includes('marginal') || (scheme.beneficiaries || '').toLowerCase().includes('small');
        } else if (appType === 'women') {
          matchesApplicant = eligibility.includes('women') || (scheme.beneficiaries || '').toLowerCase().includes('women') || benefits.includes('women');
        } else if (appType === 'sc_st') {
          matchesApplicant = eligibility.includes('sc') || eligibility.includes('st') || (scheme.beneficiaries || '').toLowerCase().includes('sc');
        } else if (appType === 'tenant') {
          matchesApplicant = eligibility.includes('tenant') || (scheme.beneficiaries || '').toLowerCase().includes('tenant');
        } else if (appType === 'fpo') {
          matchesApplicant = category.includes('organization') || name.includes('fpo') || (scheme.beneficiaries || '').toLowerCase().includes('fpo');
        }
      }

      // 9. Department Match
      const matchesDept = selectedDepartment === 'All' || scheme.department === selectedDepartment;

      // 10. Benefit Type Match
      let matchesBenefitType = true;
      if (selectedBenefitType !== 'All') {
        const bLower = selectedBenefitType.toLowerCase();
        matchesBenefitType = 
          (scheme.benefit_type || '').toLowerCase().includes(bLower) ||
          benefits.includes(bLower) ||
          category.includes(bLower);
      }

      return (
        matchesSearch &&
        matchesLevel &&
        matchesDistrict &&
        matchesCrop &&
        matchesSupport &&
        matchesLandholding &&
        matchesCategory &&
        matchesApplicant &&
        matchesDept &&
        matchesBenefitType
      );
    });
  }, [
    schemes,
    searchTerm,
    selectedGovLevel,
    selectedDistrict,
    selectedCrop,
    selectedSupport,
    selectedLandholding,
    selectedCategory,
    selectedApplicantType,
    selectedDepartment,
    selectedBenefitType
  ]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16 overflow-x-hidden">
      {/* Modern Page Header */}
      <PageHeader
        title={translations.schemes.title}
        subtitle={translations.schemes.subtitle}
        badge={isTa ? 'அரசு நலத்திட்டங்கள் & மானியங்கள்' : 'Verified Government Schemes & Subsidies'}
        icon={Landmark}
        iconColor="text-emerald-700"
        iconBg="bg-emerald-50 border-emerald-200"

        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('finder')}
              className={`text-xs sm:text-sm py-2 px-3.5 flex items-center gap-2 rounded-xl font-bold transition-all ${
                activeTab === 'finder'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{translations.schemes.findSchemesForMeTab}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`text-xs sm:text-sm py-2 px-3.5 flex items-center gap-2 rounded-xl font-bold transition-all ${
                activeTab === 'directory'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ListFilter className="w-4 h-4 text-slate-500" />
              <span>{translations.schemes.browseAllTab}</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Error State Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-800">
            <div className="flex items-center gap-3 min-w-0">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold">{translations.common.error}</p>
                <p className="text-xs text-rose-600 mt-0.5 break-words">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadData()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shrink-0 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{translations.common.retry}</span>
            </button>
          </div>
        )}


        {activeTab === 'finder' ? (
          /* ======================================================== */
          /* SECTION 1: PERSONALIZED SCHEMES FINDER ("FIND FOR ME")   */
          /* ======================================================== */
          <SchemeFinder
            schemes={schemes}
            loading={loading}
            onSelectSchemeForDetails={(s) => setSelectedSchemeForModal(s)}
          />
        ) : (
          /* ======================================================== */
          /* SECTION 2: BROWSE ALL SCHEMES DIRECTORY (PRESERVED)      */
          /* ======================================================== */
          <div>
            {/* Search & Filters Container */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8 space-y-4">
              
              {/* Row 1: Search Box + Government Level Tabs */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="w-full md:w-80 lg:w-96 relative min-w-0">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={translations.schemes.searchPlaceholder}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
                    >
                      {isTa ? 'அழிக்க' : 'Clear'}
                    </button>
                  )}
                </div>

                {/* Government Level Toggle Tabs */}
                <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shrink-0 self-start md:self-auto flex-wrap gap-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedGovLevel('All')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedGovLevel === 'All'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {translations.schemes.allSchemes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGovLevel('central')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedGovLevel === 'central'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{translations.schemes.centralGov}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGovLevel('state')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedGovLevel === 'state'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>{translations.schemes.stateGov}</span>
                  </button>
                </div>

              </div>

              {/* Row 2: Four Core Filters (District, Crop, Support Needed, Landholding) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                
                {/* 1. Tamil Nadu District Filter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{isTa ? 'மாவட்டம்' : 'District (Tamil Nadu)'}</span>
                    </label>
                    {profile?.district && TAMIL_NADU_DISTRICTS.includes(profile.district) && selectedDistrict !== profile.district && (
                      <button
                        type="button"
                        onClick={() => setSelectedDistrict(profile.district!)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                      >
                        {profile.district}
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="All">{isTa ? 'அனைத்து மாவட்டங்கள் (மாநிலம் முழுவதும்)' : 'All Districts (Statewide)'}</option>
                    {TAMIL_NADU_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Crop or Farming Activity Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Sprout className="w-3 h-3 text-emerald-600" />
                    <span>{isTa ? 'பயிர் / விவசாய நடவடிக்கை' : 'Crop / Activity'}</span>
                  </label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="All">{isTa ? 'அனைத்துப் பயிர்கள் & நடவடிக்கைகள்' : 'All Crops & Activities'}</option>
                    {SCHEME_CROP_ACTIVITIES.filter((c) => c !== 'All Crops & Activities').map((cropName) => (
                      <option key={cropName} value={cropName}>
                        {cropName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Support Needed Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Gift className="w-3 h-3 text-emerald-600" />
                    <span>{isTa ? 'தேவைப்படும் உதவி' : 'Support Needed'}</span>
                  </label>
                  <select
                    value={selectedSupport}
                    onChange={(e) => setSelectedSupport(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="All">{isTa ? 'அனைத்து ஆதரவு வகைகள்' : 'All Support Types'}</option>
                    {SCHEME_SUPPORT_TYPES.filter((s) => s !== 'All Support Types').map((supportName) => (
                      <option key={supportName} value={supportName}>
                        {supportName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Landholding Size Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-600" />
                    <span>{isTa ? 'நில உடைமை அளவு' : 'Landholding Size'}</span>
                  </label>
                  <select
                    value={selectedLandholding}
                    onChange={(e) => setSelectedLandholding(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="All">{isTa ? 'அனைத்து நில அளவுகளும்' : 'All Landholding Sizes'}</option>
                    {SCHEME_LANDHOLDING_OPTIONS.filter((l) => l.id !== 'all').map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Row 3: Collapsible "More Filters" Toggle */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors py-1 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showMoreFilters ? (isTa ? 'வடிகட்டிகளை மறைக்க' : 'Hide Advanced Filters') : (isTa ? 'கூடுதல் வடிகட்டிகள்' : 'More Filters')}</span>
                  {showMoreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isTa ? 'வடிகட்டிகளை அழிக்க' : 'Clear Filters'} ({activeFiltersCount})</span>
                  </button>
                )}
              </div>

              {/* Collapsible Advanced Filters Section */}
              {showMoreFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in duration-150">
                  {/* Advanced Filter 1: Applicant / Farmer Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isTa ? 'விவசாயி வகை' : 'Applicant Type'}
                    </label>
                    <select
                      value={selectedApplicantType}
                      onChange={(e) => setSelectedApplicantType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="All">{isTa ? 'அனைத்து விண்ணப்பதாரர் பிரிவுகள்' : 'All Applicant Types'}</option>
                      <option value="small_marginal">{isTa ? 'சிறு மற்றும் குறு விவசாயிகள் (< 5 ஏக்கர்)' : 'Small & Marginal Farmers (< 5 acres)'}</option>
                      <option value="women">{isTa ? 'பெண் விவசாயிகள்' : 'Women Farmers'}</option>
                      <option value="sc_st">{isTa ? 'ஆதிதிராவிடர் & பழங்குடியினர்' : 'SC / ST Farmers'}</option>
                      <option value="tenant">{isTa ? 'குத்தகை விவசாயிகள் / நிலமற்றோர்' : 'Tenant / Landless Farmers'}</option>
                      <option value="fpo">{isTa ? 'உழவர் உற்பத்தியாளர் குழுக்கள் (FPO)' : 'FPOs & Farmer Groups'}</option>
                    </select>
                  </div>

                  {/* Advanced Filter 2: Responsible Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isTa ? 'நிர்வகிக்கும் அரசுத் துறை' : 'Administering Department'}
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="All">{isTa ? 'அனைத்து அரசுத் துறைகள்' : 'All Departments'}</option>
                      {departments.map((dep) => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </div>

                  {/* Advanced Filter 3: Benefit Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isTa ? 'மானிய / பலன் வகை' : 'Benefit Type'}
                    </label>
                    <select
                      value={selectedBenefitType}
                      onChange={(e) => setSelectedBenefitType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="All">{isTa ? 'அனைத்து பலன் வகைகள்' : 'All Benefit Types'}</option>
                      <option value="Direct Benefit Transfer">{isTa ? 'நேரடி வங்கி பரிமாற்றம் (DBT)' : 'Direct Benefit Transfer (DBT)'}</option>
                      <option value="Capital Subsidy">{isTa ? 'முதலீட்டு மானியம்' : 'Capital Subsidy'}</option>
                      <option value="Input Subsidy">{isTa ? 'இடுபொருள் மானியம்' : 'Input Subsidy'}</option>
                      <option value="Loan">{isTa ? 'சலுகைக் கடன்' : 'Concessional Loan / Credit'}</option>
                      <option value="Insurance">{isTa ? 'பயிர் காப்பீடு' : 'Crop Insurance'}</option>
                      <option value="Service">{isTa ? 'இலவச சேவை / பயிற்சி' : 'Service / Training'}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Row 4: Category Pills Row */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-agri-600 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {translateCategory(cat)}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Schemes Cards Grid Header */}
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 min-w-0">
                  <span className="truncate">{translations.schemes.title}</span>
                  {!loading && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full shrink-0">
                      {filteredSchemes.length} {isTa ? 'திட்டங்கள்' : (filteredSchemes.length === 1 ? 'Scheme' : 'Schemes')}
                    </span>
                  )}
                </h2>

                {!loading && schemes.length > 0 && (
                  <button
                    onClick={() => loadData()}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 shrink-0"
                    title={isTa ? 'புதுப்பிக்க' : 'Refresh schemes directory'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isTa ? 'புதுப்பிக்க' : 'Refresh'}</span>
                  </button>
                )}
              </div>

              {/* Loading Skeleton */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-32 bg-slate-200 rounded-full"></div>
                        <div className="h-5 w-24 bg-slate-200 rounded-full"></div>
                      </div>
                      <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                      <div className="h-14 bg-slate-100 rounded-2xl"></div>
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-4/5"></div>
                      </div>
                      <div className="h-9 bg-slate-200 rounded-xl pt-2"></div>
                    </div>
                  ))}
                </div>
              ) : schemes.length === 0 ? (
                /* Global Empty State */
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                  <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">{translations.schemes.noSchemesFound}</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {translations.schemes.noSchemesDescription}
                  </p>
                  <button
                    onClick={() => loadData()}
                    className="mt-5 btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{translations.common.retry}</span>
                  </button>
                </div>
              ) : filteredSchemes.length === 0 ? (
                /* Filter / Search Empty State */
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                  <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-800">
                    {translations.schemes.noSchemesFound}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isTa ? 'தேர்ந்தெடுத்த வடிப்பான்களுக்கு ஏற்ப எந்த அரசு திட்டமும் பொருந்தவில்லை.' : 'No verified government schemes match your active filter combination.'}
                  </p>
                  <button
                    onClick={handleClearAllFilters}
                    className="mt-4 btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{translations.common.clearFilters}</span>
                  </button>
                </div>
              ) : (
                /* Schemes Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSchemes.map((scheme) => {
                    const isState = scheme.government_level === 'state';
                    const status = scheme.availability_status || 'open';

                    return (
                      <div
                        key={scheme.id}
                        className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-agri-300 transition-all flex flex-col justify-between h-full min-w-0 overflow-hidden break-words group"
                      >
                        <div>
                          {/* Top Badges: Government Level, Category, and Availability Status */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
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

                            {/* Status Badge */}
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                              status === 'open'
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : status === 'seasonal'
                                ? 'text-amber-700 bg-amber-50 border-amber-200'
                                : 'text-slate-600 bg-slate-100 border-slate-200'
                            }`}>
                              <CheckCircle2 className="w-3 h-3" />
                              {status === 'open' 
                                ? (isTa ? 'நடப்பில் உள்ளது' : 'Active / Open')
                                : status === 'seasonal'
                                ? (isTa ? 'பருவகால திட்டம்' : 'Seasonal Window')
                                : (isTa ? 'சரிபார்ப்பு நிலுவை' : 'Verification Pending')}
                            </span>
                          </div>

                          {/* Scheme Name */}
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-agri-700 transition-colors leading-snug break-words">
                            {scheme.name}
                          </h3>

                          {/* Department & Authority */}
                          {scheme.department && (
                            <p className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1 truncate">
                              <Landmark className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{scheme.department}</span>
                            </p>
                          )}

                          {/* Subsidy / Benefit Rate Highlight */}
                          {scheme.benefit_amount && (
                            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-900 text-xs font-bold">
                              <IndianRupee className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="break-words">{scheme.benefit_amount}</span>
                            </div>
                          )}

                          {/* Description */}
                          <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed line-clamp-3 break-words">
                            {scheme.description}
                          </p>

                          {/* Supported Crops Tags */}
                          {scheme.supported_crops && scheme.supported_crops.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                                {isTa ? 'பயிர்கள்:' : 'Crops:'}
                              </span>
                              {scheme.supported_crops.slice(0, 4).map((crop) => (
                                <span key={crop} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                                  {crop}
                                </span>
                              ))}
                              {scheme.supported_crops.length > 4 && (
                                <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                                  +{scheme.supported_crops.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Eligibility, Benefits, and Application Info Box */}
                          <div className="mt-4 space-y-2.5 pt-4 border-t border-slate-100 text-xs">
                            <div className="flex items-start gap-2 min-w-0">
                              <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div className="min-w-0 break-words">
                                <span className="font-bold text-slate-800">{translations.schemes.eligibility}: </span>
                                <span className="text-slate-600">{scheme.eligibility}</span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 min-w-0">
                              <Gift className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <div className="min-w-0 break-words">
                                <span className="font-bold text-emerald-800">{translations.schemes.benefits}: </span>
                                <span className="text-emerald-700 font-medium">{scheme.benefits}</span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div className="min-w-0 break-words">
                                <span className="font-bold text-slate-800">{translations.schemes.applicationProcess}: </span>
                                <span className="text-slate-600">{scheme.application_info}</span>
                              </div>
                            </div>
                          </div>

                          {/* Official Source & Verification Date */}
                          {scheme.source && (
                            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 gap-2">
                              <span className="truncate max-w-[220px]">
                                <strong>{isTa ? 'ஆதாரம்:' : 'Source:'}</strong> {scheme.source}
                              </span>
                              {scheme.last_verified_at && (
                                <span className="shrink-0 text-slate-400 text-[10px] flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{isTa ? 'சரிபார்க்கப்பட்டது:' : 'Verified:'} {scheme.last_verified_at}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Actions (Responsive and non-colliding buttons) */}
                        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                          <button
                            onClick={() => setSelectedSchemeForModal(scheme)}
                            className="btn-secondary text-xs py-2 px-3 text-center justify-center shrink-0 min-h-[38px]"
                          >
                            {translations.schemes.viewDetails}
                          </button>

                          {scheme.official_url ? (
                            <a
                              href={scheme.official_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5 text-center shrink-0 min-h-[38px]"
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
          </div>
        )}

      </div>

      {/* Scheme Detail Modal */}
      {selectedSchemeForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  selectedSchemeForModal.government_level === 'state'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}>
                  {selectedSchemeForModal.government_level === 'state' ? translations.schemes.stateGov : translations.schemes.centralGov}
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {translateCategory(selectedSchemeForModal.category)}
                </span>
              </div>

              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                {isTa ? 'சரிபார்க்கப்பட்டது' : 'Verified'}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 leading-snug break-words">
              {selectedSchemeForModal.name}
            </h3>

            {selectedSchemeForModal.department && (
              <p className="text-xs text-slate-500 font-semibold mb-3 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedSchemeForModal.department}</span>
              </p>
            )}

            {selectedSchemeForModal.benefit_amount && (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                <IndianRupee className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{isTa ? 'வழங்கப்படும் தொகை / மானியம்:' : 'Benefit / Subsidy:'} {selectedSchemeForModal.benefit_amount}</span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed break-words">
              {selectedSchemeForModal.description}
            </p>

            <div className="space-y-3.5 bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-900 block mb-0.5">{translations.schemes.eligibility}</span>
                <p className="text-slate-600 leading-relaxed break-words">{selectedSchemeForModal.eligibility}</p>
              </div>

              {selectedSchemeForModal.landholding_criteria && (
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">{isTa ? 'நில உடைமை வரம்பு' : 'Landholding Criteria'}</span>
                  <p className="text-slate-600 leading-relaxed break-words">{selectedSchemeForModal.landholding_criteria}</p>
                </div>
              )}

              <div>
                <span className="font-bold text-emerald-800 block mb-0.5">{translations.schemes.benefits}</span>
                <p className="text-emerald-700 font-medium leading-relaxed break-words">{selectedSchemeForModal.benefits}</p>
              </div>

              {selectedSchemeForModal.required_documents && selectedSchemeForModal.required_documents.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900 block mb-1">{isTa ? 'தேவையான ஆவணங்கள்' : 'Required Documents'}</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    {selectedSchemeForModal.required_documents.map((doc, idx) => (
                      <li key={idx} className="break-words">{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-900 block mb-0.5">{translations.schemes.applicationProcess}</span>
                <p className="text-slate-600 leading-relaxed break-words">{selectedSchemeForModal.application_info}</p>
              </div>

              {selectedSchemeForModal.source && (
                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="break-words"><strong>{isTa ? 'ஆதாரம்:' : 'Source:'}</strong> {selectedSchemeForModal.source}</span>
                  {selectedSchemeForModal.last_verified_at && (
                    <span className="shrink-0">{isTa ? 'சரிபார்க்கப்பட்டது:' : 'Verified:'} {selectedSchemeForModal.last_verified_at}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setSelectedSchemeForModal(null)}
                className={`btn-secondary text-xs py-2.5 w-full ${selectedSchemeForModal.official_url ? 'sm:w-1/2' : ''}`}
              >
                {translations.common.close}
              </button>
              {selectedSchemeForModal.official_url && (
                <a
                  href={selectedSchemeForModal.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full sm:w-1/2 text-xs py-2.5 flex items-center justify-center gap-1.5 text-center font-bold"
                >
                  <span className="truncate">{translations.schemes.officialWebsite}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
