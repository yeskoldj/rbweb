
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
  customization?: {
    shape?: string;
    layers?: string;
    flavors?: string;
    colors?: string;
    fillings?: string;
    decorations?: string;
    inscription?: string;
    specialRequests?: string;
  };
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  // Datos del formulario de pedido
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialRequests: '',
    pickupTime: ''
  });

  // Datos de la tarjeta
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    checkAuthAndLoadCart();
  }, []);

  const checkAuthAndLoadCart = async () => {
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

    // Cargar datos del usuario
    try {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      setFormData(prev => ({
        ...prev,
        name: user.full_name || '',
        email: user.email || ''
      }));
    } catch (error) {
      console.log('Error loading user data:', error);
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

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const editCakeOrder = (item: CartItem) => {
    const cakeIdMap: { [key: string]: string } = {
      'Pastel Clásico de Cumpleaños Personalizado': 'birthday-classic',
      'Pastel Deluxe de Cumpleaños Personalizado': 'birthday-deluxe',
      'Pastel Elegante de Boda Personalizado': 'wedding-elegant',
      'Pastel Princesa de Quinceañera Personalizado': 'quince-princess',
      'Pastel de Graduación Personalizado': 'graduation',
      'Photo Cake Básico Personalizado': 'photo-cake-basic',
      'Photo Cake Premium Personalizado': 'photo-cake-premium'
    };

    const cakeId = cakeIdMap[item.name] || 'birthday-classic';
    
    // Remover el item actual del carrito
    removeItem(item.id);
    
    // Redirigir al personalizador
    router.push(`/cakes/${cakeId}`);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      alert('Por favor completa todos los campos de la tarjeta');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Limpiar carrito
      localStorage.removeItem('bakery-cart');
      
      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error al procesar el pago. Por favor intenta de nuevo.');
    }

    setIsSubmitting(false);
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

  // Vista de formulario de pago con tarjeta
  if (showCardForm) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Header />
        <div className="pt-20 pb-20">
          <div className="px-4 py-6">
            <button
              onClick={() => setShowCardForm(false)}
              className="flex items-center text-pink-500 mb-4"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Volver
            </button>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto mb-4">
                  <i className="ri-bank-card-line text-blue-500 text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Información de Pago</h3>
                <p className="text-gray-600 text-sm">Ingresa los datos de tu tarjeta de forma segura</p>
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
                      Vencimiento
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
                    placeholder="Nombre completo"
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

              <button
                onClick={processPayment}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl transition-all"
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
            </div>
          </div>
        </div>
        <TabBar />
      </div>
    );
  }

  // Vista de detalles de pedido y pago
  if (showPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Header />
        <div className="pt-20 pb-20">
          <div className="px-4 py-6">
            <button
              onClick={() => setShowPayment(false)}
              className="flex items-center text-pink-500 mb-4"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Volver al Carrito
            </button>

            <h1 className="text-2xl font-bold text-amber-800 text-center mb-6">
              Finalizar Pedido
            </h1>

            <div className="space-y-6">
              {/* Resumen del pedido */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Pedido</h3>
                <div className="space-y-3 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-pink-600 text-sm ml-2">{formatPrice(item)}</span>
                      </div>
                      <span className="text-sm text-gray-600">x{item.quantity}</span>
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
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-pink-600">${calculateTotal()}</span>
                  </div>
                </div>
              </div>

              {/* Formulario de datos del cliente */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Cliente</h3>
                <div className="space-y-4">
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
                      Teléfono *
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
                      Email
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
                      Hora de Recogida
                    </label>
                    <select
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                    >
                      <option value="">Seleccionar hora</option>
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
                      placeholder="Instrucciones especiales o alergias"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de pago */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <button
                  onClick={() => setShowCardForm(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-center">
                    <i className="ri-bank-card-line text-xl mr-2"></i>
                    Continuar al Pago - ${calculateTotal()}
                  </div>
                </button>
              </div>
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
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-800 text-sm mb-1">
                          {item.name}
                          {item.type === 'cake' && (
                            <span className="ml-2 text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                              Personalizado
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-pink-600 font-bold text-sm">
                            {formatPrice(item)}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500"
                          >
                            <i className="ri-close-line text-sm"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
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

                    {/* Botones de acción mejorados para pasteles personalizados */}
                    {item.type === 'cake' && (
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleItemExpansion(item.id)}
                            className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                          >
                            <i className={`${expandedItems.has(item.id) ? 'ri-eye-off-line' : 'ri-eye-line'} mr-1`}></i>
                            {expandedItems.has(item.id) ? 'Ocultar' : 'Ver'} Personalización
                          </button>
                          <button
                            onClick={() => editCakeOrder(item)}
                            className="flex-1 bg-orange-50 text-orange-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors"
                          >
                            <i className="ri-edit-line mr-1"></i>
                            Editar Pastel
                          </button>
                        </div>

                        {/* Resumen detallado de personalización (expandible) */}
                        {item.customization && expandedItems.has(item.id) && (
                          <div className="mt-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
                            <h4 className="font-bold text-pink-800 text-sm mb-3 flex items-center">
                              <i className="ri-cake-3-line mr-2"></i>
                              Detalles de tu Pastel Personalizado
                            </h4>
                            <div className="space-y-3 text-xs">
                              {item.customization.shape && (
                                <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
                                  <div className="flex items-center">
                                    <i className="ri-shape-line text-pink-600 mr-2"></i>
                                    <span className="font-medium text-gray-700">Forma:</span>
                                  </div>
                                  <span className="font-semibold text-pink-700">{item.customization.shape}</span>
                                </div>
                              )}
                              {item.customization.layers && (
                                <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
                                  <div className="flex items-center">
                                    <i className="ri-stack-line text-orange-600 mr-2"></i>
                                    <span className="font-medium text-gray-700">Niveles:</span>
                                  </div>
                                  <span className="font-semibold text-orange-700">{item.customization.layers}</span>
                                </div>
                              )}
                              {item.customization.flavors && (
                                <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
                                  <div className="flex items-center">
                                    <i className="ri-cake-3-line text-purple-600 mr-2"></i>
                                    <span className="font-medium text-gray-700">Sabores:</span>
                                  </div>
                                  <span className="font-semibold text-purple-700">{item.customization.flavors}</span>
                                </div>
                              )}
                              {item.customization.colors && (
                                <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
                                  <div className="flex items-center">
                                    <i className="ri-palette-line text-blue-600 mr-2"></i>
                                    <span className="font-medium text-gray-700">Colores:</span>
                                  </div>
                                  <span className="font-semibold text-blue-700">{item.customization.colors}</span>
                                </div>
                              )}
                              {item.customization.fillings && (
                                <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
                                  <div className="flex items-center">
                                    <i className="ri-contrast-drop-line text-amber-600 mr-2"></i>
                                    <span className="font-medium text-gray-700">Rellenos:</span>
                                  </div>
                                  <span className="font-semibold text-amber-700">{item.customization.fillings}</span>
                                </div>
                              )}
                              {item.customization.decorations && (
                                <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
                                  <div className="flex items-center">
                                    <i className="ri-star-line text-yellow-600 mr-2"></i>
                                    <span className="font-medium text-gray-700">Decoraciones:</span>
                                  </div>
                                  <span className="font-semibold text-yellow-700">{item.customization.decorations}</span>
                                </div>
                              )}
                              {item.customization.inscription && (
                                <div className="bg-white/60 px-3 py-2 rounded-lg">
                                  <div className="flex items-center mb-1">
                                    <i className="ri-edit-line text-green-600 mr-2"></i>
                                    <span className="font-medium text-gray-700">Mensaje:</span>
                                  </div>
                                  <p className="font-semibold text-green-700 italic pl-6">"{item.customization.inscription}"</p>
                                </div>
                              )}
                              {item.customization.specialRequests && (
                                <div className="bg-white/60 px-3 py-2 rounded-lg">
                                  <div className="flex items-center mb-1">
                                    <i className="ri-chat-3-line text-indigo-600 mr-2"></i>
                                    <span className="font-medium text-gray-700">Solicitudes especiales:</span>
                                  </div>
                                  <p className="font-semibold text-indigo-700 italic pl-6">"{item.customization.specialRequests}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
              <button
                onClick={() => setShowPayment(true)}
                className="w-full bg-gradient-to-r from-pink-400 to-teal-400 text-white py-3 rounded-lg font-medium !rounded-button"
              >
                Realizar Pedido - ${calculateTotal()}
              </button>

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
