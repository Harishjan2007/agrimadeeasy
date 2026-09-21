'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, Translations } from './types';
import { en } from './en';
import { ta } from './ta';

const translationsMap: Record<Language, Translations> = {
  en,
  ta
};

const STORAGE_KEY = 'agrime_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Translations;
  t: (keyPath: string, fallback?: string) => string;
  translateCrop: (cropName?: string) => string;
  translateMachineryType: (type?: string) => string;
  translateBookingStatus: (status?: string) => string;
  translateRole: (role?: string) => string;
  translateTrend: (trend?: string) => string;
  translateCategory: (category?: string) => string;
  translateGovLevel: (level?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language;
      if (savedLang && (savedLang === 'en' || savedLang === 'ta')) {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
      } else {
        document.documentElement.lang = 'en';
      }
    } catch {
      // localStorage may not be available in some private modes
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore storage errors
    }
  }, []);

  const currentTranslations = translationsMap[language] || en;

  /**
   * Helper to resolve nested keys like 'nav.cropPrices' or 'home.heroTitlePrefix'
   */
  const t = useCallback((keyPath: string, fallback?: string): string => {
    if (!keyPath) return fallback || '';
    
    const parts = keyPath.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = currentTranslations;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let enCurrent: any = en;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = undefined;
        break;
      }
    }

    if (typeof current === 'string') {
      return current;
    }

    // Fallback to English
    for (const part of parts) {
      if (enCurrent && typeof enCurrent === 'object' && part in enCurrent) {
        enCurrent = enCurrent[part];
      } else {
        enCurrent = undefined;
        break;
      }
    }

    if (typeof enCurrent === 'string') {
      return enCurrent;
    }

    return fallback || keyPath;
  }, [currentTranslations]);

  /**
   * Translates crop names for UI display while keeping underlying DB values unchanged
   */
  const translateCrop = useCallback((cropName?: string): string => {
    if (!cropName) return '';
    if (language === 'en') return cropName;

    const lower = cropName.toLowerCase().trim();
    if (lower.includes('paddy') || lower.includes('rice') || lower.includes('samba') || lower.includes('basmati')) return 'நெல்';
    if (lower.includes('groundnut') || lower.includes('peanut')) return 'நிலக்கடலை';
    if (lower.includes('maize') || lower.includes('corn')) return 'மக்காச்சோளம்';
    if (lower.includes('cotton')) return 'பருத்தி';
    if (lower.includes('tomato')) return 'தக்காளி';
    if (lower.includes('onion')) return 'வெங்காயம்';
    if (lower.includes('sugarcane')) return 'கரும்பு';
    if (lower.includes('turmeric')) return 'மஞ்சள்';
    if (lower.includes('banana')) return 'வாழை';
    if (lower.includes('wheat') || lower.includes('sharbati')) return 'கோதுமை';
    if (lower.includes('soybean') || lower.includes('soya')) return 'சோயாபீன்';
    if (lower.includes('chilli') || lower.includes('mirchi')) return 'மிளகாய்';
    if (lower.includes('potato')) return 'உருளைக்கிழங்கு';
    if (lower.includes('coconut')) return 'தேங்காய்';

    return cropName;
  }, [language]);

  /**
   * Translates farm machinery types
   */
  const translateMachineryType = useCallback((type?: string): string => {
    if (!type) return '';
    if (language === 'en') {
      const formatted = type.replace(/_/g, ' ');
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    const lower = type.toLowerCase().trim();
    if (lower.includes('tractor')) return 'டிராக்டர்';
    if (lower.includes('harvester') || lower.includes('paddy_harvester') || lower.includes('combine')) return 'நெல் அறுவடை இயந்திரம்';
    if (lower.includes('power_tiller') || lower.includes('tiller')) return 'பவர் டில்லர்';
    if (lower.includes('rotavator')) return 'ரோட்டவேட்டர்';
    if (lower.includes('cultivator')) return 'கல்டிவேட்டர்';
    if (lower.includes('other')) return 'பிற விவசாய உபகரணங்கள்';

    return type;
  }, [language]);

  /**
   * Translates machinery booking statuses
   */
  const translateBookingStatus = useCallback((status?: string): string => {
    if (!status) return '';
    if (language === 'en') {
      switch (status.toLowerCase()) {
        case 'pending': return 'Pending';
        case 'accepted': return 'Accepted';
        case 'rejected': return 'Rejected';
        case 'completed': return 'Completed';
        case 'cancelled': return 'Cancelled';
        default: return status;
      }
    }

    switch (status.toLowerCase()) {
      case 'pending': return 'நிலுவையில்';
      case 'accepted': return 'ஏற்கப்பட்டது';
      case 'rejected': return 'நிராகரிக்கப்பட்டது';
      case 'completed': return 'நிறைவு';
      case 'cancelled': return 'ரத்து செய்யப்பட்டது';
      default: return status;
    }
  }, [language]);

  /**
   * Translates user roles
   */
  const translateRole = useCallback((role?: string): string => {
    if (!role) return '';
    if (language === 'en') {
      switch (role.toLowerCase()) {
        case 'farmer': return 'Farmer';
        case 'dealer': return 'Dealer';
        case 'machinery_provider': return 'Machinery Provider';
        default: return role;
      }
    }

    switch (role.toLowerCase()) {
      case 'farmer': return 'விவசாயி';
      case 'dealer': return 'வியாபாரி';
      case 'machinery_provider': return 'இயந்திர உரிமையாளர்';
      default: return role;
    }
  }, [language]);

  /**
   * Translates price trends
   */
  const translateTrend = useCallback((trend?: string): string => {
    if (!trend) return '';
    if (language === 'en') {
      switch (trend.toLowerCase()) {
        case 'increasing': return 'Increasing';
        case 'decreasing': return 'Decreasing';
        case 'stable': return 'Stable';
        default: return trend;
      }
    }

    switch (trend.toLowerCase()) {
      case 'increasing': return 'உயர்கிறது';
      case 'decreasing': return 'குறைகிறது';
      case 'stable': return 'நிலையானது';
      default: return trend;
    }
  }, [language]);

  /**
   * Translates scheme and crop categories
   */
  const translateCategory = useCallback((category?: string): string => {
    if (!category) return '';
    if (language === 'en') return category;

    switch (category) {
      case 'All': return 'அனைத்தும்';
      case 'Direct Income Support': return 'நேரடி வருமான ஆதரவு';
      case 'Machinery Subsidy': return 'இயந்திர மானியம்';
      case 'Crop Insurance': return 'பயிர் காப்பீடு';
      case 'Credit & Loans': return 'கடன் மற்றும் நிதி';
      case 'Irrigation': return 'பாசன வசதி';
      case 'Organic/Natural Farming': return 'இயற்கை விவசாயம்';
      case 'Infrastructure': return 'கட்டமைப்பு வசதிகள்';
      case 'Seeds & Planting Material': return 'விதைகள் & நடவு';
      case 'Soil Health': return 'மண் வளம்';
      case 'Horticulture': return 'தோட்டக்கலை';
      case 'Farmer Organizations': return 'உழவர் அமைப்புகள்';
      case 'Marketing': return 'சந்தைப்படுத்துதல்';
      case 'Cereals': return 'தானியங்கள்';
      case 'Oilseeds': return 'எண்ணெய் வித்துக்கள்';
      case 'Vegetables': return 'காய்கறிகள்';
      case 'Commercial': return 'பணப்பயிர்கள்';
      case 'Fiber': return 'நார்ப்பயிர்கள்';
      case 'Spices': return 'மசாலா பயிர்கள்';
      case 'Fruits': return 'பழங்கள்';
      default: return category;
    }
  }, [language]);

  /**
   * Translates government levels
   */
  const translateGovLevel = useCallback((level?: string): string => {
    if (!level) return '';
    if (language === 'en') {
      if (level === 'All') return 'All Schemes';
      if (level === 'central') return 'Central Government';
      if (level === 'state') return 'Tamil Nadu Government';
      return level;
    }

    if (level === 'All') return 'அனைத்து திட்டங்கள்';
    if (level === 'central') return 'மத்திய அரசு திட்டங்கள்';
    if (level === 'state') return 'தமிழ்நாடு அரசு திட்டங்கள்';
    return level;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        translations: currentTranslations,
        t,
        translateCrop,
        translateMachineryType,
        translateBookingStatus,
        translateRole,
        translateTrend,
        translateCategory,
        translateGovLevel
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      translations: en,
      t: (path: string, fb?: string) => fb || path,
      translateCrop: (c?: string) => c || '',
      translateMachineryType: (m?: string) => m || '',
      translateBookingStatus: (s?: string) => s || '',
      translateRole: (r?: string) => r || '',
      translateTrend: (t?: string) => t || '',
      translateCategory: (cat?: string) => cat || '',
      translateGovLevel: (l?: string) => l || ''
    };
  }
  return context;
}
