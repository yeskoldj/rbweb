
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createSquarePayment, createP2POrder, p2pPaymentConfig } from '@/lib/squareConfig';
import Script from 'next/script';




type OrderFormProps = {
  squareReady?: boolean;
};

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

  const [sdkReady, setSdkReady] = useState(false);
  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [applePay, setApplePay] = useState<any>(null);
  const [googlePay, setGooglePay] = useState<any>(null);


  const [showP2PInstructions, setShowP2PInstructions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay' | 'zelle' | 'cashapp' | 'venmo'>('card');
  const [p2pInstructions, setP2PInstructions] = useState<any>(null);
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

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!;

  const initSquare = useCallback(async () => {
    try {
      // @ts-ignore
      const Square = (window as any).Square;
      if (!Square || payments) return;

      const p = await Square.payments(appId, locationId);
      setPayments(p);

      // Card
      const c = await p.card();
      await c.attach('#card-container'); // <- NECESITA el div con este id en el JSX
      setCard(c);

      // Apple Pay
      const ap = p.applePay ? await p.applePay() : null;
      if (ap && (await ap.canMakePayment())) setApplePay(ap);

      // Google Pay
      const gp = p.googlePay ? await p.googlePay() : null;
      if (gp && (await gp.canMakePayment())) setGooglePay(gp);

      setSdkReady(true);
      console.log('✅ Square SDK initialized');
    } catch (e) {
      console.error('Square init failed:', e);
    }
  }, [payments, appId, locationId]);
  async function payWithCard(total: number, orderPayload: any) {
    if (!card) return;
    const result = await card.tokenize();
    if (result.status !== 'OK') throw new Error('Card tokenize failed');

    await createSquarePayment({
      ...orderPayload,
      paymentMethod: 'card',
      sourceId: result.token,     // token del SDK
      currency: 'USD',
    });
  }

  async function payWithApple(total: number, orderPayload: any) {
    if (!applePay) return;
    const result = await applePay.tokenize();
    if (result.status !== 'OK') throw new Error('Apple Pay tokenize failed');

    await createSquarePayment({
      ...orderPayload,
      paymentMethod: 'card',
      sourceId: result.token,     // token del SDK
      currency: 'USD',
    });
  }

  async function payWithGoogle(total: number, orderPayload: any) {
    if (!googlePay) return;
    const result = await googlePay.tokenize();
    if (result.status !== 'OK') throw new Error('Google Pay tokenize failed');

    await createSquarePayment({
      ...orderPayload,
      paymentMethod: 'card',
      sourceId: result.token,     // token del SDK
      currency: 'USD',
    });
  }

  // Reintento suave por si el script tarda
  useEffect(() => {
    if (!payments) {
      const t = setInterval(() => {
        // @ts-ignore
        if ((window as any).Square) {
          initSquare();
          clearInterval(t);
        }
      }, 400);
      return () => clearInterval(t);
    }
  }, [initSquare, payments]);



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
    setIsSubmitting(true);

    try {
      console.log('🔥 Iniciando proceso de pago:', selectedPaymentMethod);
      
      let paymentResult;

      if (selectedPaymentMethod === 'zelle' || selectedPaymentMethod === 'cashapp' || selectedPaymentMethod === 'venmo') {
        // Crear orden P2P
        paymentResult = await createP2POrder({
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
          paymentMethod: selectedPaymentMethod,
          userId: currentUser?.id,
          pickupTime: formData.pickupTime || undefined,
          specialRequests: formData.specialRequests?.trim() || undefined
        });

        if (paymentResult.success) {
          setP2PInstructions(paymentResult.paymentInstructions);
          setShowP2PInstructions(true);
          setShowPayment(false);
          setShowCardForm(false);
          
          // Limpiar carrito
          localStorage.removeItem('bakery-cart');
        }
        
      } else {
        // Validar datos de tarjeta para pagos electrónicos
        if (selectedPaymentMethod === 'card' && (!cardData.cardNumber || !cardData.expiry || !cardData.cvv || !cardData.name)) {
          showNotification('error', 'Datos Incompletos', 'Por favor completa todos los campos de la tarjeta');
          setIsSubmitting(false);
          return;
        }

// 🔐 Tokenizar con Square según el método seleccionado
let sourceId: string | undefined;

if (selectedPaymentMethod === 'card') {
  // requiere haber inicializado `card` con Square.payments(...)
  const res = await card?.tokenize();
  if (!res || res.status !== 'OK') {
    throw new Error('Card tokenize failed');
  }
  sourceId = res.token;
} else if (selectedPaymentMethod === 'apple_pay') {
  const res = await applePay?.tokenize();
  if (!res || res.status !== 'OK') {
    throw new Error('Apple Pay tokenize failed');
  }
  sourceId = res.token;
} else if (selectedPaymentMethod === 'google_pay') {
  const res = await googlePay?.tokenize();
  if (!res || res.status !== 'OK') {
    throw new Error('Google Pay tokenize failed');
  }
  sourceId = res.token;
} else {
  // Si NO es un método de Square, no intentes crear pago con Square aquí
  throw new Error('Invalid Square payment method');
}

    // ✅ Crear pago con Square usando el token (sourceId)
    paymentResult = await createSquarePayment({
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
      paymentMethod: selectedPaymentMethod as 'card' | 'apple_pay' | 'google_pay',
      sourceId,                 // 👈 el token del SDK
      currency: 'USD',
      userId: currentUser?.id,
      pickupTime: formData.pickupTime || undefined,
      specialRequests: formData.specialRequests?.trim() || undefined
    });


        if (paymentResult.success) {
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
        }
      }

      // VALIDACIÓN ESTRICTA: Solo continuar si el procesamiento fue exitoso
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Error en el procesamiento del pago');
      }

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

  // Componente de instrucciones P2P
  const P2PInstructionsModal = () => {
    if (!showP2PInstructions || !p2pInstructions) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mx-auto mb-4">
            <i className="ri-smartphone-line text-green-600 text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">¡Orden Creada Exitosamente!</h3>
          <p className="text-gray-600 text-sm mb-4">Número de orden: <span className="font-mono text-green-600">{p2pInstructions.orderId}</span></p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mr-4">
              <i className={`text-blue-600 text-xl ${
                p2pInstructions.method === 'zelle' ? 'ri-bank-line' :
                p2pInstructions.method === 'cashapp' ? 'ri-money-dollar-circle-line' :
                'ri-smartphone-line'
              }`}></i>
            </div>
            <div>
              <h4 className="text-lg font-bold text-blue-800 capitalize">
                Pagar con {p2pInstructions.method === 'cashapp' ? 'Cash App' : p2pInstructions.method}
              </h4>
              <p className="text-2xl font-bold text-blue-900">${p2pInstructions.amount.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {p2pInstructions.email && (
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <div className="flex items-center">
                  <i className="ri-mail-line text-gray-600 mr-3"></i>
                  <span className="font-medium">{p2pInstructions.email}</span>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(p2pInstructions.email)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Copiar
                </button>
              </div>
            )}
            
            {p2pInstructions.phone && (
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <div className="flex items-center">
                  <i className="ri-phone-line text-gray-600 mr-3"></i>
                  <span className="font-medium">{p2pInstructions.phone}</span>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(p2pInstructions.phone)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Copiar
                </button>
              </div>
            )}
            
            {p2pInstructions.handle && (
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <div className="flex items-center">
                  <i className="ri-user-line text-gray-600 mr-3"></i>
                  <span className="font-medium">{p2pInstructions.handle}</span>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(p2pInstructions.handle)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Copiar
                </button>
              </div>
            )}
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-4">
            <div className="flex items-start">
              <i className="ri-information-line text-amber-600 text-lg mt-0.5 mr-3 flex-shrink-0"></i>
              <div>
                <h5 className="font-medium text-amber-800 mb-1">Instrucciones Importantes:</h5>
                <p className="text-sm text-amber-700">{p2pInstructions.instructions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              setShowP2PInstructions(false);
              router.push('/dashboard');
            }}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-center">
              <i className="ri-check-line text-xl mr-2"></i>
              Entendido - Ver Mis Órdenes
            </div>
          </button>

          <p className="text-center text-xs text-gray-500">
            Tu orden estará lista una vez confirmemos tu pago
          </p>
        </div>
      </div>
    );
  };

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
            
            {/* Indicador de seguridad Square */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <i className="ri-shield-check-line text-green-600 text-lg"></i>
                <span className="text-sm font-medium text-green-800">Procesado por Square - Totalmente Seguro</span>
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
              <span>Square Seguro</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (showP2PInstructions) {
    return (
      <>
        <NotificationSystem />
        <P2PInstructionsModal />
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">Selecciona tu Método de Pago</h3>
            <p className="text-gray-600 text-sm mb-4">Elige cómo quieres pagar tu orden</p>
          </div>

          <div className="space-y-4 mb-6">
            {/* Resumen del pago */}
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

            {/* Opciones de pago */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Métodos de Pago Disponibles</h4>
              
              {/* Tarjeta de crédito */}
              <button
                onClick={() => setSelectedPaymentMethod('card')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedPaymentMethod === 'card' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mr-4">
                    <i className="ri-bank-card-line text-blue-600 text-xl"></i>
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium text-gray-800">Tarjeta de Crédito/Débito</h5>
                    <p className="text-sm text-gray-600">Visa, Mastercard, American Express</p>
                  </div>
                  {selectedPaymentMethod === 'card' && (
                    <i className="ri-check-line text-blue-600 text-xl ml-auto"></i>
                  )}
                </div>
              </button>

              {/* Apple Pay */}
              <button
                onClick={() => setSelectedPaymentMethod('apple_pay')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedPaymentMethod === 'apple_pay' 
                    ? 'border-gray-800 bg-gray-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full mr-4">
                    <i className="ri-apple-line text-gray-800 text-xl"></i>
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium text-gray-800">Apple Pay</h5>
                    <p className="text-sm text-gray-600">Pago rápido y seguro</p>
                  </div>
                  {selectedPaymentMethod === 'apple_pay' && (
                    <i className="ri-check-line text-gray-800 text-xl ml-auto"></i>
                  )}
                </div>
              </button>

              {/* Google Pay */}
              <button
                onClick={() => setSelectedPaymentMethod('google_pay')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedPaymentMethod === 'google_pay' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mr-4">
                    <i className="ri-google-line text-green-600 text-xl"></i>
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium text-gray-800">Google Pay</h5>
                    <p className="text-sm text-gray-600">Pago rápido y seguro</p>
                  </div>
                  {selectedPaymentMethod === 'google_pay' && (
                    <i className="ri-check-line text-green-600 text-xl ml-auto"></i>
                  )}
                </div>
              </button>

              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-800 mb-3">Transferencias P2P</h5>
                
                {/* Zelle */}
                <button
                  onClick={() => setSelectedPaymentMethod('zelle')}
                  className={`w-full p-4 rounded-xl border-2 transition-all mb-3 ${
                    selectedPaymentMethod === 'zelle' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-full mr-4">
                      <i className="ri-bank-line text-purple-600 text-xl"></i>
                    </div>
                    <div className="text-left">
                      <h5 className="font-medium text-gray-800">Zelle</h5>
                      <p className="text-sm text-gray-600">Transferencia bancaria instantánea</p>
                    </div>
                    {selectedPaymentMethod === 'zelle' && (
                      <i className="ri-check-line text-purple-600 text-xl ml-auto"></i>
                    )}
                  </div>
                </button>

                {/* Cash App */}
                <button
                  onClick={() => setSelectedPaymentMethod('cashapp')}
                  className={`w-full p-4 rounded-xl border-2 transition-all mb-3 ${
                    selectedPaymentMethod === 'cashapp' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mr-4">
                      <i className="ri-money-dollar-circle-line text-green-600 text-xl"></i>
                    </div>
                    <div className="text-left">
                      <h5 className="font-medium text-gray-800">Cash App</h5>
                      <p className="text-sm text-gray-600">Pago móvil rápido</p>
                    </div>
                    {selectedPaymentMethod === 'cashapp' && (
                      <i className="ri-check-line text-green-600 text-xl ml-auto"></i>
                    )}
                  </div>
                </button>

                {/* Venmo */}
                <button
                  onClick={() => setSelectedPaymentMethod('venmo')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedPaymentMethod === 'venmo' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mr-4">
                      <i className="ri-smartphone-line text-blue-600 text-xl"></i>
                    </div>
                    <div className="text-left">
                      <h5 className="font-medium text-gray-800">Venmo</h5>
                      <p className="text-sm text-gray-600">Pago social móvil</p>
                    </div>
                    {selectedPaymentMethod === 'venmo' && (
                      <i className="ri-check-line text-blue-600 text-xl ml-auto"></i>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                if (selectedPaymentMethod === 'card') {
                  setShowCardForm(true);
                } else {
                  processPayment();
                }
              }}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="ri-arrow-right-line text-xl mr-2"></i>
                  {selectedPaymentMethod === 'card' ? 'Ingresar Datos de Tarjeta' : 
                   selectedPaymentMethod === 'apple_pay' ? 'Pagar con Apple Pay' :
                   selectedPaymentMethod === 'google_pay' ? 'Pagar con Google Pay' :
                   `Continuar con ${selectedPaymentMethod === 'cashapp' ? 'Cash App' : 
                     selectedPaymentMethod.charAt(0).toUpperCase() + selectedPaymentMethod.slice(1)}`}
                </div>
              )}
            </button>

            <button
              onClick={() => setShowPayment(false)}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
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
              <h4 className="text-sm font-medium text-blue-800">Pago Seguro con Square</h4>
              <p className="text-xs text-blue-700 mt-1">
                Tu pedido será procesado de forma segura a través del sistema de pagos de Square.
              </p>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
