
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import Link from 'next/link';

interface CartItem {
  id: string;
  name: string;
  price: string | number;
  quantity: number;
  image?: string;
  type?: string;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadCart();
  }, []);

  const checkAuthAndLoadCart = () => {
    const userData = localStorage.getItem('bakery-user');
    
    if (!userData) {
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    const savedCart = localStorage.getItem('bakery-cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    setLoading(false);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(id);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('bakery-cart', JSON.stringify(updatedCart));
  };

  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('bakery-cart', JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('bakery-cart');
  };

  const getItemPrice = (item: CartItem): number => {
    if (typeof item.price === 'number') {
      return item.price;
    }
    if (typeof item.price === 'string') {
      return parseFloat(item.price.replace('$', '').split(' ')[0]);
    }
    return 0;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = getItemPrice(item);
      return total + (price * item.quantity);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.03;
  };

  const calculateTotal = () => {
    return (calculateSubtotal() + calculateTax()).toFixed(2);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const formatPrice = (item: CartItem): string => {
    if (typeof item.price === 'number') {
      return `$${item.price.toFixed(2)}`;
    }
    return item.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Header />
        <div className="pt-20 pb-20 flex items-center justify-center">
          <div className="text-center">Cargando...</div>
        </div>
        <TabBar />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Header />
        <div className="pt-20 pb-20">
          <div className="px-4 py-6">
            <h1 className="text-3xl font-bold text-amber-800 text-center mb-8">
              Tu Carrito
            </h1>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 flex items-center justify-center bg-amber-100 rounded-full mx-auto mb-4">
                <i className="ri-lock-line text-amber-600 text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Cuenta Requerida</h3>
              <p className="text-gray-600 mb-6">
                Necesitas una cuenta para ver tu carrito y realizar pedidos
              </p>
              <div className="space-y-3">
                <Link href="/auth">
                  <button className="w-full bg-gradient-to-r from-pink-400 to-teal-400 text-white px-6 py-3 rounded-lg font-medium !rounded-button">
                    Crear Cuenta / Iniciar Sesión
                  </button>
                </Link>
                <Link href="/menu">
                  <button className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium !rounded-button">
                    Ver Menú
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <TabBar />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Header />
        <div className="pt-20 pb-20">
          <div className="px-4 py-6">
            <h1 className="text-3xl font-bold text-amber-800 text-center mb-8">
              Tu Carrito
            </h1>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                <i className="ri-shopping-cart-line text-gray-400 text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Tu carrito está vacío</h3>
              <p className="text-gray-600 mb-6">
                Explora nuestro delicioso menú y agrega productos a tu carrito
              </p>
              <Link href="/menu">
                <button className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-6 py-3 rounded-lg font-medium !rounded-button">
                  Ver Menú
                </button>
              </Link>
            </div>
          </div>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-20 pb-20">
        <div className="px-4 py-6">
          <h1 className="text-3xl font-bold text-amber-800 text-center mb-2">
            Tu Carrito
          </h1>
          <p className="text-gray-600 text-center mb-6">
            {getTotalItems()} producto{getTotalItems() !== 1 ? 's' : ''} en tu carrito
          </p>

          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="flex">
                  {item.image && (
                    <div className="w-20 h-20 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-amber-800 text-sm">
                        {item.name}
                        {item.type === 'cake' && (
                          <span className="ml-2 text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                            Personalizado
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500"
                      >
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-pink-600 font-bold text-sm">
                        {formatPrice(item)}
                      </span>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          <i className="ri-subtract-line text-sm"></i>
                        </button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-pink-500 text-white rounded-full hover:bg-pink-600"
                        >
                          <i className="ri-add-line text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Impuesto (3%)</span>
                <span className="font-medium">${calculateTax().toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-pink-600">${calculateTotal()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/order" className="block">
                <button className="w-full bg-gradient-to-r from-pink-400 to-teal-400 text-white py-3 rounded-lg font-medium !rounded-button">
                  Pagar con Clover
                </button>
              </Link>

              <div className="flex space-x-3">
                <Link href="/menu" className="flex-1">
                  <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium !rounded-button">
                    Seguir Comprando
                  </button>
                </Link>
                <button
                  onClick={clearCart}
                  className="flex-1 bg-red-50 text-red-600 py-3 rounded-lg font-medium !rounded-button hover:bg-red-100"
                >
                  Vaciar Carrito
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-start">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-information-line text-amber-600 text-sm"></i>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-amber-800">Información de Recogida</h4>
                <p className="text-xs text-amber-700 mt-1">
                  Los pedidos se preparan frescos y están listos para recoger en 2-3 horas. Recibirás una llamada de confirmación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
