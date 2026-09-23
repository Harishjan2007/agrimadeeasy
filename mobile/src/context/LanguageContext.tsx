import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => translations.en[key] || String(key)
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem('agrime_language').then((stored) => {
      if (stored === 'en' || stored === 'ta') {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem('agrime_language', lang).catch(() => {});
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
