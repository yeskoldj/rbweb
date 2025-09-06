
'use client';

import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import MenuSection from './MenuSection';
import Link from 'next/link';
import { useState } from 'react';

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
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/8b087faf777467ea84912f8ce9dbd910.jfif'
        },
        {
          name: 'Flan',
          price: '$4.00',
          description: 'Cremoso flan casero dominicano con caramelo',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/33b32b1e5581c150ed0666763a12e667.jfif'
        },
        {
          name: 'Budín de Pan',
          price: '$3.50',
          description: 'Delicioso budín de pan dominicano con canela',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/32190ca7e0256b2ebde72b06d31c8bfe.jfif'
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
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/ae1f7420251af709ef833638a428a131.jfif'
        },
        {
          name: 'Tres Leches en Vaso',
          price: '$5.00',
          description: 'Tradicional tres leches dominicano servido en vaso',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/6e38ec235b30b7a74f673bc044a87814.jfif'
        },
        {
          name: 'Tres Leches de Oreo',
          price: '$5.00',
          description: 'Nuestra versión especial dominicana con galletas Oreo',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/3426923c2c21bd56dac155cac89400e3.jfif'
        },
        {
          name: 'Rebanada de Dulce de Leche',
          price: '$5.00',
          description: 'Irresistible dulce de leche casero dominicano',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/ef59cdd1e0abad6171a10336d1f70225.jfif'
        },
        {
          name: 'Rebanada de Torta de Piña',
          price: '$5.00',
          description: 'Esponjosa torta dominicana con piña fresca',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/34353a9602bc518f26acc774405af973.jfif'
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
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/d1d7489f06b811bdb14df7faafd600ef.jfif'
        },
        {
          name: 'Macarrón de Coco',
          price: '$1.50',
          description: 'Tradicional dulce dominicano de coco',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/bd128c537815191cc9bf8a83bca612b1.jfif'
        },
        {
          name: 'Torta de Guayaba',
          price: '$2.50',
          description: 'Suave torta dominicana con relleno de guayaba',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/acac987e086a4623b9a753d011b55659.jfif'
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
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/31560721f3fb92a8f930f1202dd2e756.jfif'
        },
        {
          name: 'Donas',
          price: '$1.50',
          description: 'Frescas y esponjosas donas dominicanas',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/8ac7bffab2dab6b49eac41502ce2ae2b.jfif'
        },
        {
          name: 'Donas Azucaradas',
          price: '$1.50',
          description: 'Donas dominicanas espolvoreadas con azúcar',
          image: 'https://readdy.ai/api/search-image?query=Sugar%20dusted%20donuts%2C%20powdered%20sugar%20coating%2C%20fluffy%20texture%2C%20golden%20brown%20pastry%2C%20classic%20bakery%20style%2C%20professional%20food%20photography%2C%20clean%20background%2C%20sweet%20and%20appetizing&width=300&height=200&seq=sugardonuts1&orientation=landscape'
        },
        {
          name: 'Galletas',
          price: '$3.00 por 2',
          description: 'Deliciosas galletas caseras dominicanas (2 piezas)',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/83853228165933c96ae80d16559b9327.jfif'
        },
        {
          name: 'Croissant',
          price: '$1.50',
          description: 'Croissant recién horneado estilo dominicano',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/bef9a337971f54e9a942dc89fc245483.jfif'
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
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/7735a4789459e5d2fb59e816d88b8891.jfif'
        },
        {
          name: 'Pastelito',
          price: '$2.00',
          description: 'Tradicional dulce dominicano frito',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/e2a3668e14c620df0cf676eecf3cfd36.jfif'
        },
        {
          name: 'Torticas de Chocolate',
          price: '$2.00',
          description: 'Crujientes torticas dominicanas bañadas en chocolate',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/e78f5db8162f6fcd85c5ce0c9d0eabba.jfif'
        },
        {
          name: 'Mini Cannolis',
          price: '$1.50',
          description: 'Mini cannolis dominicanos rellenos de crema',
          image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/094a75783dbe3a26c72d24523c4c375a.jfif'
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
