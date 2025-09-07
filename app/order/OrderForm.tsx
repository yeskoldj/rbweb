
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { createCloverPayment } from '../../lib/cloverConfig';

interface CartItem {
  id: string;
  name: string;
  price: string | number;
  quantity: number;
  image?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export default function OrderForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialRequests: '',
    pickupTime: ''
  });
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  // Función para mostrar notificaciones modernas
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, title, message };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Función para cerrar notificación manualmente
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const savedCart = localStorage.getItem('bakery-cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCurrentUser(profile);
          setFormData(prev => ({
            ...prev,
            name: profile.full_name || '',
            email: profile.email || ''
          }));
        }
      } else {
        const localUser = localStorage.getItem('bakery-user');
        if (localUser) {
          const userData = JSON.parse(localUser);
          setCurrentUser(userData);
          setFormData(prev => ({
            ...prev,
            email: userData.email || ''
          }));
        }
      }
    } catch (error) {
      console.log('Error checking user:', error);
    }
  };

  const addToCart = (item: CartItem) => {
    const cartItem = {
      id: `${item.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image
    };

    const existingCart = localStorage.getItem('bakery-cart');
    let cart = existingCart ? JSON.parse(existingCart) : [];
    
    const existingItemIndex = cart.findIndex((cartItem: any) => cartItem.name === item.name);
    
    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push(cartItem);
    }
    
    localStorage.setItem('bakery-cart', JSON.stringify(cart));
    setCartItems(cart);
    
    // Efecto visual "Agregado"
    setAddedItems(prev => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 1500);
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

  const formatPrice = (item: CartItem): string => {
    if (typeof item.price === 'number') {
      return `$${item.price.toFixed(2)}`;
    }
    return item.price.toString();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      showNotification('warning', 'Carrito Vacío', 'Tu carrito está vacío. Por favor agrega productos del menú primero.');
      return;
    }

    setShowPayment(true);
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    } else if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const processPayment = async () => {
    if (!cardData.cardNumber || !cardData.expiry || !cardData.cvv || !cardData.name) {
      showNotification('error', 'Datos Incompletos', 'Por favor completa todos los campos de la tarjeta');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔥 Iniciando proceso de pago Clover...');
      
      // Crear pago con datos completos
      const paymentResult = await createCloverPayment({
        amount: parseFloat(calculateTotal()),
        items: cartItems.map(item => ({
          name: item.name,
          price: getItemPrice(item),
          quantity: item.quantity
        })),
        customerInfo: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email?.trim() || currentUser?.email || ''
        },
        cardInfo: {
          number: cardData.cardNumber.replace(/\s/g, ''),
          expiry: cardData.expiry,
          cvv: cardData.cvv,
          name: cardData.name.trim()
        },
        userId: currentUser?.id,
        pickupTime: formData.pickupTime || undefined,
        specialRequests: formData.specialRequests?.trim() || undefined
      });

      console.log('💳 Resultado de Clover:', paymentResult);

      // VALIDACIÓN ESTRICTA: Solo continuar si Clover confirma éxito
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Pago rechazado por Clover');
      }

      // Si llegamos aquí, el pago fue exitoso Y se guardó en Supabase
      console.log('✅ Pago exitoso y orden guardada!');
      
      // Limpiar carrito
      localStorage.removeItem('bakery-cart');
      
      // Mostrar éxito
      setShowSuccess(true);
      setShowPayment(false);
      setShowCardForm(false);

      // Redirigir al dashboard
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/dashboard');
      }, 3000);

    } catch (error: any) {
      console.error('❌ Error en el proceso de pago:', error);
      showNotification('error', 'Error en el Pago', error?.message || 'Por favor intenta de nuevo');
    }

    setIsSubmitting(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Componente de notificaciones modernas
  const NotificationSystem = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 bg-white max-w-sm animate-slide-in-right ${
            notification.type === 'success' ? 'border-green-500' :
            notification.type === 'error' ? 'border-red-500' :
            notification.type === 'warning' ? 'border-amber-500' :
            'border-blue-500'
          }`}
        >
          <div className="flex items-start">
            <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 flex-shrink-0 ${
              notification.type === 'success' ? 'bg-green-100 text-green-600' :
              notification.type === 'error' ? 'bg-red-100 text-red-600' :
              notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              <i className={`text-sm ${
                notification.type === 'success' ? 'ri-check-line' :
                notification.type === 'error' ? 'ri-close-line' :
                notification.type === 'warning' ? 'ri-alert-line' :
                'ri-information-line'
              }`}></i>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 text-sm">{notification.title}</h4>
              <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <i className="ri-close-line text-sm"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  if (showSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4">
          <i className="ri-check-line text-green-600 text-2xl"></i>
        </div>
        <h3 className="text-xl font-bold text-green-600 mb-2">¡Pedido Realizado Exitosamente!</h3>
        <p className="text-gray-600 mb-4">Gracias por tu pedido. Lo tendremos listo para recoger pronto.</p>
        <p className="text-sm text-gray-500">Redirigiendo al dashboard...</p>
      </div>
    );
  }

  if (showCardForm) {
    return (
      <>
        <NotificationSystem />
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto mb-4">
              <i className="ri-bank-card-line text-blue-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Información de Pago</h3>
            <p className="text-gray-600 text-sm mb-4">Ingresa los datos de tu tarjeta de forma segura</p>
            
            {/* Indicador de seguridad Clover */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <i className="ri-shield-check-line text-green-600 text-lg"></i>
                <span className="text-sm font-medium text-green-800">Procesado por Clover - Totalmente Seguro</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Tarjeta
              </label>
              <input
                type="text"
                name="cardNumber"
                value={cardData.cardNumber}
                onChange={handleCardInputChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento
                </label>
                <input
                  type="text"
                  name="expiry"
                  value={cardData.expiry}
                  onChange={handleCardInputChange}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={cardData.cvv}
                  onChange={handleCardInputChange}
                  placeholder="123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre en la Tarjeta
              </label>
              <input
                type="text"
                name="name"
                value={cardData.name}
                onChange={handleCardInputChange}
                placeholder="Nombre completo como aparece en la tarjeta"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Resumen del Pago</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Impuesto (3%):</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">${calculateTotal()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={processPayment}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-bold !rounded-button disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando Pago...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="ri-secure-payment-line text-xl mr-2"></i>
                  Pagar ${calculateTotal()}
                </div>
              )}
            </button>

            <button
              onClick={() => setShowCardForm(false)}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium !rounded-button"
            >
              Volver
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <i className="ri-shield-check-line text-green-500 mr-1"></i>
              <span>SSL Seguro</span>
            </div>
            <div className="flex items-center">
              <i className="ri-bank-card-line text-blue-500 mr-1"></i>
              <span>Todas las Tarjetas</span>
            </div>
            <div className="flex items-center">
              <i className="ri-lock-line text-purple-500 mr-1"></i>
              <span>Clover Seguro</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (showPayment) {
    return (
      <>
        <NotificationSystem />
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto mb-4">
              <i className="ri-secure-payment-line text-pink-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Pago Seguro</h3>
            <p className="text-gray-600 text-sm mb-4">Completa tu pago con Clover</p>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 mb-6">
              <div className="flex items-center justify-center space-x-4">
                <img 
                  src="https://readdy.ai/api/search-image?query=Clover%20payment%20system%20logo%2C%20secure%20payment%20processing%2C%20fintech%20branding%2C%20professional%20clean%20design%2C%20payment%20gateway&width=120&height=40&seq=cloverlogo2&orientation=landscape"
                  alt="Clover Payment"
                  className="h-8 object-contain"
                />
                <div className="text-left">
                  <p className="font-semibold text-blue-800">Powered by Clover</p>
                  <p className="text-xs text-blue-700">Procesamiento seguro y confiable</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Resumen del Pago</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Impuesto (3%):</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="text-pink-600">${calculateTotal()}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-start">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-shield-check-line text-amber-600 text-sm"></i>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-amber-800">Pago Seguro</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Tu pago se procesa de forma segura a través del sistema encriptado de Clover. Nunca almacenamos tu información de tarjeta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowCardForm(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-lg font-bold !rounded-button text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-center">
                <i className="ri-bank-card-line text-xl mr-2"></i>
                Ingresar Datos de Tarjeta
              </div>
            </button>

            <button
              onClick={() => setShowPayment(false)}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium !rounded-button"
            >
              Volver a Detalles del Pedido
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <i className="ri-shield-check-line text-green-500 mr-1"></i>
              <span>SSL Seguro</span>
            </div>
            <div className="flex items-center">
              <i className="ri-bank-card-line text-blue-500 mr-1"></i>
              <span>Todas las Tarjetas</span>
            </div>
            <div className="flex items-center">
              <i className="ri-lock-line text-purple-500 mr-1"></i>
              <span>PCI Compliant</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <NotificationSystem />
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <i className="ri-shopping-cart-line text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Tu carrito está vacío</h3>
          <p className="text-gray-600 mb-6">Por favor agrega productos a tu carrito antes de realizar un pedido</p>
          <a href="/menu" className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-6 py-3 rounded-lg font-medium !rounded-button inline-block">
            Ver Menú
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <NotificationSystem />
      <form id="bakery-order" onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Pedido</h3>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-pink-600 text-sm ml-2">{formatPrice(item)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">x{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        addedItems.has(item.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-gradient-to-r from-pink-400 to-teal-400 text-white hover:shadow-md'
                      }`}
                    >
                      {addedItems.has(item.id) ? '¡Agregado!' : 'Agregar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Impuesto (3%):</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lg font-bold text-gray-800">Total:</span>
                <span className="text-lg font-bold text-pink-600">${calculateTotal()}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              placeholder="Ingresa tu nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Teléfono *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              placeholder="(862) 233-7204"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              placeholder="tu.email@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora Preferida de Recogida
            </label>
            <select
              name="pickupTime"
              value={formData.pickupTime}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
            >
              <option value="">Seleccionar hora de recogida</option>
              <option value="9:00 AM">9:00 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="1:00 PM">1:00 PM</option>
              <option value="2:00 PM">2:00 PM</option>
              <option value="3:00 PM">3:00 PM</option>
              <option value="4:00 PM">4:00 PM</option>
              <option value="5:00 PM">5:00 PM</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solicitudes Especiales
            </label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm h-20 resize-none"
              placeholder="¿Alguna instrucción especial o requerimientos dietéticos?"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.specialRequests.length}/500 caracteres</p>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-400 to-teal-400 text-white py-3 rounded-lg font-medium !rounded-button"
          >
            Continuar al Pago - ${calculateTotal()}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-secure-payment-line text-blue-600 text-sm"></i>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Pago Seguro con Clover</h4>
              <p className="text-xs text-blue-700 mt-1">
                Tu pedido será procesado de forma segura a través del sistema de pagos de Clover.
              </p>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
