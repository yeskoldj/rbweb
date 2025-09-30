
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTranslation } from './languages';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedLang = window.localStorage.getItem('bakery-language');
      if (savedLang) {
        return savedLang;
      }
    }
    return 'es';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedLang = window.localStorage.getItem('bakery-language');
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bakery-language', lang);
    }
  };

  const t = (key: string) => getTranslation(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
