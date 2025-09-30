
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTranslation } from './languages';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('es');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const savedLang = window.localStorage.getItem('bakery-language');
      if (savedLang) {
        setLanguageState(savedLang);
      }
    } catch (error) {
      console.warn('Unable to read saved language preference', error);
    }
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);

    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem('bakery-language', lang);
    } catch (error) {
      console.warn('Unable to persist language preference', error);
    }
  }, []);

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
