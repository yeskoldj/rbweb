
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/languageContext';
import LanguageSelector from './LanguageSelector';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [localUser, setLocalUser] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    checkUser();
    checkLocalUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setUser(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        checkUserRole(user.id);
      }
    } catch (error) {
      console.log('Supabase auth check failed, using local storage');
    }
  };

  const checkLocalUser = () => {
    const userData = localStorage.getItem('bakery-user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setLocalUser(parsedUser);
      } catch (error) {
        console.log('Error parsing local user data');
      }
    }
  };

  const checkUserRole = async (userId: string) => {
    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setUser(userData);
    } catch (error) {
      console.log('Error fetching user role from Supabase');
    }
  };

  const isOwnerOrEmployee = () => {
    if (user && (user.role === 'employee' || user.role === 'owner')) {
      return true;
    }
    if (localUser && localUser.isOwner) {
      return true;
    }
    return false;
  };

  const isAuthenticated = () => {
    return user || localUser;
  };

  return (
    <header className="fixed top-0 w-full bg-gradient-to-r from-amber-700 to-amber-800 backdrop-blur-sm border-b border-amber-900 z-50 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full p-1 shadow-md">
            {/* 
            🖼️ CAMBIAR LOGO:
            - Reemplaza la URL en src="" con tu logo
            - Mantén las dimensiones w-10 h-10 para consistencia
            - Asegúrate que sea un archivo PNG con fondo transparente
            - Recomendación: 200x200px mínimo
            */}
            <img 
              src="https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/3c3401df8a967b2c425ed28b75bf5296.png"
              alt="Ranger's Bakery Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          {/* 
          📝 CAMBIAR NOMBRE DE LA PANADERÍA:
          - El texto se cambia automáticamente desde lib/languages.ts
          - O puedes cambiarlo directamente aquí reemplazando {t('bakeryName')}
          */}
          <h1 className="font-[('Pacifico')] text-xl text-white drop-shadow-sm">{t('bakeryName')}</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <LanguageSelector />
          
          {/* 
          🔗 CAMBIAR ENLACE DE INSTAGRAM:
          Reemplaza "https://www.instagram.com/rangersbakery/" con tu cuenta
          */}
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
