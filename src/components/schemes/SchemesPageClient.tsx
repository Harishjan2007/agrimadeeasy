'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Landmark, 
  Search, 
  ExternalLink, 
  FileText, 
  Gift, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  CheckCircle2 
} from 'lucide-react';
import { GovernmentScheme } from '@/types';
import { getSchemes } from '@/lib/supabase/schemes';
import { useLanguage } from '@/i18n';

export default function SchemesPageClient() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, translations, translateCategory } = useLanguage();

  const isTa = language === 'ta';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGovLevel, setSelectedGovLevel] = useState<'All' | 'central' | 'state'>('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSchemeForModal, setSelectedSchemeForModal] = useState<GovernmentScheme | null>(null);

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

  // Available categories extracted from loaded data or defaults
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
      'Seeds & Planting Material'
    ];
    const dataCats = Array.from(new Set(schemes.map((s) => s.category).filter(Boolean))) as string[];
    const set = new Set([...defaultCats, ...dataCats]);
    return Array.from(set);
  }, [schemes]);

  // Filtered schemes based on search, gov level, and category
  const filteredSchemes = useMemo(() => {
    return schemes.filter((scheme) => {
      const q = searchTerm.toLowerCase().trim();
      const name = (scheme.name || '').toLowerCase();
      const desc = (scheme.description || '').toLowerCase();
      const eligibility = (scheme.eligibility || '').toLowerCase();
      const benefits = (scheme.benefits || '').toLowerCase();
      const category = (scheme.category || '').toLowerCase();
      const source = (scheme.source || '').toLowerCase();
      const govLevel = (scheme.government_level || '').toLowerCase();
      const state = (scheme.state || '').toLowerCase();

      // Search matches
      const matchesSearch = !q || 
        name.includes(q) || 
        desc.includes(q) || 
        eligibility.includes(q) || 
        benefits.includes(q) || 
        category.includes(q) || 
        source.includes(q) ||
        govLevel.includes(q) ||
        state.includes(q) ||
        (q === 'central' && govLevel === 'central') ||
        (q === 'state' && govLevel === 'state') ||
        (q.includes('tamil') && (govLevel === 'state' || state.includes('tamil')));

      // Level matches
      const matchesLevel = selectedGovLevel === 'All' || scheme.government_level === selectedGovLevel;

      // Category matches
      const matchesCategory = selectedCategory === 'All' || scheme.category === selectedCategory;

      return matchesSearch && matchesLevel && matchesCategory;
    });
  }, [schemes, searchTerm, selectedGovLevel, selectedCategory]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16 overflow-x-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-agri-900 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-emerald-500/30">
                <Landmark className="w-3.5 h-3.5" />
                {isTa ? 'அரசு நலத்திட்டங்கள் மற்றும் மானியங்கள்' : 'Verified Government Welfare & Subsidy Programs'}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight break-words">
                {translations.schemes.title}
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                {translations.schemes.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/machinery"
                className="btn-accent text-xs sm:text-sm py-2 px-3.5 flex items-center gap-2 shadow-lg"
              >
                <span>{isTa ? 'இயந்திர வாடகை & மானியங்கள்' : 'Machinery Fleet'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

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

        {/* Search & Filters Container */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8 space-y-4">
          
          {/* Top Row: Search Box + Government Level Tabs */}
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

          {/* Bottom Row: Category Filter Pills */}
          <div className="pt-3 border-t border-slate-100">
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
                {translations.schemes.noSchemesDescription}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGovLevel('All');
                  setSelectedCategory('All');
                }}
                className="mt-4 btn-secondary text-xs py-2 px-4"
              >
                {translations.common.clearFilters}
              </button>
            </div>
          ) : (
            /* Schemes Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSchemes.map((scheme) => {
                const isState = scheme.government_level === 'state';

                return (
                  <div
                    key={scheme.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-agri-300 transition-all flex flex-col justify-between h-full min-w-0 overflow-hidden break-words group"
                  >
                    <div>
                      {/* Badges: Government Level & Category */}
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

                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          {isTa ? 'அரசு திட்டம்' : 'Official Active'}
                        </span>
                      </div>

                      {/* Scheme Name */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-agri-700 transition-colors leading-snug break-words">
                        {scheme.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed line-clamp-3 break-words">
                        {scheme.description}
                      </p>

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

                      {/* Official Source Attribution */}
                      {scheme.source && (
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 gap-2">
                          <span className="truncate max-w-[240px]">
                            <strong>{isTa ? 'ஆதாரம்:' : 'Source:'}</strong> {scheme.source}
                          </span>
                          {scheme.last_verified_at && (
                            <span className="shrink-0 text-slate-400 text-[10px]">
                              {scheme.last_verified_at}
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

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-snug break-words">
              {selectedSchemeForModal.name}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed break-words">
              {selectedSchemeForModal.description}
            </p>

            <div className="space-y-3.5 bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-900 block mb-0.5">{translations.schemes.eligibility}</span>
                <p className="text-slate-600 leading-relaxed break-words">{selectedSchemeForModal.eligibility}</p>
              </div>

              <div>
                <span className="font-bold text-emerald-800 block mb-0.5">{translations.schemes.benefits}</span>
                <p className="text-emerald-700 font-medium leading-relaxed break-words">{selectedSchemeForModal.benefits}</p>
              </div>

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
