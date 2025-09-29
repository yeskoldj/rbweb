
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Order } from '../../lib/supabase';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import CalendarView from './CalendarView';
import UserManagement from './UserManagement';

type QuoteStatus = 'pending' | 'responded' | 'accepted' | 'rejected';

interface Quote {
  id: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  occasion?: string | null;
  age_group?: string | null;
  theme?: string | null;
  servings?: string | null;
  budget?: string | null;
  event_date?: string | null;
  event_details?: string | null;
  has_reference_photo?: boolean;
  photo_description?: string | null;
  reference_photo_url?: string | null;
  status: QuoteStatus;
  created_at: string;
  estimated_price?: number | null;
  admin_notes?: string | null;
  responded_at?: string | null;
  updated_at?: string | null;
  cart_items?: any[];
  requires_cake_quote?: boolean;
  pickup_time?: string | null;
  special_requests?: string | null;
  reference_code?: string | null;
}

const quoteStatusColors: Record<QuoteStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  responded: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function DashboardPage() {
  // -------------------------------------------------------------------------
  // State declarations (original + new ones needed for quote handling)
  // -------------------------------------------------------------------------
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<string | null>(null);
  const [deleteOrderConfirmation, setDeleteOrderConfirmation] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [employeeCancelRequest, setEmployeeCancelRequest] = useState<string | null>(null);
  const [pendingCancelRequests, setPendingCancelRequests] = useState<{[key: string]: any}>({});
  const router = useRouter();

  // -------------------------------------------------------------------------
  // Authentication & data loading
  // -------------------------------------------------------------------------
  useEffect(() => {
    checkAuthAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userData && (userData.role === 'owner' || userData.role === 'employee')) {
          setCurrentUser(userData);
          setIsAuthenticated(true);
          await Promise.all([loadOrdersFromSupabase(), loadQuotesFromSupabase()]);
          setLoading(false);
          return;
        }
      }

      const userData = localStorage.getItem('bakery-user');
      if (!userData) {
        router.push('/auth');
        return;
      }

      const user_data = JSON.parse(userData);
      if (!['owner', 'employee'].includes(user_data.role)) {
        router.push('/');
        return;
      }

      setCurrentUser({
        role: user_data.role,
        email: user_data.email,
        full_name: user_data.fullName || user_data.email.split('@')[0],
      });
      setIsAuthenticated(true);
      await Promise.all([loadOrdersFromSupabase(), loadQuotesFromSupabase()]);
    } catch (error) {
      console.error('Auth error:', error);
      const userData = localStorage.getItem('bakery-user');
      if (userData) {
        const user_data = JSON.parse(userData);
        if (['owner', 'employee'].includes(user_data.role)) {
          setCurrentUser({
            role: user_data.role,
            email: user_data.email,
            full_name: user_data.fullName || user_data.email.split('@')[0],
          });
          setIsAuthenticated(true);
          await Promise.all([loadOrdersFromSupabase(), loadQuotesFromSupabase()]);
        }
      }
    }
    setLoading(false);
  };

  // -------------------------------------------------------------------------
  // Data fetching helpers
  // -------------------------------------------------------------------------
  const loadOrdersFromSupabase = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders from Supabase:', error);
        loadOrdersFromLocal();
        return;
      }

      console.log('Orders loaded from Supabase:', orders);

      const ordersWithUrls = await Promise.all(
        (orders || []).map(async (order: any) => {
          const itemsArray = Array.isArray(order.items) ? order.items : [];
          const itemsWithUrls = await Promise.all(
            itemsArray.map(async (item: any) => {
              if (item.photoUrl) {
                if (/^https?:\/\//.test(item.photoUrl)) {
                  return item;
                }
                const { data: signed, error: signError } = await supabase.storage
                  .from('temp-uploads')
                  .createSignedUrl(`photo-cakes/${item.photoUrl}`, 60 * 60);
                if (signError) {
                  console.error('Error creating signed URL for order photo:', signError);
                  return item;
                }
                return { ...item, photoUrl: signed?.signedUrl };
              }
              return item;
            })
          );
          return { ...order, items: itemsWithUrls };
        })
      );

      setOrders(ordersWithUrls);
    } catch (error) {
      console.error('Supabase connection error:', error);
      loadOrdersFromLocal();
    }
  };

  const loadOrdersFromLocal = () => {
    const savedOrders = JSON.parse(localStorage.getItem('bakery-orders') || '[]');

    if (savedOrders.length === 0) {
      const testOrder: Order = {
        id: crypto.randomUUID(),
        p2p_reference: 'P2P-TEST',
        user_id: undefined,
        customer_name: 'Maria Gonzalez',
        customer_phone: '(555) 123-4567',
        customer_email: 'maria.gonzalez@email.com',
        items: [
          {
            id: 'cake-1',
            name: 'Chocolate Cake',
            price: '$25.99',
            quantity: 1,
          },
          {
            id: 'cupcakes-1',
            name: 'Vanilla Cupcakes',
            price: '$3.50 each',
            quantity: 6,
          },
        ],
        subtotal: 46.99,
        tax: 1.41,
        total: 48.4,
        status: 'pending',
        pickup_time: '2:00 PM',
        special_requests: 'Please include a birthday candle',
        payment_type: 'zelle',
        payment_status: 'completed',
        order_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      savedOrders.push(testOrder);
      localStorage.setItem('bakery-orders', JSON.stringify(savedOrders));
    }

    setOrders(savedOrders);
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    // If trying to cancel and user is employee, require owner confirmation
    if (newStatus === 'cancelled' && currentUser?.role === 'employee') {
      setEmployeeCancelRequest(orderId);
      return;
    }


    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order in Supabase:', error);
        updateOrderStatusLocal(orderId, newStatus);
        return;
      }

      const updatedOrders = orders.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      );
      setOrders(updatedOrders);

      console.log(`Order ${orderId} updated to ${newStatus}`);
    } catch (error) {
      console.error('Supabase update error:', error);
      updateOrderStatusLocal(orderId, newStatus);
    }
  };
    const handleCalendarStatusUpdate = (orderId: string, newStatus: string) => {
    void updateOrderStatus(orderId, newStatus as Order['status']);
  };
  const updateOrderStatusLocal = (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
        : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('bakery-orders', JSON.stringify(updatedOrders));
  };

  const loadQuotesFromSupabase = async () => {
    try {
      const { data: quotesData, error }: { data: Quote[] | null; error: any } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading quotes from Supabase:', error);
        return;
      }

      const quotesWithUrls: Quote[] = await Promise.all(
        (quotesData || []).map(async (quote: Quote) => {
          if (quote.reference_photo_url) {
            if (/^https?:\/\//.test(quote.reference_photo_url)) {
              return quote;
            }
            const { data: signed, error: signError } = await supabase.storage
              .from('temp-uploads')
              .createSignedUrl(`photo-cakes/${quote.reference_photo_url}`, 60 * 60);
            if (signError) {
              console.error('Error creating signed URL for quote photo:', signError);
              return quote;
            }
            return { ...quote, reference_photo_url: signed?.signedUrl || null };
          }
          return quote;
        })
      );

      console.log('Quotes loaded from Supabase:', quotesWithUrls);
      setQuotes(quotesWithUrls);
    } catch (error) {
      console.error('Supabase quotes connection error:', error);
    }
  };

  const updateQuoteStatus = async (
    quoteId: string,
    newStatus: QuoteStatus,
    estimatedPrice?: number,
    adminNotes?: string
  ) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (estimatedPrice !== undefined) {
        updateData.estimated_price = estimatedPrice;
      }

      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase.from('quotes').update(updateData).eq('id', quoteId);

      if (error) {
        console.error('Error updating quote in Supabase:', error);
        return;
      }

      const updatedQuotes = quotes.map((quote) =>
        quote.id === quoteId ? { ...quote, ...updateData } : quote
      );
      setQuotes(updatedQuotes);

      console.log(`Quote ${quoteId} updated to ${newStatus}`);
    } catch (error) {
      console.error('Supabase quote update error:', error);
    }
  };

  const finalizeQuote = async (quote: Quote) => {
    try {
      const now = new Date().toISOString();
      const fallbackItems = [
        {
          name: quote.occasion
            ? `Cotización ${quote.occasion}`
            : 'Cotización personalizada',
          quantity: 1,
          price: quote.estimated_price || 0,
          details:
            quote.event_details ||
            'Detalle de cotización sin lista de carrito disponible.',
        },
      ];

      const orderItems = (quote.cart_items && quote.cart_items.length > 0
        ? quote.cart_items
        : fallbackItems).map((item: any) => ({
          ...item,
          price_label: item?.price_label || item?.priceLabel || 'Incluido en total',
          isPricePending: item?.isPricePending ?? true,
        }));

      const subtotal = quote.estimated_price || 0;
      const tax = Number((subtotal * 0.03).toFixed(2));
      const total = Number((subtotal + tax).toFixed(2));

      const orderData = {
        customer_name: quote.customer_name,
        customer_phone: quote.customer_phone || '',
        customer_email: quote.customer_email || '',
        items: orderItems,
        subtotal,
        tax,
        total,
        status: 'pending',
        payment_status: 'pending',
        order_date: now,
        pickup_time: quote.pickup_time || null,
        special_requests: quote.special_requests || quote.event_details || null,
        created_at: now,
        updated_at: now,
      } as any;

      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order from quote:', orderError);
        return;
      }

      await supabase
        .from('quotes')
        .update({ status: 'accepted', updated_at: now })
        .eq('id', quote.id);

      setQuotes((prev) => prev.filter((q) => q.id !== quote.id));
      setOrders((prev) => [insertedOrder as Order, ...prev]);
      setShowSuccessMessage('✅ Cotización finalizada, orden creada');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error finalizing quote:', error);
    }
  };

  // -------------------------------------------------------------------------
  // Employee cancel request handling
  // -------------------------------------------------------------------------
  const handleEmployeeCancelRequest = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Add to pending requests for owner approval
    setPendingCancelRequests(prev => ({
      ...prev,
      [orderId]: {
        order: order,
        requestedBy: currentUser?.full_name || currentUser?.email || 'Empleado',
        requestedAt: new Date().toISOString()
      }
    }));

    setEmployeeCancelRequest(null);
    setShowSuccessMessage('✅ Solicitud de cancelación enviada al propietario');
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const handleOwnerCancelApproval = async (orderId: string, approved: boolean) => {
    if (approved) {
      await updateOrderStatus(orderId, 'cancelled');
      setShowSuccessMessage('✅ Pedido cancelado por solicitud de empleado');
    } else {
      setShowSuccessMessage('❌ Solicitud de cancelación rechazada');
    }

    // Remove from pending requests
    setPendingCancelRequests(prev => {
      const updated = { ...prev };
      delete updated[orderId];
      return updated;
    });

    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  // -------------------------------------------------------------------------
  // Quote deletion handling
  // -------------------------------------------------------------------------
  const handleDeleteQuote = async (quoteId: string) => {
    setDeletingQuote(quoteId);

    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) {
        console.error('Error deleting quote from Supabase:', error);
        alert('Error al eliminar la cotización. Por favor intenta de nuevo.');
        return;
      }

      // Update local state
      setQuotes(quotes.filter((quote) => quote.id !== quoteId));

      // Show success message
      setShowSuccessMessage('✅ Cotización eliminada correctamente');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Error al eliminar la cotización. Por favor intenta de nuevo.');
    }

    setDeletingQuote(null);
    setDeleteConfirmation(null);
  };

  // -------------------------------------------------------------------------
  // Order deletion handling
  // -------------------------------------------------------------------------
  const handleDeleteOrder = async (orderId: string) => {
    setDeletingOrder(orderId);

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Error deleting order from Supabase:', error);
        // Fallback to local deletion
        deleteOrderFromLocal(orderId);
      } else {
        // Update local state
        setOrders(orders.filter((order) => order.id !== orderId));
      }

      // Show success message
      setShowSuccessMessage('✅ Pedido eliminado correctamente');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting order:', error);
      // Fallback to local deletion
      deleteOrderFromLocal(orderId);
    }

    setDeletingOrder(null);
    setDeleteOrderConfirmation(null);
  };

  const deleteOrderFromLocal = (orderId: string) => {
    const updatedOrders = orders.filter((order) => order.id !== orderId);
    setOrders(updatedOrders);
    localStorage.setItem('bakery-orders', JSON.stringify(updatedOrders));
    
    setShowSuccessMessage('✅ Pedido eliminado correctamente');
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  // -------------------------------------------------------------------------
  // UI helpers
  // -------------------------------------------------------------------------
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    baking: 'bg-orange-100 text-orange-800',
    decorating: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const getUserDisplayName = () => {
    if (currentUser?.full_name) {
      return currentUser.full_name;
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'Usuario';
  };

  const getUserRole = () => {
    if (currentUser?.role === 'owner') {
      return 'Propietario';
    }
    if (currentUser?.role === 'employee') {
      return 'Empleado';
    }
    return 'Usuario';
  };

  // -------------------------------------------------------------------------
  // Loading / auth UI
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Header />
        <div className="pt-20 pb-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // -------------------------------------------------------------------------
  // Main dashboard UI
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-20 pb-20">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-amber-800">
                Dashboard de {getUserDisplayName()}
              </h1>
              <p className="text-sm text-gray-600">{getUserRole()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Pedidos de Hoy</p>
              <p className="text-xl font-bold text-pink-600">{getTodayOrders().length}</p>
            </div>
          </div>

          {/* Owner Approval Requests - Only show for owners */}
          {currentUser?.role === 'owner' && Object.keys(pendingCancelRequests).length > 0 && (
            <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-xl p-4 mb-6 border-l-4 border-red-400">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 flex items-center justify-center bg-red-400 rounded-full mr-3">
                  <i className="ri-alert-line text-white"></i>
                </div>
                <h3 className="text-lg font-bold text-red-800">Solicitudes de Cancelación Pendientes</h3>
              </div>
              
              <div className="space-y-3">
                {Object.entries(pendingCancelRequests).map(([orderId, request]) => (
                  <div key={orderId} className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-800">{request.order.customer_name}</h4>
                        <p className="text-sm text-gray-600">Pedido #{request.order.p2p_reference ?? orderId.slice(-8)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">${request.order.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Solicitado por: {request.requestedBy}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => handleOwnerCancelApproval(orderId, true)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        <i className="ri-check-line mr-2"></i>
                        Aprobar Cancelación
                      </button>
                      <button
                        onClick={() => handleOwnerCancelApproval(orderId, false)}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        <i className="ri-close-line mr-2"></i>
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee Cancel Request Modal */}
          {employeeCancelRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 flex items-center justify-center bg-yellow-100 rounded-full mx-auto mb-4">
                    <i className="ri-shield-user-line text-yellow-600 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Autorización Requerida</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    Solo los propietarios pueden cancelar pedidos. ¿Deseas enviar una solicitud de cancelación al propietario?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setEmployeeCancelRequest(null)}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleEmployeeCancelRequest(employeeCancelRequest)}
                      className="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                    >
                      Enviar Solicitud
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-gray-600">Pendientes</p>
              <p className="text-lg font-bold text-yellow-600">{getOrdersByStatus('pending').length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-gray-600">Horneando</p>
              <p className="text-lg font-bold text-orange-600">{getOrdersByStatus('baking').length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-gray-600">Cotizaciones</p>
              <p className="text-lg font-bold text-purple-600">{getPendingQuotes().length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-gray-600">Ingresos</p>
              <p className="text-lg font-bold text-blue-600">
                ${getTotalRevenue().toFixed(2)}
              </p>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden">
            <div className="flex border-b">
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  activeTab === 'orders'
                    ? 'bg-pink-50 text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-600'
                }`}
                onClick={() => setActiveTab('orders')}
              >
                Pedidos
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium relative ${
                  activeTab === 'quotes'
                    ? 'bg-pink-50 text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-600'
                }`}
                onClick={() => setActiveTab('quotes')}
              >
                Cotizaciones
                {getPendingQuotes().length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {getPendingQuotes().length}
                  </span>
                )}
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  activeTab === 'calendar'
                    ? 'bg-pink-50 text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-600'
                }`}
                onClick={() => setActiveTab('calendar')}
              >
                Calendario
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  activeTab === 'users'
                    ? 'bg-pink-50 text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-600'
                }`}
                onClick={() => setActiveTab('users')}
              >
                {currentUser?.role === 'owner' ? 'Usuarios' : 'Mi Perfil'}
              </button>
            </div>

            <div className="p-4">
              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {showSuccessMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <i className="ri-check-line text-green-600"></i>
                        </div>
                        <p className="ml-3 text-green-700 font-medium">{showSuccessMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Delete Order Confirmation Modal */}
                  {deleteOrderConfirmation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
                        <div className="text-center">
                          <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-4">
                            <i className="ri-delete-bin-line text-red-500 text-2xl"></i>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar Pedido?</h3>
                          <p className="text-gray-600 text-sm mb-6">
                            Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
                          </p>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => setDeleteOrderConfirmation(null)}
                              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(deleteOrderConfirmation)}
                              disabled={deletingOrder === deleteOrderConfirmation}
                              className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {deletingOrder === deleteOrderConfirmation ? (
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Eliminando...
                                </div>
                              ) : (
                                'Eliminar'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-pink-400 to-teal-400 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Vista Rápida</h3>
                        <p className="text-sm opacity-90">
                          Gestiona los pedidos de hoy eficientemente
                        </p>
                      </div>
                      <button
                        onClick={() => setShowTodayView(true)}
                        className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium !rounded-button hover:bg-white/30 transition-all transform hover:scale-105 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">Hoy</p>
                            <p className="text-sm text-white/90">{getTodayOrders().length} pedido{getTodayOrders().length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex space-x-1 ml-3">
                            <div className="w-6 h-6 rounded-full bg-white/30 text-white text-xs flex items-center justify-center font-medium">
                              {getTodayOrders().length}
                            </div>
                            <i className="ri-arrow-right-line text-lg ml-2"></i>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Orders list or empty state */}
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                        <i className="ri-shopping-bag-line text-gray-400 text-2xl"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay pedidos aún</h3>
                      <p className="text-gray-600 text-sm">
                        Los pedidos aparecerán aquí cuando los clientes los
                        realicen
                      </p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-pink-400 via-purple-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {order.customer_name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800 text-lg">{order.customer_name}</h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <i className="ri-time-line"></i>
                                  <span>{order.pickup_time || 'Hora no especificada'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-pink-600">${order.total.toFixed(2)}</p>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]} shadow-sm`}
                                >
                                  <i
                                    className={`${
                                      order.status === 'pending'
                                        ? 'ri-timer-line'
                                        : order.status === 'baking'
                                        ? 'ri-fire-line'
                                        : order.status === 'decorating'
                                        ? 'ri-brush-line'
                                        : order.status === 'ready'
                                        ? 'ri-check-line'
                                        : order.status === 'completed'
                                        ? 'ri-check-double-line'
                                        : 'ri-close-line'
                                    } mr-1`}
                                  ></i>
                                  {order.status === 'pending'
                                    ? 'Pendiente'
                                    : order.status === 'baking'
                                    ? 'Horneando'
                                    : order.status === 'decorating'
                                    ? 'Decorando'
                                    : order.status === 'ready'
                                    ? 'Listo'
                                    : order.status === 'completed'
                                    ? 'Completado'
                                    : 'Cancelado'}
                                </span>
                              </div>
                              {/* Only show delete button for owners */}
                              {currentUser?.role === 'owner' && (
                                <button
                                  onClick={() => setDeleteOrderConfirmation(order.id)}
                                  className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                                  title="Eliminar pedido"
                                >
                                  <i className="ri-delete-bin-line text-sm"></i>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                              <i className="ri-shopping-bag-line mr-2"></i>
                              Items del pedido:
                            </h4>
                            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-xs">
                                      {item.quantity}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                  </div>
                                  <span className="text-sm font-bold text-gray-800">{item.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {order.special_requests && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-l-4 border-yellow-400">
                              <div className="flex items-start space-x-2">
                                <i className="ri-lightbulb-line text-yellow-600 mt-0.5"></i>
                                <div>
                                  <p className="text-sm font-bold text-yellow-800">Solicitud Especial:</p>
                                  <p className="text-sm text-yellow-700">{order.special_requests}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'baking')}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
                              >
                                <i className="ri-fire-line mr-2"></i>
                                Iniciar Horneado
                              </button>
                            )}
                            {order.status === 'baking' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'decorating')}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
                              >
                                <i className="ri-brush-line mr-2"></i>
                                Iniciar Decoración
                              </button>
                            )}
                            {order.status === 'decorating' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
                              >
                                <i className="ri-check-line mr-2"></i>
                                Marcar Listo
                              </button>
                            )}
                            {order.status === 'ready' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-lg"
                              >
                                <i className="ri-check-double-line mr-2"></i>
                                Completar Pedido
                              </button>
                            )}
                            
                            {/* Cancel button - different behavior for owners vs employees */}
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg"
                                title={currentUser?.role === 'employee' ? 'Solicitar cancelación al propietario' : 'Cancelar pedido'}
                              >
                                <i className="ri-close-line mr-2"></i>
                                {currentUser?.role === 'employee' ? 'Solicitar Cancelar' : 'Cancelar'}
                              </button>
                            )}
                            
                            <button
                              onClick={() => window.open(`tel:${order.customer_phone}`, '_self')}
                              className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105 shadow-lg"
                            >
                              <i className="ri-phone-line text-lg"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Quotes Tab */}
              {activeTab === 'quotes' && (
                <div className="space-y-4">
                  {showSuccessMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <i className="ri-check-line text-green-600"></i>
                        </div>
                        <p className="ml-3 text-green-700 font-medium">{showSuccessMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Delete Confirmation Modal */}
                  {deleteConfirmation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
                        <div className="text-center">
                          <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-4">
                            <i className="ri-delete-bin-line text-red-500 text-2xl"></i>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar Cotización?</h3>
                          <p className="text-gray-600 text-sm mb-6">
                            Esta acción no se puede deshacer. La cotización será eliminada permanentemente.
                          </p>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => setDeleteConfirmation(null)}
                              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleDeleteQuote(deleteConfirmation)}
                              disabled={deletingQuote === deleteConfirmation}
                              className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {deletingQuote === deleteConfirmation ? (
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Eliminando...
                                </div>
                              ) : (
                                'Eliminar'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {quotes.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                        <i className="ri-file-list-line text-gray-400 text-2xl"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No hay cotizaciones</h3>
                      <p className="text-gray-600">Las nuevas cotizaciones aparecerán aquí</p>
                    </div>
                  ) : (
                    quotes.map((quote) => (
                      <QuoteCard
                        key={quote.id}
                        quote={quote}
                        onStatusUpdate={updateQuoteStatus}
                        onFinalize={finalizeQuote}
                        onDelete={(id: string) => setDeleteConfirmation(id)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Calendar Tab */}
              {activeTab === 'calendar' && (
                <CalendarView orders={orders} onStatusUpdate={handleCalendarStatusUpdate} />
              )}

              {/* Users / Profile Tab */}
              {activeTab === 'users' && <UserManagement />}
            </div>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );

  // -------------------------------------------------------------------------
  // Data derived helpers (moved here to be accessible)
  // -------------------------------------------------------------------------
  function getTodayOrders() {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter((order) => order.order_date === today);
  }

  function getOrdersByStatus(status: Order['status']) {
    return orders.filter((order) => order.status === status);
  }

  function getPendingQuotes() {
    return quotes.filter((quote) => quote.status === 'pending');
  }

  function getTotalRevenue() {
    return orders.reduce((total, order) => {
      if (order.status === 'completed') {
        return total + order.total;
      }
      return total;
    }, 0);
  }
}

// -----------------------------------------------------------------------------
// QuoteCard component (kept for possible reuse)
// -----------------------------------------------------------------------------
function QuoteCard({ quote, onStatusUpdate, onFinalize, onDelete }: { quote: Quote; onStatusUpdate: (id: string, status: QuoteStatus, estimatedPrice?: number, adminNotes?: string) => void; onFinalize: (quote: Quote) => void; onDelete: (id: string) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<string>(
    quote.estimated_price ? String(quote.estimated_price) : ''
  );
  const [adminNotes, setAdminNotes] = useState(quote.admin_notes || '');

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      responded: 'Respondida',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
    };
    return statusMap[status] || status;
  };

  const handleRespond = () => {
    if (!estimatedPrice) {
      alert('Por favor ingresa un precio estimado');
      return;
    }
    onStatusUpdate(quote.id, 'responded', parseFloat(estimatedPrice), adminNotes);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-400">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{quote.customer_name}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <i className="ri-phone-line mr-1"></i>
              <span>{quote.customer_phone}</span>
            </div>
            {quote.customer_email && (
              <div className="flex items-center">
                <i className="ri-mail-line mr-1"></i>
                <span>{quote.customer_email}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end text-right space-y-1">
          <button
            onClick={() => onDelete(quote.id)}
            className="text-gray-400 hover:text-red-500"
            title="Eliminar cotización"
          >
            <i className="ri-delete-bin-line"></i>
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${quoteStatusColors[quote.status as QuoteStatus]} shadow-sm`}>
            {getStatusText(quote.status)}
          </span>
          <p className="text-xs text-gray-500">{new Date(quote.created_at).toLocaleDateString('es-ES')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        {quote.occasion && (
          <div>
            <span className="text-gray-600">Ocasión:</span>
            <span className="ml-2 font-medium capitalize">{quote.occasion}</span>
          </div>
        )}
        {quote.servings && (
          <div>
            <span className="text-gray-600">Porciones:</span>
            <span className="ml-2 font-medium">{quote.servings}</span>
          </div>
        )}
        {quote.budget && (
          <div>
            <span className="text-gray-600">Presupuesto:</span>
            <span className="ml-2 font-medium capitalize">{quote.budget}</span>
          </div>
        )}
        {quote.event_date && (
          <div>
            <span className="text-gray-600">Fecha del evento:</span>
            <span className="ml-2 font-medium">{new Date(quote.event_date).toLocaleDateString('es-ES')}</span>
          </div>
        )}
      </div>

      {quote.theme && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Tema/Estilo:</p>
          <p className="text-sm text-gray-600">{quote.theme}</p>
        </div>
      )}

      {quote.has_reference_photo && quote.photo_description && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm font-medium text-blue-800 mb-1">Foto de Referencia:</p>
          <p className="text-sm text-blue-700">{quote.photo_description}</p>
          {quote.reference_photo_url && (
            <div className="mt-2">
              <img src={quote.reference_photo_url} alt="Referencia" className="max-w-full h-32 object-cover rounded" />
            </div>
          )}
        </div>
      )}

      {quote.event_details && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
          <p className="text-sm font-medium text-amber-800 mb-1">Detalles del Evento:</p>
          <p className="text-sm text-amber-700">{quote.event_details}</p>
        </div>
      )}

      {quote.requires_cake_quote && (
        <div className="mb-4 p-3 bg-pink-50 rounded-lg border-l-4 border-pink-400">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-pink-800">Personalización del pastel</p>
            {quote.reference_code && (
              <span className="text-xs font-medium text-pink-600">Ref: {quote.reference_code}</span>
            )}
          </div>
          <div className="space-y-2">
            {(quote.cart_items || []).map((item, index) => (
              <div key={`${quote.id}-item-${index}`} className="bg-white rounded-md p-2 shadow-sm border border-pink-100">
                <p className="text-sm font-semibold text-gray-800">
                  {item.quantity || 1}x {item.name}
                </p>
                {item.details && (
                  <p className="text-xs text-gray-600 whitespace-pre-line mt-1">{item.details}</p>
                )}
                {!item.details && item.customization && (
                  <p className="text-xs text-gray-600 mt-1">
                    {Object.entries(item.customization)
                      .filter(([, value]) => value && typeof value === 'string')
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(' | ')}
                  </p>
                )}
              </div>
            ))}
          </div>
          {quote.pickup_time && (
            <p className="text-xs text-pink-700 mt-2">
              Hora preferida de recogida: <span className="font-semibold">{quote.pickup_time}</span>
            </p>
          )}
          {quote.special_requests && (
            <p className="text-xs text-pink-700 mt-1 whitespace-pre-line">Notas: {quote.special_requests}</p>
          )}
        </div>
      )}

      <button onClick={() => setShowDetails(!showDetails)} className="text-purple-600 text-sm font-medium hover:text-purple-700 mb-4">
        {showDetails ? 'Ocultar opciones' : 'Responder cotización'}
        <i className={`ri-arrow-${showDetails ? 'up' : 'down'}-s-line ml-1`}></i>
      </button>

      {showDetails && quote.status === 'pending' && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Estimado ($)</label>
              <input
                type="number"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                placeholder="85.00"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas Internas</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            El sistema añadirá automáticamente un 3% adicional si el cliente paga con tarjeta.
          </p>

          <div className="flex space-x-2">
            <button
              onClick={handleRespond}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg text-sm font-bold hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              <i className="ri-check-line mr-2"></i>
              Enviar Respuesta
            </button>
            <button
              onClick={() => onStatusUpdate(quote.id, 'rejected')}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all"
            >
              <i className="ri-close-line mr-2"></i>
              Rechazar
            </button>
            <button
              onClick={() => window.open(`tel:${quote.customer_phone}`, '_self')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <i className="ri-phone-line"></i>
            </button>
          </div>
        </div>
      )}

      {quote.estimated_price && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-green-800">Precio Cotizado:</p>
              <p className="text-lg font-bold text-green-700">${quote.estimated_price}</p>
            </div>
            {quote.admin_notes && (
              <div className="text-right">
                <p className="text-xs text-green-600">Notas: {quote.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {quote.status === 'responded' && (
        <button
          onClick={() => onFinalize(quote)}
          className="mt-4 w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 px-4 rounded-lg text-sm font-bold hover:from-pink-600 hover:to-purple-600 transition-all"
        >
          Finalizar y Crear Orden
        </button>
      )}
    </div>
  );
}
