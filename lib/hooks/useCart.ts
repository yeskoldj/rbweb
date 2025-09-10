import { useState, useEffect } from 'react';
import { showCartNotification } from '@/lib/cartNotification';

export interface CartItem {
  id: string;
  name: string;
  price: string | number;
  quantity: number;
  image?: string;
  photoUrl?: string;
  customization?: any;
}

export function useCart(selectedPaymentMethod: 'card' | 'zelle' = 'card') {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedCart = localStorage.getItem('bakery-cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const persist = (items: CartItem[]) => {
    localStorage.setItem('bakery-cart', JSON.stringify(items));
    setCartItems(items);
  };

  const addToCart = (item: CartItem) => {
    const cartItem = {
      id: `${item.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    };

    const existingCart = localStorage.getItem('bakery-cart');
    const cart = existingCart ? JSON.parse(existingCart) : [];

    const existingIndex = cart.findIndex((c: any) => c.name === item.name);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push(cartItem);
    }

    persist(cart);
    showCartNotification(`${item.name} agregado al carrito`);

    setAddedItems(prev => {
      const set = new Set(prev);
      set.add(item.id);
      return set;
    });
    setTimeout(() => {
      setAddedItems(prev => {
        const set = new Set(prev);
        set.delete(item.id);
        return set;
      });
    }, 1500);
  };

  const removeFromCart = (id: string, name: string) => {
    const existingCart = localStorage.getItem('bakery-cart');
    let cart = existingCart ? JSON.parse(existingCart) : [];
    cart = cart.filter((item: any) => item.id !== id);
    persist(cart);
    setAddedItems(prev => {
      const set = new Set(prev);
      set.delete(id);
      return set;
    });
    showCartNotification(`${name} eliminado del carrito`, 'remove');
  };

  const getItemPrice = (item: CartItem): number => {
    if (typeof item.price === 'number') return item.price;
    if (typeof item.price === 'string') {
      return parseFloat(item.price.replace('$', '').split(' ')[0]);
    }
    return 0;
  };

  const formatPrice = (item: CartItem): string => {
    if (typeof item.price === 'number') {
      return `$${item.price.toFixed(2)}`;
    }
    return item.price.toString();
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = getItemPrice(item);
      return total + price * item.quantity;
    }, 0);
  };

  const calculateTax = () => {
    return selectedPaymentMethod === 'zelle' ? 0 : calculateSubtotal() * 0.03;
  };

  const calculateTotal = () => {
    return (calculateSubtotal() + calculateTax()).toFixed(2);
  };

  return {
    cartItems,
    addedItems,
    addToCart,
    removeFromCart,
    getItemPrice,
    formatPrice,
    calculateSubtotal,
    calculateTax,
    calculateTotal,
  };
}

