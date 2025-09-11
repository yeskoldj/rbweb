
'use client';

import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import MenuSection from './MenuSection';
import Link from 'next/link';
import { useState } from 'react';
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
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = [
    'Todos',
    'Postres Clásicos',
    'Especialidades',
    'Tropicales',
    'Pequeños Placeres',
    'Únicos'
  ];

  const menuItems = [
    {
      category: 'Postres Clásicos',
      items: [
        {
          name: 'Gelatina',
          price: '$3.00',
          description: 'Refrescante gelatina dominicana con varios sabores',
          image: gelatinaImg.src
        },
        {
          name: 'Flan',
          price: '$4.00',
          description: 'Cremoso flan casero dominicano con caramelo',
          image: flanImg.src
        },
        {
          name: 'Budín de Pan',
          price: '$3.50',
          description: 'Delicioso budín de pan dominicano con canela',
          image: budinPanImg.src
        }
      ]
    },
    {
      category: 'Especialidades de la Casa',
      items: [
        {
          name: 'Cheesecake',
          price: '$5.00',
          description: 'Cremoso cheesecake estilo dominicano',
          image: cheesecakeImg.src
        },
        {
          name: 'Tres Leches en Vaso',
          price: '$5.00',
          description: 'Tradicional tres leches dominicano servido en vaso',
          image: tresLechesVasoImg.src
        },
        {
          name: 'Tres Leches de Oreo',
          price: '$5.00',
          description: 'Nuestra versión especial dominicana con galletas Oreo',
          image: tresLechesOreoImg.src
        },
        {
          name: 'Rebanada de Dulce de Leche',
          price: '$5.00',
          description: 'Irresistible dulce de leche casero dominicano',
          image: dulceLecheImg.src
        },
        {
          name: 'Rebanada de Torta de Piña',
          price: '$5.00',
          description: 'Esponjosa torta dominicana con piña fresca',
          image: tortaPinaImg.src
        }
      ]
    },
    {
      category: 'Productos Tropicales',
      items: [
        {
          name: 'Coco-Piña',
          price: '$5.00',
          description: 'Exótica combinación dominicana de coco y piña',
          image: cocoPinaImg.src
        },
        {
          name: 'Macarrón de Coco',
          price: '$1.50',
          description: 'Tradicional dulce dominicano de coco',
          image: macarronCocoImg.src
        },
        {
          name: 'Torta de Guayaba',
          price: '$2.50',
          description: 'Suave torta dominicana con relleno de guayaba',
          image: tortaGuayabaImg.src
        }
      ]
    },
    {
      category: 'Pequeños Placeres',
      items: [
        {
          name: 'Mantecaditos',
          price: '$1.50',
          description: 'Tradicionales mantecaditos dominicanos',
          image: mantecaditosImg.src
        },
        {
          name: 'Donas',
          price: '$1.50',
          description: 'Frescas y esponjosas donas dominicanas',
          image: donasImg.src
        },
        {
          name: 'Donas Azucaradas',
          price: '$1.50',
          description: 'Donas dominicanas espolvoreadas con azúcar',
          image: donasAzucaradasImg.src
        },
        {
          name: 'Galletas',
          price: '$3.00 por 2',
          description: 'Deliciosas galletas caseras dominicanas (2 piezas)',
          image: galletasImg.src
        },
        {
          name: 'Croissant',
          price: '$1.50',
          description: 'Croissant recién horneado estilo dominicano',
          image: croissantImg.src
        }
      ]
    },
    {
      category: 'Especialidades Únicas',
      items: [
        {
          name: 'Mini Pasteles',
          price: '$2.50',
          description: 'Pequeños pasteles dominicanos con frutas variadas',
          image: miniPastelesImg.src
        },
        {
          name: 'Pastelito',
          price: '$2.00',
          description: 'Tradicional dulce dominicano frito',
          image: pastelitoImg.src
        },
        {
          name: 'Torticas de Chocolate',
          price: '$2.00',
          description: 'Crujientes torticas dominicanas bañadas en chocolate',
          image: torticasChocolateImg.src
        },
        {
          name: 'Mini Cannolis',
          price: '$1.50',
          description: 'Mini cannolis dominicanos rellenos de crema',
          image: miniCannolisImg.src
        }
      ]
    }
  ];

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'Especialidades de la Casa': 'Especialidades',
      'Productos Tropicales': 'Tropicales',
      'Especialidades Únicas': 'Únicos'
    };
    return categoryMap[category] || category;
  };

  const filteredMenuItems = selectedCategory === 'Todos' 
    ? menuItems 
    : menuItems.filter(section => getCategoryDisplayName(section.category) === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-16 pb-20">
        <div className="px-3 py-4">
          <h1 className="text-2xl font-bold text-amber-800 text-center mb-1">
            Nuestro Menú
          </h1>
          <p className="text-gray-600 text-center mb-6 text-sm">
            Delicias dominicanas hechas con amor para ti
          </p>

          {/* Category Filter */}
          <div className="mb-6 bg-white rounded-xl p-3 shadow-sm">
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-pink-400 to-teal-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filteredMenuItems.map((section, index) => (
            <MenuSection 
              key={index}
              category={section.category}
              items={section.items}
            />
          ))}

          <div className="mt-6 bg-gradient-to-r from-pink-400 to-teal-400 rounded-xl p-5 text-white text-center mx-2">
            <h3 className="text-lg font-semibold mb-2">¿Listo para ordenar?</h3>
            <p className="text-sm opacity-90 mb-4">
              Haz tu pedido y lo tendremos listo para ti
            </p>
            <Link href="/order">
              <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-full font-medium !rounded-button">
                Hacer Pedido
              </button>
            </Link>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
