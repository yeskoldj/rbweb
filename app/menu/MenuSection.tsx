'use client';

import { useState, useEffect } from 'react';
import { showCartNotification } from '../../lib/cartNotification';
import SafeImage from '@/components/SafeImage';
import { useLanguage } from '../../lib/languageContext';
import { supabase } from '../../lib/supabase';

interface MenuItem {
  name: string;
  price: string;
  image: string;
}

interface MenuSectionProps {
  category: string;
  items: MenuItem[];
}

export default function MenuSection({ category, items }: MenuSectionProps) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    void checkAuthentication();

    const initialQuantities: { [key: string]: number } = {};
    items.forEach(item => {
      initialQuantities[item.name] = 1;
    });
    setQuantities(initialQuantities);
  }, [items]);

  const checkAuthentication = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setIsAuthenticated(false);
    }
  };

  const updateQuantity = (itemName: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemName]: Math.max(1, prev[itemName] + change)
    }));
  };

  const addToCart = (item: MenuItem) => {
    if (!isAuthenticated) {
      alert(t('loginRequiredForCart'));
      return;
    }

    const cartItem = {
      id: `${item.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: item.name,
      price: item.price,
      quantity: quantities[item.name] || 1,
      image: item.image
    };

    const existingCart = JSON.parse(localStorage.getItem('bakery-cart') || '[]');

    const existingItemIndex = existingCart.findIndex((cartItem: any) => cartItem.name === item.name);

    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += quantities[item.name] || 1;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem('bakery-cart', JSON.stringify(existingCart));

    showCartNotification(t('itemAddedToCart').replace('{item}', item.name));
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-amber-800 mb-4 px-2">
        {category}
      </h2>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden mx-2">
            <div className="flex">
              <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden">
                <SafeImage
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover object-top"
                  sizes="80px"
                />
              </div>

              <div className="flex-1 p-3">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-amber-800 text-base leading-tight">
                    {item.name}
                  </h3>
                  <span className="text-lg font-bold text-pink-600 ml-2">
                    {item.price}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.name, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      <i className="ri-subtract-line text-xs"></i>
                    </button>
                    <span className="text-sm font-medium w-6 text-center">
                      {quantities[item.name] || 1}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.name, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                    >
                      <i className="ri-add-line text-xs"></i>
                    </button>
                  </div>

                  <button
                    onClick={() => addToCart(item)}
                    className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-4 py-1.5 rounded-full text-sm font-medium !rounded-button hover:shadow-md transition-all"
                  >
                    <i className="ri-shopping-cart-line mr-1 text-xs"></i>
                    {t('addToCart')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

