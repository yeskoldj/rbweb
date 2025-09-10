
'use client';

import Link from 'next/link';
import { useLanguage } from '../lib/languageContext';
import LanguageSelector from './LanguageSelector';
import { useAuth } from '../lib/authContext';

export default function Header() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const isOwnerOrEmployee = () => {
    return user && (user.role === 'employee' || user.role === 'owner' || user.isOwner);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <header className="fixed top-0 w-full bg-gradient-to-r from-amber-700 to-amber-800 backdrop-blur-sm border-b border-amber-900 z-50 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full p-1 shadow-md">
            <img 
              src="https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/3c3401df8a967b2c425ed28b75bf5296.png"
              alt="Ranger's Bakery Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1 className="font-[('Pacifico')] text-xl text-white drop-shadow-sm">{t('bakeryName')}</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <LanguageSelector />
          
          <a 
            href="https://www.instagram.com/rangersbakery/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center"
          >
            <i className="ri-instagram-line text-white text-xl drop-shadow-sm"></i>
          </a>
          
          {isOwnerOrEmployee() && (
            <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center">
              <i className="ri-dashboard-line text-white text-xl drop-shadow-sm"></i>
            </Link>
          )}
          
          {isAuthenticated() ? (
            <Link href="/profile" className="w-10 h-10 flex items-center justify-center">
              <i className="ri-user-line text-white text-xl drop-shadow-sm"></i>
            </Link>
          ) : (
            <Link href="/auth" className="w-10 h-10 flex items-center justify-center">
              <i className="ri-login-circle-line text-white text-xl drop-shadow-sm"></i>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
