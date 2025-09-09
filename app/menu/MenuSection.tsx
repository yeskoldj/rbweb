
'use client';

import { useState, useEffect } from 'react';
import { showCartNotification } from '../../lib/cartNotification';

interface MenuItem {
  name: string;
  price: string;
  description: string;
  image: string;
}

interface MenuSectionProps {
  category: string;
  items: MenuItem[];
}

export default function MenuSection({ category, items }: MenuSectionProps) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
    
    // Initialize quantities for all items
    const initialQuantities: { [key: string]: number } = {};
    items.forEach(item => {
      initialQuantities[item.name] = 1;
    });
    setQuantities(initialQuantities);
  }, [items]);

  const checkAuthentication = () => {
    const userData = localStorage.getItem('bakery-user');
    setIsAuthenticated(!!userData);
  };

  const updateQuantity = (itemName: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemName]: Math.max(1, prev[itemName] + change)
    }));
  };

  const addToCart = (item: MenuItem) => {
    if (!isAuthenticated) {
      alert('Necesitas crear una cuenta para agregar productos al carrito');
      return;
    }

    const cartItem = {
      id: `${item.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: item.name,
      price: item.price,
      quantity: quantities[item.name] || 1,
      image: item.image
    };

    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem('bakery-cart') || '[]');
    
    // Check if item already exists in cart
    const existingItemIndex = existingCart.findIndex((cartItem: any) => cartItem.name === item.name);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      existingCart[existingItemIndex].quantity += quantities[item.name] || 1;
    } else {
      // Add new item to cart
      existingCart.push(cartItem);
    }

    // Save updated cart
    localStorage.setItem('bakery-cart', JSON.stringify(existingCart));
    
    // Show success message with animation
    showCartNotification(`${item.name} agregado al carrito`);
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
              <div className="w-20 h-20 flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover object-top"
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
                
                <p className="text-gray-600 text-xs mb-3 leading-tight">
                  {item.description}
                </p>
                
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
                    Agregar
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