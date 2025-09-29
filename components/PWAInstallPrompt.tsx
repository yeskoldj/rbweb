
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/languageContext';
import SafeImage from './SafeImage';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('pwa-install-seen');
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-install-seen', 'true');
      }
      
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-seen', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-gradient-to-r from-pink-500 to-teal-500 rounded-xl p-4 shadow-lg z-40">
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full flex-shrink-0">
          <div className="relative w-10 h-10">
            <SafeImage
              src="https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/3c3401df8a967b2c425ed28b75bf5296.png"
              alt="App Icon"
              fill
              className="object-contain"
              sizes="40px"
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm mb-1">
            {t('installApp')}
          </h3>
          <p className="text-white/90 text-xs mb-3">
            {t('installDescription')}
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={handleInstall}
              className="bg-white text-pink-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100"
            >
              {t('installButton')}
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/90 px-3 py-1.5 text-xs hover:text-white"
            >
              {t('installLater')}
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="w-6 h-6 flex items-center justify-center text-white/80 hover:text-white flex-shrink-0"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>
    </div>
  );
}
