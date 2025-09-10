
'use client';

import { useState } from 'react';
import { useLanguage } from '../lib/languageContext';
import { languages } from '../lib/languages';

interface LanguageSelectorProps {
  showWelcome?: boolean;
  onComplete?: () => void;
}

export default function LanguageSelector({ showWelcome = false, onComplete }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode);
    setShowDropdown(false);
    if (showWelcome && onComplete) {
      onComplete();
    }
  };

  if (showWelcome) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img
              src="https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/3c3401df8a967b2c425ed28b75bf5296.png"
              alt="Ranger&apos;s Bakery Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          
          <h2 className="text-xl font-bold text-amber-800 mb-2">
            Welcome to Ranger&apos;s Bakery
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Please select your preferred language / Por favor selecciona tu idioma preferido
          </p>
          
          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-colors"
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium text-gray-800">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-10 h-10 flex items-center justify-center"
      >
        <i className="ri-global-line text-white text-xl drop-shadow-sm"></i>
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[120px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 ${
                language === lang.code ? 'bg-pink-50 text-pink-600' : 'text-gray-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
