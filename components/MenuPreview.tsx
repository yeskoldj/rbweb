
'use client';

import Link from 'next/link';
import { useLanguage } from '../lib/languageContext';
import { getUser } from '../lib/authStorage';
import { showCartNotification } from '../lib/cartNotification';
import tresLechesVasoImg from '../images/Vasito de tres leches.jpeg';
import flanImg from '../images/flan.jpeg';
import cheesecakeImg from '../images/Cheesecake .jpeg';
import miniPastelesImg from '../images/Minipies  (2).jpeg';
import tresLechesOreoImg from '../images/Tres leches de Oreo.jpeg';

export default function MenuPreview() {
  const { t } = useLanguage();

  // Productos destacados usando SOLO las imágenes reales del menú
  const featuredItems = [
    {
      id: 1,
      name: 'Tres Leches en Vaso',
      price: '$5.00',
      description: 'Tradicional tres leches dominicano servido en vaso',
      image: tresLechesVasoImg.src,
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 2,
      name: 'Flan',
      price: '$4.00',
      description: 'Cremoso flan casero dominicano con caramelo',
      image: flanImg.src,
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 3,
      name: 'Cheesecake',
      price: '$5.00',
      description: 'Cremoso cheesecake estilo dominicano',
      image: cheesecakeImg.src,
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
      image: miniPastelesImg.src,
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 6,
      name: 'Tres Leches de Oreo',
      price: '$5.00',
      description: 'Nuestra versión especial dominicana con galletas Oreo',
      image: tresLechesOreoImg.src,
      category: 'dessert',
      type: 'dessert'
    }
  ];

  const handleAddToCart = (item: any) => {
    // Verificar autenticación primero
    const user = getUser();
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
      const cart = existingCart ? JSON.parse(existingCart) : [];
      
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
