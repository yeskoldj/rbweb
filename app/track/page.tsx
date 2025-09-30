
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import { formatPickupDate, formatPickupDetails } from '@/lib/pickupFormatting';

interface OrderItem {
  name: string;
  quantity: number;
  price?: number | string | null;
  details?: string;
  photoUrl?: string;
  isPricePending?: boolean;
  price_label?: string;
}

interface Order {
  id: string;
  p2p_reference?: string | null;
  user_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'baking' | 'decorating' | 'ready' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed' | 'paid';
  pickup_time?: string;
  pickup_date?: string | null;
  special_requests?: string;
  order_date: string;
  created_at: string;
  updated_at?: string;
}

interface SpecialRequestEntry {
  label?: string;
  value: string;
}

const formatSpecialRequests = (specialRequests?: string): SpecialRequestEntry[] => {
  if (!specialRequests) {
    return [];
  }

  const pieces = specialRequests
    .split(/[\n;]+/)
    .map((piece) => piece.trim())
    .filter(Boolean);

  if (pieces.length === 0) {
    return [];
  }

  const entries = pieces.map((piece) => {
    const [label, ...rest] = piece.split(':');

    if (rest.length === 0) {
      return { value: label.trim() };
    }

    return {
      label: label.trim(),
      value: rest.join(':').trim(),
    };
  });

  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = `${entry.label?.toLowerCase() ?? ''}|${entry.value.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export default function TrackOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');

  const loadOrdersFromLocal = useCallback((userEmail: string) => {
    const savedOrders = JSON.parse(localStorage.getItem('bakery-orders') || '[]');
    const userOrders = savedOrders.filter((order: Order) =>
      order.customer_email === userEmail
    );
    setOrders(userOrders);
  }, []);

  const loadUserOrders = useCallback(async (userEmail: string) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders from Supabase:', error);
        loadOrdersFromLocal(userEmail);
        return;
      }

      setOrders(orders || []);
    } catch (error) {
      console.error('Supabase connection error:', error);
      loadOrdersFromLocal(userEmail);
    }
  }, [loadOrdersFromLocal]);

  const checkUserAndLoadOrders = useCallback(async () => {
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
          await loadUserOrders(profile.email);
          setLoading(false);
          return;
        }
      }

      const localUser = localStorage.getItem('bakery-user');
      if (localUser) {
        const userData = JSON.parse(localUser);
        setCurrentUser(userData);
        await loadUserOrders(userData.email);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
    setLoading(false);
  }, [loadUserOrders]);

  useEffect(() => {
    checkUserAndLoadOrders();
  }, [checkUserAndLoadOrders]);

  const searchOrdersByPhone = async () => {
    if (!searchPhone.trim()) return;

    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', searchPhone.trim())
        .order('created_at', { ascending: false });

      if (!error && orders) {
        setOrders(orders);
        return;
      }
    } catch (error) {
      console.error('Error searching in Supabase:', error);
    }

    const savedOrders = JSON.parse(localStorage.getItem('bakery-orders') || '[]');
    const phoneOrders = savedOrders.filter((order: Order) => 
      order.customer_phone === searchPhone.trim()
    );
    setOrders(phoneOrders);
  };

  const normalizeStatus = (status: string) =>
    status === 'baking' || status === 'decorating' ? 'pending' : status;

  const getNumericPrice = (value: number | string | null | undefined) => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (normalized.includes('pendiente') || normalized.includes('cotiza')) {
        return 0;
      }

      const parsed = parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.'));
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  };

  const isItemPricePending = (item: OrderItem) => {
    if (item?.isPricePending) {
      return true;
    }

    if (item?.price === null || typeof item?.price === 'undefined') {
      return true;
    }

    if (typeof item.price === 'string') {
      const normalized = item.price.toLowerCase();
      if (normalized.includes('pendiente') || normalized.includes('cotiza')) {
        return true;
      }
    }

    return false;
  };

  const hasPendingPrice = (order: Order) => {
    if (!Array.isArray(order.items)) {
      return order.total <= 0;
    }

    const pendingItems = order.items.some((item) => isItemPricePending(item));
    return pendingItems || !order.total || order.total <= 0;
  };

  const formatItemPrice = (item: OrderItem) => {
    if (isItemPricePending(item)) {
      return item.price_label || 'Pendiente de aprobación';
    }

    if (typeof item.price === 'number') {
      return `$${item.price.toFixed(2)}`;
    }

    if (typeof item.price === 'string') {
      const normalized = item.price.trim();
      if (!normalized) {
        return '$0.00';
      }

      if (normalized.startsWith('$')) {
        return normalized;
      }

      const parsed = getNumericPrice(normalized);
      return `$${parsed.toFixed(2)}`;
    }

    return '$0.00';
  };

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return (
      colors[normalized as keyof typeof colors] ||
      'bg-gray-100 text-gray-800 border-gray-200'
    );
  };

  const getStatusIcon = (status: string) => {
    const normalized = normalizeStatus(status);
    const icons = {
      pending: 'ri-timer-line',
      ready: 'ri-check-line',
      completed: 'ri-check-double-line',
      cancelled: 'ri-close-line'
    };
    return icons[normalized as keyof typeof icons] || 'ri-question-line';
  };

  const getStatusLabel = (status: string) => {
    const normalized = normalizeStatus(status);
    const labels = {
      pending: 'Pending',
      ready: 'Ready for Pickup',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[normalized as keyof typeof labels] || normalized;
  };

  const getWorkflowSteps = (currentStatus: string) => {
    const status = normalizeStatus(currentStatus);
    if (status === 'cancelled') {
      return [
        {
          key: 'cancelled',
          label: 'Cancelled',
          icon: 'ri-close-line',
          isActive: true,
          isCurrent: true,
          isCompleted: false
        }
      ];
    }

    const steps = [
      { key: 'pending', label: 'Received', icon: 'ri-file-list-line' },
      { key: 'ready', label: 'Ready', icon: 'ri-check-line' },
      { key: 'completed', label: 'Delivered', icon: 'ri-check-double-line' }
    ];

    const currentIndex = steps.findIndex(step => step.key === status);

    return steps.map((step, index) => ({
      ...step,
      isActive: index <= currentIndex,
      isCurrent: step.key === status,
      isCompleted: index < currentIndex
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Header />
        <div className="pt-20 pb-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
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
            Track Order
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Track your order progress in real time
          </p>

          {!currentUser && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Order by Phone</h3>
              <div className="flex space-x-3">
                <input
                  type="tel"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={searchOrdersByPhone}
                  className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-6 py-3 rounded-lg font-medium !rounded-button hover:shadow-lg transition-all"
                >
                  <i className="ri-search-line"></i>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto mb-4">
                  <i className="ri-search-line text-pink-400 text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {currentUser ? 'No orders found' : 'No orders found'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {currentUser 
                    ? 'When you place an order, it will appear here so you can track its progress'
                    : 'Please verify that the phone number is correct'
                  }
                </p>
                {currentUser && (
                  <a 
                    href="/order" 
                    className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-6 py-3 rounded-lg font-medium !rounded-button inline-block"
                  >
                    Place Order
                  </a>
                )}
              </div>
            ) : (
              orders.map(order => {
                const specialRequests = formatSpecialRequests(order.special_requests);
                const pickupSummary = formatPickupDetails(order.pickup_date, order.pickup_time, 'en-US') || null;
                const pickupDateLabel = formatPickupDate(order.pickup_date, 'en-US');
                const pickupTimeLabel = (order.pickup_time || '').trim();

                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">Order #{order.p2p_reference ?? order.id.slice(-8)}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-pink-600">
                            {hasPendingPrice(order)
                              ? 'Precio pendiente'
                              : `$${order.total.toFixed(2)}`}
                          </p>
                          <div className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(order.status)}`}>
                            <i className={`${getStatusIcon(order.status)} mr-2`}></i>
                            {getStatusLabel(order.status)}
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <i className="ri-route-line text-pink-500 mr-2"></i>
                          Order Progress
                        </h4>
                        <div className="relative">
                          {(() => {
                            const steps = getWorkflowSteps(order.status);
                            const currentIndex = steps.findIndex(s => s.isCurrent);
                            const progressWidth =
                              steps.length > 1 && currentIndex >= 0
                                ? (currentIndex / (steps.length - 1)) * 100
                                : 0;
                            return (
                              <>
                                <div className="flex items-center justify-between">
                                  {steps.map(step => (
                                    <div key={step.key} className="flex flex-col items-center relative z-10">
                                      <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                                          step.isCompleted
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : step.isCurrent
                                              ? 'bg-pink-500 border-pink-500 text-white animate-pulse'
                                              : step.isActive
                                                ? 'bg-pink-100 border-pink-300 text-pink-600'
                                                : 'bg-gray-100 border-gray-300 text-gray-400'
                                        }`}
                                      >
                                        <i className={`${step.icon} text-lg`}></i>
                                      </div>
                                      <p
                                        className={`text-xs font-medium mt-2 text-center ${
                                          step.isActive ? 'text-gray-800' : 'text-gray-400'
                                        }`}
                                      >
                                        {step.label}
                                      </p>
                                      {step.isCurrent && (
                                        <div className="absolute -bottom-8 bg-pink-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                                          In progress
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {steps.length > 1 && (
                                  <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 -z-10">
                                    <div
                                      className="h-full bg-gradient-to-r from-pink-400 to-green-400 transition-all duration-1000"
                                      style={{ width: `${progressWidth}%` }}
                                    ></div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {(pickupSummary || pickupDateLabel || pickupTimeLabel) && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-200">
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                              <i className="ri-calendar-line text-blue-600"></i>
                            </div>
                            <div>
                              <p className="font-semibold text-blue-800">Pickup Schedule</p>
                              {pickupDateLabel && (
                                <p className="text-blue-700">{pickupDateLabel}</p>
                              )}
                              {pickupTimeLabel && (
                                <p className="text-blue-700">{pickupTimeLabel}</p>
                              )}
                              {pickupSummary && pickupSummary !== pickupTimeLabel && (
                                <p className="text-xs text-blue-600 mt-1">{pickupSummary}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                            <i className="ri-shopping-bag-line text-pink-500 mr-2"></i>
                            Your Order Items
                          </h4>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start space-x-3">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-sm">
                                  {item.quantity}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700 block">{item.name}</span>
                                  {item.details && (
                                    <p className="text-xs text-gray-500 whitespace-pre-line mt-1">{item.details}</p>
                                  )}
                                </div>
                              </div>
                              <span className="font-bold text-gray-800">{formatItemPrice(item)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {specialRequests.length > 0 && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-l-4 border-yellow-400">
                          <div className="flex items-start space-x-3">
                            <i className="ri-lightbulb-line text-yellow-600 mt-0.5"></i>
                            <div>
                              <p className="font-bold text-yellow-800">Special Requests:</p>
                              <ul className="mt-2 space-y-1 text-sm">
                                {specialRequests.map((entry, idx) => (
                                  <li key={`${order.id}-special-${idx}`} className="flex items-start">
                                    <span className="mt-1 mr-2 text-yellow-500">•</span>
                                    <div className="text-yellow-700">
                                      {entry.label ? (
                                        <span>
                                          <span className="font-medium text-yellow-800">{entry.label}:</span>{' '}
                                          {entry.value}
                                        </span>
                                      ) : (
                                        entry.value
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4 space-y-2 text-sm">
                        {hasPendingPrice(order) ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                            <div className="flex items-start space-x-3">
                              <i className="ri-hourglass-2-line mt-0.5 text-lg"></i>
                              <div>
                                <p className="font-semibold">Precio pendiente de aprobación</p>
                                <p className="text-xs text-amber-700">
                                  La panadería está revisando tu orden. Te avisaremos cuando el precio esté listo para realizar el pago.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subtotal:</span>
                              <span>${order.subtotal.toFixed(2)}</span>
                            </div>
                            {order.tax > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Impuestos:</span>
                                <span>${order.tax.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                              <span>Total:</span>
                              <span className="text-pink-600">${order.total.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {order.payment_status === 'pending' && !hasPendingPrice(order) && (
                        <div className="mt-4">
                          <a
                            href={`/order?orderId=${order.id}`}
                            className="block w-full text-center bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 rounded-lg font-bold"
                          >
                            Pagar ${order.total.toFixed(2)}
                          </a>
                        </div>
                      )}

                      {order.status === 'ready' && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white text-center">
                          <div className="flex items-center justify-center mb-2">
                            <i className="ri-check-double-line text-2xl mr-2"></i>
                            <span className="font-bold text-lg">Your order is ready!</span>
                          </div>
                          <p className="text-green-100">You can come pick it up whenever you like</p>
                        </div>
                      )}

                      {order.status === 'completed' && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white text-center">
                          <div className="flex items-center justify-center mb-2">
                            <i className="ri-gift-line text-2xl mr-2"></i>
                            <span className="font-bold text-lg">Order completed!</span>
                          </div>
                          <p className="text-blue-100">Thank you for choosing our bakery</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
