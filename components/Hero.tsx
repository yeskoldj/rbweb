
'use client';

import Link from 'next/link';
import { useLanguage } from '../lib/languageContext';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="px-4 py-12 text-center">
      <div className="max-w-sm mx-auto">
        {/* 
        🖼️ CÓMO CAMBIAR LA IMAGEN PRINCIPAL DEL HERO:
        1. Reemplaza la URL en src="" con tu nueva imagen
        2. Mantén las dimensiones w-full h-48 para consistencia
        3. Asegúrate que sea una imagen de alta calidad (mínimo 400x300px)
        4. Formatos recomendados: .jpg, .jpeg, .png, .webp
        5. Tamaño recomendado: 400x200px para mejor rendimiento
        */}
        <img 
          src="https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/7dcef81fde0fb6f04a4c79a29f1041e7.jfif"
          alt="Artisanal Cakes"
          className="w-full h-48 object-cover rounded-2xl shadow-xl mb-6"
        />
        
        {/* 
        📝 CÓMO CAMBIAR LOS TEXTOS PRINCIPALES:
        1. Cambia "Repostería Dominicana" por el nombre de tu panadería
        2. Modifica "Hechas con amor para tus momentos especiales" por tu slogan
        3. O edita las traducciones en lib/languages.ts para cambiar automáticamente
        */}
        <h2 className="text-3xl font-bold text-gray-800 mb-3">{t('bakeryName')}</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">{t('heroTagline')}</p>
        
        <Link 
          href="/menu"
          className="inline-block bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm"
        >
          {t('viewMenu')}
        </Link>
      </div>
    </section>
  );
}
