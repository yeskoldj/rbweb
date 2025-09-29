
'use client';

import Link from 'next/link';
import { useLanguage } from '../lib/languageContext';
import SafeImage from './SafeImage';
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
      name: t('productTresLechesVasoName'),
      price: '$5.00',
      description: t('productTresLechesVasoDescription'),
      image: tresLechesVasoImg.src,
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 2,
      name: t('productFlanName'),
      price: '$4.00',
      description: t('productFlanDescription'),
      image: flanImg.src,
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 3,
      name: t('productCheesecakeName'),
      price: '$5.00',
      description: t('productCheesecakeDescription'),
      image: cheesecakeImg.src,
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 4,
      name: t('productBirthdayCakeName'),
      price: t('priceCustomQuote'),
      description: t('productBirthdayCakeDescription'),
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/58a3f870af7fe55c1b2733bc57137538.png',
      category: 'cake',
      type: 'cake',
      cakeId: 'birthday-classic'
    },
    {
      id: 5,
      name: t('productMiniPastelesName'),
      price: '$2.50',
      description: t('productMiniPastelesDescription'),
      image: miniPastelesImg.src,
      category: 'dessert',
      type: 'dessert'
    },
    {
      id: 6,
      name: t('productTresLechesOreoName'),
      price: '$5.00',
      description: t('productTresLechesOreoDescription'),
      image: tresLechesOreoImg.src,
      category: 'dessert',
      type: 'dessert'
    }
  ];

  const handleAddToCart = (item: any) => {
    // Verificar autenticación primero
    const user = getUser();
    if (!user) {
      alert(t('loginRequiredForCart'));
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
      showCartNotification(t('itemAddedToCart').replace('{item}', item.name));

    } catch (error) {
      console.error('Error agregando al carrito:', error);
      alert(t('addToCartError'));
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
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <SafeImage
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="80px"
                onError={() => console.error(`Error cargando imagen para ${item.name}:`, item.image)}
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">{item.name}</h4>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${item.type === 'cake' ? 'text-amber-600' : 'text-pink-600'}`}>
                  {item.type === 'cake' ? t('priceDefinedByBakery') : item.price}
                </span>
                <button
                  className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:shadow-md transition-all"
                  onClick={() => handleAddToCart(item)}
                >
                  {item.type === 'cake' ? t('customize') : t('addToCart')}
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
