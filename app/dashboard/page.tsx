
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Order } from '../../lib/supabase';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import CalendarView from './CalendarView';
import UserManagement from './UserManagement';
import OrderList from './OrderList';
import QuoteList from './QuoteList';
import { Quote, QuoteStatus } from './types';

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
  const [showTodayView, setShowTodayView] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
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
        error: authError,
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userData, error: profileError } = await supabase
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
      if (!user_data.isOwner) {
        router.push('/');
        return;
      }

      setCurrentUser({
        role: 'owner',
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
        if (user_data.isOwner) {
          setCurrentUser({
            role: 'owner',
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
                const { data: signed } = await supabase.storage
                  .from('temp-uploads')
                  .createSignedUrl(item.photoUrl, 60 * 60);
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
            const { data: signed } = await supabase.storage
              .from('temp-uploads')
              .createSignedUrl(quote.reference_photo_url, 60 * 60);
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
      const orderData = {
        customer_name: quote.customer_name,
        customer_phone: quote.customer_phone || '',
        customer_email: quote.customer_email || '',
        items: [],
        subtotal: quote.estimated_price || 0,
        tax: 0,
        total: quote.estimated_price || 0,
        status: 'pending',
        payment_status: 'pending',
        order_date: now,
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
  };

  // -------------------------------------------------------------------------
  // Order deletion handling
  // -------------------------------------------------------------------------
  const handleDeleteOrder = async (orderId: string) => {
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
                ${getTotalRevenue().toFixed(0)}
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
                <OrderList
                  orders={orders}
                  currentUser={currentUser}
                  showSuccessMessage={showSuccessMessage}
                  onStatusUpdate={updateOrderStatus}
                  onDelete={handleDeleteOrder}
                  setShowTodayView={setShowTodayView}
                />
              )}

              {/* Quotes Tab */}
              {activeTab === 'quotes' && (
                <QuoteList
                  quotes={quotes}
                  showSuccessMessage={showSuccessMessage}
                  onStatusUpdate={updateQuoteStatus}
                  onFinalize={finalizeQuote}
                  onDelete={handleDeleteQuote}
                />
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

  function getQuotesByStatus(status: QuoteStatus) {
    return quotes.filter((quote) => quote.status === status);
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

