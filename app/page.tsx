
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/languageContext';
import Header from '../components/Header';
import Hero from '../components/Hero';
import MenuPreview from '../components/MenuPreview';
import Gallery from '../components/Gallery';
import Reviews from '../components/Reviews';
import Contact from '../components/Contact';
import TabBar from '../components/TabBar';
import LanguageSelector from '../components/LanguageSelector';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

export default function Home() {
  const [showLanguageWelcome, setShowLanguageWelcome] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const hasSelectedLanguage = localStorage.getItem('bakery-language');
    if (!hasSelectedLanguage) {
      setShowLanguageWelcome(true);
    }
  }, []);

  const handleLanguageComplete = () => {
    setShowLanguageWelcome(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      
      {showLanguageWelcome && (
        <LanguageSelector 
          showWelcome={true} 
          onComplete={handleLanguageComplete}
        />
      )}
      
      <main className="pt-16 pb-16">
        <Hero />
        <MenuPreview />
        <Gallery />
        <Reviews />
        <Contact />
      </main>
      
      <PWAInstallPrompt />
      <TabBar />
    </div>
  );
}
