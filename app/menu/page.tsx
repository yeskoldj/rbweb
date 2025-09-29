
'use client';

import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import MenuSection from './MenuSection';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '../../lib/languageContext';
import gelatinaImg from '../../images/gelatina.jpeg';
import flanImg from '../../images/flan.jpeg';
import budinPanImg from '../../images/pudin de pan.jpeg';
import cheesecakeImg from '../../images/Cheesecake .jpeg';
import tresLechesVasoImg from '../../images/Vasito de tres leches.jpeg';
import tresLechesOreoImg from '../../images/Tres leches de Oreo.jpeg';
import dulceLecheImg from '../../images/pedazo de dulce de leche.jpeg';
import tortaPinaImg from '../../images/pedazo de pina.jpeg';
import cocoPinaImg from '../../images/Coco-pina.jpeg';
import macarronCocoImg from '../../images/Coco-macarrón.jpeg';
import tortaGuayabaImg from '../../images/guava.jpeg';
import mantecaditosImg from '../../images/Mantecados.jpeg';
import donasImg from '../../images/Donas .jpeg';
import donasAzucaradasImg from '../../images/Donas azucaradas.jpeg';
import galletasImg from '../../images/Cookies .jpeg';
import croissantImg from '../../images/Croissant.jpeg';
import miniPastelesImg from '../../images/Minipies  (2).jpeg';
import pastelitoImg from '../../images/milojas.jpeg';
import torticasChocolateImg from '../../images/Coques de chocolate.jpeg';
import miniCannolisImg from '../../images/Cannolis.jpeg';


export default function MenuPage() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: t('menuCategoryAll') },
    { id: 'classics', label: t('menuCategoryClassics') },
    { id: 'specialties', label: t('menuCategorySpecialties') },
    { id: 'tropical', label: t('menuCategoryTropical') },
    { id: 'smallDelights', label: t('menuCategorySmallDelights') },
    { id: 'unique', label: t('menuCategoryUnique') }
  ];

  const menuItems = [
    {
      categoryId: 'classics',
      title: t('menuCategoryClassics'),
      items: [
        {
          name: 'Gelatina',
          price: '$3.00',
          image: gelatinaImg.src
        },
        {
          name: 'Flan',
          price: '$4.00',
          image: flanImg.src
        },
        {
          name: 'Budín de Pan',
          price: '$3.50',
          image: budinPanImg.src
        }
      ]
    },
    {
      categoryId: 'specialties',
      title: t('menuCategorySpecialties'),
      items: [
        {
          name: 'Cheesecake',
          price: '$5.00',
          image: cheesecakeImg.src
        },
        {
          name: 'Tres Leches en Vaso',
          price: '$5.00',
          image: tresLechesVasoImg.src
        },
        {
          name: 'Tres Leches de Oreo',
          price: '$5.00',
          image: tresLechesOreoImg.src
        },
        {
          name: 'Rebanada de Dulce de Leche',
          price: '$5.00',
          image: dulceLecheImg.src
        },
        {
          name: 'Rebanada de Torta de Piña',
          price: '$5.00',
          image: tortaPinaImg.src
        }
      ]
    },
    {
      categoryId: 'tropical',
      title: t('menuCategoryTropical'),
      items: [
        {
          name: 'Coco-Piña',
          price: '$5.00',
          image: cocoPinaImg.src
        },
        {
          name: 'Macarrón de Coco',
          price: '$1.50',
          image: macarronCocoImg.src
        },
        {
          name: 'Torta de Guayaba',
          price: '$2.50',
          image: tortaGuayabaImg.src
        }
      ]
    },
    {
      categoryId: 'smallDelights',
      title: t('menuCategorySmallDelights'),
      items: [
        {
          name: 'Mantecaditos',
          price: '$1.50',
          image: mantecaditosImg.src
        },
        {
          name: 'Donas',
          price: '$1.50',
          image: donasImg.src
        },
        {
          name: 'Donas Azucaradas',
          price: '$1.50',
          image: donasAzucaradasImg.src
        },
        {
          name: 'Galletas',
          price: '$3.00 por 2',
          image: galletasImg.src
        },
        {
          name: 'Croissant',
          price: '$1.50',
          image: croissantImg.src
        }
      ]
    },
    {
      categoryId: 'unique',
      title: t('menuCategoryUnique'),
      items: [
        {
          name: 'Mini Pasteles',
          price: '$2.50',
          image: miniPastelesImg.src
        },
        {
          name: 'Pastelito',
          price: '$2.00',
          image: pastelitoImg.src
        },
        {
          name: 'Torticas de Chocolate',
          price: '$2.00',
          image: torticasChocolateImg.src
        },
        {
          name: 'Mini Cannolis',
          price: '$1.50',
          image: miniCannolisImg.src
        }
      ]
    }
  ];

  const filteredMenuItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(section => section.categoryId === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-16 pb-20">
        <div className="px-3 py-4">
          <h1 className="text-2xl font-bold text-amber-800 text-center mb-1">
            {t('menuTitle')}
          </h1>
          <p className="text-gray-600 text-center mb-6 text-sm">
            {t('menuSubtitle')}
          </p>

          {/* Category Filter */}
          <div className="mb-6 bg-white rounded-xl p-3 shadow-sm">
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-pink-400 to-teal-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {filteredMenuItems.map((section, index) => (
            <MenuSection
              key={index}
              category={section.title}
              items={section.items}
            />
          ))}

          <div className="mt-6 bg-gradient-to-r from-pink-400 to-teal-400 rounded-xl p-5 text-white text-center mx-2">
            <h3 className="text-lg font-semibold mb-2">{t('menuReadyToOrder')}</h3>
            <p className="text-sm opacity-90 mb-4">
              {t('menuReadyDescription')}
            </p>
            <Link href="/order">
              <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-full font-medium !rounded-button">
                {t('menuOrderButton')}
              </button>
            </Link>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
