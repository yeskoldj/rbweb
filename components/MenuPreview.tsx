
'use client';

import Link from 'next/link';
import { useLanguage } from '../lib/languageContext';
import { showCartNotification } from '../lib/cartNotification';
import { useAuth } from '../lib/authContext';

export default function MenuPreview() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Productos destacados usando SOLO las imágenes reales del menú
  const featuredItems = [
    {
      id: 1,
      name: 'Tres Leches en Vaso',
      price: '$5.00',
      description: 'Tradicional tres leches dominicano servido en vaso',
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/6e38ec235b30b7a74f673bc044a87814.jfif',
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 2,
      name: 'Flan',
      price: '$4.00',
      description: 'Cremoso flan casero dominicano con caramelo',
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/33b32b1e5581c150ed0666763a12e667.jfif',
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 3,
      name: 'Cheesecake',
      price: '$5.00',
      description: 'Cremoso cheesecake estilo dominicano',
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/ae1f7420251af709ef833638a428a131.jfif',
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 4,
      name: 'Cake de Cumpleaños',
      price: 'Desde $20.00',
      description: 'Cake personalizado con decoración especial',
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/58a3f870af7fe55c1b2733bc57137538.png',
      category: 'cake',
      type: 'cake',
      cakeId: 'birthday-classic'
    },
    {
      id: 5,
      name: 'Mini Pasteles',
      price: '$2.50',
      description: 'Pequeños pasteles dominicanos con frutas variadas',
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/7735a4789459e5d2fb59e816d88b8891.jfif',
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 6,
      name: 'Tres Leches de Oreo',
      price: '$5.00',
      description: 'Nuestra versión especial dominicana con galletas Oreo',
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/3426923c2c21bd56dac155cac89400e3.jfif',
      category: 'dessert',
      type: 'dessert'
    }
  ];

  const handleAddToCart = (item: any) => {
    // Verificar autenticación primero
    if (!user) {
      alert('Necesitas crear una cuenta para agregar productos al carrito');
      return;
    }

    // Si es un pastel, redirigir al personalizador
    if (item.type === 'cake') {
      window.location.href = `/cakes/${item.cakeId || 'birthday-classic'}`;
      return;
    }

    // Para otros productos, agregar al carrito normalmente
    const cartItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      type: item.type
    };
    
    try {
      const existingCart = localStorage.getItem('bakery-cart');
      let cart = existingCart ? JSON.parse(existingCart) : [];
      
      const existingItemIndex = cart.findIndex((cartItem: any) => cartItem.name === item.name && cartItem.type === item.type);
      
      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
      } else {
        cart.push(cartItem);
      }
      
      localStorage.setItem('bakery-cart', JSON.stringify(cart));
      
      // Mostrar confirmación con animación consistente
      showCartNotification(`${item.name} agregado al carrito`);
      
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      alert('Error al agregar al carrito. Intenta de nuevo.');
    }
  };

  return (
    <section className="px-4 py-8">
      <h3 className="text-2xl font-bold text-amber-800 mb-6 text-center">
        {t('featuredProducts')}
      </h3>
      
      <div className="space-y-4 mb-6" data-product-shop>
        {featuredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex space-x-4" data-product-shop>
            <div className="w-20 h-20 flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
                onError={(e) => {
                  console.error(`Error cargando imagen para ${item.name}:`, item.image);
                  e.currentTarget.src = 'https://via.placeholder.com/80x80/f3f4f6/9ca3af?text=Imagen+No+Disponible';
                }}
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">{item.name}</h4>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-pink-600">{item.price}</span>
                <button 
                  className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:shadow-md transition-all"
                  onClick={() => handleAddToCart(item)}
                >
                  {item.type === 'cake' ? 'Personalizar' : t('addToCart')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <Link 
          href="/menu"
          className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-md transition-all inline-block text-sm"
        >
          {t('seeFullMenu')}
        </Link>
      </div>
    </section>
  );
}
