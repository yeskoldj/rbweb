
'use client';

import { useState, useEffect, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Order, OrderStatus } from '../../lib/supabase';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import SafeImage from '@/components/SafeImage';
import { extractItemDetails, getItemPhotoUrl } from '@/lib/orderItemFormatting';
import { extractSpecialRequestNotes } from '@/lib/specialRequestParsing';
import { normalizeOrderDate } from '@/lib/orderDateUtils';
import {
  withSignedPhotoUrls,
  collectPhotoStoragePaths,
  clearSignedPhotoData,
  getSignedQuotePhotoUrl,
  prepareItemsForPersistence,
} from '@/lib/orderPhotoStorage';
import CalendarView from './CalendarView';
import UserManagement from './UserManagement';
import { openPhotoPrintWindow } from '@/lib/photoPrinting';

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
  cart_items?: OrderItem[] | null;
  requires_cake_quote?: boolean;
  pickup_date?: string | null;
  pickup_time?: string | null;
  special_requests?: string | null;
  reference_code?: string | null;
}

interface OrderItem {
  name: string;
  quantity: number;
  price?: number | string | null;
  price_label?: string | null;
  isPricePending?: boolean;
  details?: string | null;
  photoUrl?: string | null;
  type?: string | null;
  customization?: Record<string, unknown> | null;
  photoStoragePath?: string | null;
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
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [showTodayView, setShowTodayView] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<string | null>(null);
  const [deleteOrderConfirmation, setDeleteOrderConfirmation] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [employeeCancelRequest, setEmployeeCancelRequest] = useState<string | null>(null);
  const [pendingCancelRequests, setPendingCancelRequests] = useState<{[key: string]: any}>({});
  const [priceApprovalOrder, setPriceApprovalOrder] = useState<Order | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
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

      if (authError || !user) {
        router.push('/auth');
        return;
      }

      const { data: userData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !userData) {
        console.error('No se pudo cargar el perfil del usuario actual:', profileError);
        router.push('/auth');
        return;
      }

      if (!['owner', 'employee'].includes(userData.role)) {
        router.push('/');
        return;
      }

      setCurrentUser(userData);
      setIsAuthenticated(true);
      await Promise.all([loadOrdersFromSupabase(), loadQuotesFromSupabase()]);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const normalizePriceString = (value: string) =>
    value.replace(/[^0-9.,-]/g, '').replace(',', '.');

  const parsePriceValue = (value: number | string | null | undefined) => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (normalized.includes('pendiente') || normalized.includes('cotiza')) {
        return 0;
      }

      const parsed = parseFloat(normalizePriceString(value));
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  };

  const isItemPricePending = (item: OrderItem) => {
    if (!item) return false;
    if (item.isPricePending) return true;
    if (item.price === null || typeof item.price === 'undefined') return true;

    if (typeof item.price === 'string') {
      const normalized = item.price.toLowerCase();
      if (normalized.includes('pendiente') || normalized.includes('cotiza')) {
        return true;
      }
    }

    return false;
  };

  const orderHasPendingPrice = (order: Order) => {
    const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
    const pendingItem = items.some((item) => isItemPricePending(item));
    return pendingItem || !order.total || order.total <= 0;
  };

  const isPaymentConfirmed = (order: Order) => {
    const confirmedStatuses: Array<Order['payment_status']> = ['completed', 'paid'];
    return confirmedStatuses.includes(order.payment_status);
  };

  const formatOrderItemPrice = (item: OrderItem) => {
    if (isItemPricePending(item)) {
      return item.price_label || 'Precio pendiente de aprobación';
    }

    if (typeof item.price === 'number') {
      return `$${item.price.toFixed(2)}`;
    }

    if (typeof item.price === 'string') {
      const trimmed = item.price.trim();
      if (!trimmed) {
        return '$0.00';
      }

      if (trimmed.startsWith('$')) {
        return trimmed;
      }

      const parsed = parseFloat(normalizePriceString(trimmed));
      return Number.isNaN(parsed) ? trimmed : `$${parsed.toFixed(2)}`;
    }

    return '$0.00';
  };

  const formatOrderTotal = (order: Order) => {
    if (orderHasPendingPrice(order)) {
      return 'Precio pendiente';
    }

    const value = typeof order.total === 'number'
      ? order.total
      : parseFloat(normalizePriceString(String(order.total ?? 0)));

    if (Number.isNaN(value)) {
      return '$0.00';
    }

    return `$${value.toFixed(2)}`;
  };

  const parseInputToNumber = (value: string) => {
    if (!value) return null;
    const normalized = value.replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const computeSubtotalPreview = (order: Order, overrides: Record<string, string>) => {
    const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];

    return items.reduce((total, item, index) => {
      const quantity = Number(item.quantity) || 1;

      if (isItemPricePending(item)) {
        const override = parseInputToNumber(overrides[String(index)]) || 0;
        return total + override * quantity;
      }

      return total + parsePriceValue(item.price) * quantity;
    }, 0);
  };

  const openPrintOrder = (orderId: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.open(`/dashboard/orders/${orderId}/print`, '_blank', 'noopener');
  };

  const openPriceModal = (order: Order) => {
    const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
    const inputs: Record<string, string> = {};

    items.forEach((item, index) => {
      if (isItemPricePending(item)) {
        if (typeof item.price === 'number' && item.price > 0) {
          inputs[String(index)] = item.price.toFixed(2);
        } else {
          inputs[String(index)] = '';
        }
      }
    });

    setPriceApprovalOrder(order);
    setPriceInputs(inputs);
    setPriceError(null);
  };

  const closePriceModal = () => {
    setPriceApprovalOrder(null);
    setPriceInputs({});
    setPriceError(null);
    setIsSavingPrice(false);
  };

  const submitPriceApproval = async () => {
    if (!priceApprovalOrder) {
      return;
    }

    const items = Array.isArray(priceApprovalOrder.items)
      ? (priceApprovalOrder.items as OrderItem[])
      : [];

    const pendingEntries = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => isItemPricePending(item));

    if (pendingEntries.length === 0) {
      setPriceError('No hay artículos pendientes de precio en esta orden.');
      return;
    }

    for (const { index } of pendingEntries) {
      const parsed = parseInputToNumber(priceInputs[String(index)]);
      if (parsed === null || parsed <= 0) {
        setPriceError('Ingresa un precio válido para todos los artículos pendientes.');
        return;
      }
    }

    const updatedItems = items.map((item, index) => {
      if (!isItemPricePending(item)) {
        return item;
      }

      const parsed = parseInputToNumber(priceInputs[String(index)]) || 0;
      const roundedPrice = Number(parsed.toFixed(2));
      const updatedLabel = item.price_label && item.price_label.toLowerCase().includes('pendiente')
        ? `Precio aprobado: $${roundedPrice.toFixed(2)}`
        : item.price_label;

      return {
        ...item,
        price: roundedPrice,
        isPricePending: false,
        ...(updatedLabel ? { price_label: updatedLabel } : {}),
      };
    });

    const subtotal = computeSubtotalPreview(priceApprovalOrder, priceInputs);
    const roundedSubtotal = Number(subtotal.toFixed(2));
    const taxValue = Number((roundedSubtotal * 0.03).toFixed(2));
    const totalValue = Number((roundedSubtotal + taxValue).toFixed(2));

    const pendingMessage = 'Estado: Esperando confirmación de precio personalizado.';
    const approvedMessage = 'Estado: Precio aprobado por la panadería. Puedes proceder con el pago.';

    const updatedSpecialRequests = priceApprovalOrder.special_requests
      ? priceApprovalOrder.special_requests.includes(approvedMessage)
        ? priceApprovalOrder.special_requests
        : priceApprovalOrder.special_requests.includes(pendingMessage)
          ? priceApprovalOrder.special_requests.replace(pendingMessage, approvedMessage)
          : `${priceApprovalOrder.special_requests}\n\n${approvedMessage}`
      : approvedMessage;

    setIsSavingPrice(true);
    setPriceError(null);

    try {
      const itemsForPersistence = prepareItemsForPersistence(updatedItems as Record<string, any>[]);

      const { data, error } = await supabase
        .from('orders')
        .update({
          items: itemsForPersistence,
          subtotal: roundedSubtotal,
          tax: taxValue,
          total: totalValue,
          payment_status: 'pending',
          special_requests: updatedSpecialRequests,
          updated_at: new Date().toISOString(),
        })
        .eq('id', priceApprovalOrder.id)
        .select()
        .single();

      if (error) {
        console.error('Error approving price:', error);
        setPriceError('No se pudo guardar el precio. Inténtalo nuevamente.');
        return;
      }

      const nextOrder: Order = {
        ...priceApprovalOrder,
        ...(data || {}),
        items: updatedItems as any,
        subtotal: roundedSubtotal,
        tax: taxValue,
        total: totalValue,
        payment_status: 'pending',
        special_requests: updatedSpecialRequests,
      };

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const customerEmail = priceApprovalOrder.customer_email;

      if (supabaseUrl && customerEmail) {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) {
          throw new Error('User not authenticated');
        }

        const origin =
          typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://app.rangersbakery.com';

        const paymentUrl = `${origin}/order?orderId=${priceApprovalOrder.id}`;
        const trackingUrl = `${origin}/track?orderId=${priceApprovalOrder.id}`;

        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              to: customerEmail,
              type: 'customer_order_payment_ready',
              language: 'es',
              orderData: {
                id: priceApprovalOrder.id,
                customer_name: priceApprovalOrder.customer_name,
                customer_email: customerEmail,
                customer_phone: priceApprovalOrder.customer_phone,
                total: totalValue,
                subtotal: roundedSubtotal,
                tax: taxValue,
                pickup_date: priceApprovalOrder.pickup_date,
                pickup_time: priceApprovalOrder.pickup_time,
                special_requests: updatedSpecialRequests,
                items: updatedItems,
                payment_url: paymentUrl,
                tracking_url: trackingUrl,
              },
            }),
          });

          const result = await response.json();

          if (!response.ok || !result?.success) {
            throw new Error(result?.error || 'Edge function error');
          }
        } catch (notificationError) {
          console.error('Error sending payment ready notification:', notificationError);
        }
      }

      setOrders((prev) => prev.map((order) => (order.id === nextOrder.id ? nextOrder : order)));
      setShowSuccessMessage('✅ Precio aprobado y enviado al cliente.');
      setTimeout(() => setShowSuccessMessage(''), 3000);
      closePriceModal();
    } catch (error) {
      console.error('Unexpected error approving price:', error);
      setPriceError('Ocurrió un error inesperado al guardar el precio.');
    } finally {
      setIsSavingPrice(false);
    }
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
        setOrdersError('No se pudieron cargar las órdenes.');
        return;
      }

      console.log('Orders loaded from Supabase:', orders);

      const ordersWithUrls = await Promise.all(
        (orders || []).map(async (order: any) => {
          const itemsArray = Array.isArray(order.items) ? order.items : [];
          const itemsWithUrls = await withSignedPhotoUrls(itemsArray);
          return { ...order, items: itemsWithUrls };
        })
      );

      setOrders(ordersWithUrls);
      setOrdersError(null);
    } catch (error) {
      console.error('Supabase connection error:', error);
      setOrdersError('No se pudieron cargar las órdenes.');
    }
  };

  const removeOrderPhotosFromStorage = async (order: Order | undefined) => {
    if (!order) {
      return;
    }

    const itemsArray = Array.isArray(order.items) ? (order.items as Record<string, any>[]) : [];
    const storagePaths = collectPhotoStoragePaths(itemsArray);

    if (storagePaths.length === 0) {
      return;
    }

    const { error: removalError } = await supabase.storage
      .from('temp-uploads')
      .remove(storagePaths);

    if (removalError) {
      console.error('Error removing order reference photos from storage:', removalError);
      return;
    }

    const pathsSet = new Set(storagePaths);
    setOrders((prevOrders) =>
      prevOrders.map((existingOrder) => {
        if (existingOrder.id !== order.id) {
          return existingOrder;
        }

        const cleanedItems = Array.isArray(existingOrder.items)
          ? clearSignedPhotoData(existingOrder.items as Record<string, any>[], pathsSet)
          : existingOrder.items;

        return { ...existingOrder, items: cleanedItems };
      })
    );
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    // If trying to cancel and user is employee, require owner confirmation
    if (newStatus === 'cancelled' && currentUser?.role === 'employee') {
      setEmployeeCancelRequest(orderId);
      return;
    }

    const targetOrder = orders.find((order) => order.id === orderId);

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
        setOrdersError('No se pudo actualizar el estado de la orden.');
        return;
      }

      const updatedOrders = orders.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      );
      setOrders(updatedOrders);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (newStatus === 'ready' && supabaseUrl && targetOrder?.customer_email) {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) {
          throw new Error('User not authenticated');
        }

        const origin =
          typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://app.rangersbakery.com';

        const trackingUrl = `${origin}/track?orderId=${orderId}`;
        const paymentUrl = `${origin}/order?orderId=${orderId}`;

        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              to: targetOrder.customer_email,
              type: 'customer_order_ready_for_pickup',
              language: 'es',
              orderData: {
                id: targetOrder.id,
                customer_name: targetOrder.customer_name,
                customer_email: targetOrder.customer_email,
                customer_phone: targetOrder.customer_phone,
                pickup_date: targetOrder.pickup_date,
                pickup_time: targetOrder.pickup_time,
                total: targetOrder.total,
                subtotal: targetOrder.subtotal,
                tax: targetOrder.tax,
                items: targetOrder.items,
                tracking_url: trackingUrl,
                payment_url: paymentUrl,
              },
            }),
          });

          const result = await response.json();

          if (!response.ok || !result?.success) {
            throw new Error(result?.error || 'Edge function error');
          }
        } catch (notificationError) {
          console.error('Error sending ready for pickup notification:', notificationError);
        }
      }

      if (newStatus === 'delivered' || newStatus === 'completed') {
        void removeOrderPhotosFromStorage(targetOrder);
      }

      console.log(`Order ${orderId} updated to ${newStatus}`);
      setOrdersError(null);
    } catch (error) {
      console.error('Supabase update error:', error);
      setOrdersError('No se pudo actualizar el estado de la orden.');
    }
  };

  const handleCalendarStatusUpdate = (orderId: string, newStatus: string) => {
    void updateOrderStatus(orderId, newStatus as Order['status']);
  };

  const applyOrderPaymentStatus = (
    orderId: string,
    paymentStatus: Order['payment_status'],
    paymentType?: string | null,
    updatedAt?: string
  ) => {
    const effectiveUpdatedAt = updatedAt || new Date().toISOString();

    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        const resolvedPaymentType =
          paymentType === null
            ? undefined
            : typeof paymentType === 'undefined'
              ? order.payment_type
              : paymentType;

        return {
          ...order,
          payment_status: paymentStatus,
          payment_type: resolvedPaymentType,
          updated_at: effectiveUpdatedAt,
        };
      })
    );
  };

  const handleConfirmCashPayment = async (orderId: string) => {
    const targetOrder = orders.find((order) => order.id === orderId);
    if (!targetOrder) {
      return;
    }

    const confirmationMessage =
      '¿Confirmas que esta orden fue pagada en tienda con efectivo? Esta acción permitirá continuar con la preparación.';

    const isConfirmed = typeof window !== 'undefined' ? window.confirm(confirmationMessage) : true;

    if (!isConfirmed) {
      return;
    }

    const effectivePaymentType = targetOrder.payment_type ?? 'cash';
    const nowIso = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_type: effectivePaymentType,
          updated_at: nowIso,
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error confirming in-store payment in Supabase:', error);
        setOrdersError('No se pudo confirmar el pago en Supabase.');
        return;
      }

      applyOrderPaymentStatus(orderId, 'paid', effectivePaymentType, nowIso);
      setOrdersError(null);

      setShowSuccessMessage('✅ Pago en tienda confirmado');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error confirming in-store payment:', error);
      setOrdersError('No se pudo confirmar el pago en Supabase.');
    }
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
          const signedUrl = await getSignedQuotePhotoUrl(quote.reference_photo_url);
          const cartItems = Array.isArray(quote.cart_items) ? (quote.cart_items as Record<string, any>[]) : [];
          const cartItemsWithUrls = cartItems.length > 0 ? await withSignedPhotoUrls(cartItems) : [];

          return {
            ...quote,
            reference_photo_url: signedUrl || null,
            cart_items: cartItemsWithUrls as OrderItem[],
          };
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
      const targetQuote = quotes.find((quote) => quote.id === quoteId);
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

      if (newStatus === 'responded') {
        updateData.responded_at = new Date().toISOString();
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

      if (newStatus === 'responded') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const customerEmail = targetQuote?.customer_email;

        if (supabaseUrl && customerEmail && estimatedPrice) {
          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;
          if (!accessToken) {
            throw new Error('User not authenticated');
          }

          try {
            const response = await fetch(`${supabaseUrl}/functions/v1/send-quote-response`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            body: JSON.stringify({
              quoteId,
              estimatedPrice,
              adminNotes: adminNotes || targetQuote?.admin_notes || '',
            }),
            });

            const result = await response.json();

            if (!response.ok || !result?.success) {
              throw new Error(result?.error || 'Edge function error');
            }

            setShowSuccessMessage('✅ Cotización respondida y correo enviado al cliente');
          } catch (notificationError) {
            console.error('Error sending quote response email:', notificationError);
            setShowSuccessMessage('⚠️ Cotización respondida, pero no se pudo enviar el correo automático');
          }
        } else {
          setShowSuccessMessage('✅ Cotización marcada como respondida');
          if (!customerEmail) {
            console.warn('Quote responded without customer email; skipping notification.');
          }
        }

        setTimeout(() => setShowSuccessMessage(''), 3000);
      }
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
      const orderItemsForPersistence = prepareItemsForPersistence(orderItems as Record<string, any>[]);

      const subtotal = quote.estimated_price || 0;
      const tax = Number((subtotal * 0.03).toFixed(2));
      const total = Number((subtotal + tax).toFixed(2));

      const orderData = {
        customer_name: quote.customer_name,
        customer_phone: quote.customer_phone || '',
        customer_email: quote.customer_email || '',
        items: orderItemsForPersistence,
        subtotal,
        tax,
        total,
        status: 'pending',
        payment_status: 'pending',
        order_date: now,
        pickup_date: quote.pickup_date || null,
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

      const insertedOrderItems = Array.isArray(insertedOrder?.items) ? (insertedOrder.items as Record<string, any>[]) : [];
      const insertedOrderWithUrls: Order = {
        ...(insertedOrder as Order),
        items: (await withSignedPhotoUrls(insertedOrderItems)) as any,
      };

      await supabase
        .from('quotes')
        .update({ status: 'accepted', updated_at: now })
        .eq('id', quote.id);

      setQuotes((prev) => prev.filter((q) => q.id !== quote.id));
      setOrders((prev) => [insertedOrderWithUrls, ...prev]);
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
        setOrdersError('No se pudo eliminar la orden en Supabase.');
        return;
      }

      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      setOrdersError(null);

      setShowSuccessMessage('✅ Pedido eliminado correctamente');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting order:', error);
      setOrdersError('No se pudo eliminar la orden en Supabase.');
    }

    setDeletingOrder(null);
    setDeleteOrderConfirmation(null);
  };

  // -------------------------------------------------------------------------
  // UI helpers
  // -------------------------------------------------------------------------
  const statusColors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    received: 'bg-sky-100 text-sky-800',
    baking: 'bg-orange-100 text-orange-800',
    decorating: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusMeta: Record<OrderStatus, { label: string; icon: string }> = {
    pending: { label: 'Pendiente', icon: 'ri-timer-line' },
    received: { label: 'Recibido', icon: 'ri-mail-download-line' },
    baking: { label: 'Horneando', icon: 'ri-fire-line' },
    decorating: { label: 'Decorando', icon: 'ri-brush-line' },
    ready: { label: 'Listo', icon: 'ri-check-line' },
    completed: { label: 'Completado', icon: 'ri-check-double-line' },
    delivered: { label: 'Entregado', icon: 'ri-truck-line' },
    cancelled: { label: 'Cancelado', icon: 'ri-close-line' },
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

  const pendingPriceItems = priceApprovalOrder
    ? (Array.isArray(priceApprovalOrder.items)
        ? (priceApprovalOrder.items as OrderItem[])
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => isItemPricePending(item))
        : [])
    : [];

  const previewSubtotal = priceApprovalOrder
    ? computeSubtotalPreview(priceApprovalOrder, priceInputs)
    : 0;
  const previewSubtotalRounded = Number(previewSubtotal.toFixed(2));
  const previewTaxRounded = Number((previewSubtotalRounded * 0.03).toFixed(2));
  const previewTotalRounded = Number((previewSubtotalRounded + previewTaxRounded).toFixed(2));

  const isPriceSaveDisabled =
    isSavingPrice ||
    pendingPriceItems.some(({ index }) => {
      const parsed = parseInputToNumber(priceInputs[String(index)]);
      return parsed === null || parsed <= 0;
    });

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
                <p className="text-lg font-bold text-red-600">{formatOrderTotal(request.order)}</p>
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

                  {ordersError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <i className="ri-error-warning-line text-red-600"></i>
                        </div>
                        <p className="ml-3 text-red-700 font-medium">{ordersError}</p>
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

                {showTodayView && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
                    onClick={() => setShowTodayView(false)}
                  >
                    <div
                      className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-pink-500 to-teal-400 px-6 py-5 text-white">
                        <div>
                          <h3 className="text-lg font-semibold">Pedidos programados para hoy</h3>
                          <p className="text-sm text-white/90">
                            {getTodayOrders().length === 0
                              ? 'No tienes pedidos pendientes para el día de hoy.'
                              : `Tienes ${getTodayOrders().length} pedido${getTodayOrders().length === 1 ? '' : 's'} agendado${getTodayOrders().length === 1 ? '' : 's'}.`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTodayView(false)}
                          className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
                          aria-label="Cerrar vista de pedidos de hoy"
                        >
                          <i className="ri-close-line text-xl" />
                        </button>
                      </div>

                      <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
                        {getTodayOrders().length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-gray-500">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl text-gray-400">
                              <i className="ri-sun-line" />
                            </div>
                            <p className="text-lg font-medium text-gray-700">No hay pedidos para hoy</p>
                            <p className="text-sm text-gray-500">
                              Cuando lleguen órdenes programadas para hoy las verás en esta vista rápida.
                            </p>
                          </div>
                        ) : (
                        getTodayOrders().map((order) => {
                          const specialRequestNotes = extractSpecialRequestNotes(order.special_requests);

                          return (
                            <div
                              key={order.id}
                              className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-5 shadow-sm"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-gray-600">Cliente</p>
                                  <p className="text-lg font-bold text-gray-900">{order.customer_name}</p>
                                  <p className="text-sm text-gray-500">
                                    <span className="font-medium">Teléfono principal:</span>{' '}
                                    {order.customer_phone}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                                  <p className="text-lg font-bold text-pink-600">
                                    {formatOrderTotal(order)}
                                  </p>
                                  <span className="mt-2 inline-flex items-center justify-center rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-gray-700 shadow">
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <i className="ri-calendar-event-line text-pink-500"></i>
                                  <span>{order.pickup_date || 'Fecha por confirmar'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <i className="ri-time-line text-pink-500"></i>
                                  <span>{order.pickup_time || 'Horario por confirmar'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <i className="ri-map-pin-line text-pink-500"></i>
                                  <span>{order.billing_address || 'Retiro en tienda'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <i className="ri-mail-line text-pink-500"></i>
                                  <span>{order.customer_email || 'Sin correo'}</span>
                                </div>
                              </div>
                              {specialRequestNotes.length > 0 && (
                                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-700 shadow-inner">
                                  <p className="font-semibold text-gray-800">Solicitudes especiales</p>
                                  <ul className="mt-1 space-y-1 text-sm text-gray-700">
                                    {specialRequestNotes.map((note, index) => (
                                      <li key={`${order.id}-special-note-${index}`} className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500"></span>
                                        <span>{note}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                      </div>
                    </div>
                  </div>
                )}

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
                    orders.map((order) => {
                      const paymentConfirmed = isPaymentConfirmed(order);
                      const orderItems = Array.isArray(order.items)
                        ? (order.items as OrderItem[])
                        : [];
                      const statusInfo = statusMeta[order.status];
                      const specialRequestNotes = extractSpecialRequestNotes(order.special_requests);

                      return (
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
                                  <i className="ri-calendar-event-line"></i>
                                  <span>{order.pickup_date || 'Fecha no especificada'}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <i className="ri-time-line"></i>
                                  <span>{order.pickup_time || 'Hora no especificada'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right space-y-2">
                                <p className="text-2xl font-bold text-pink-600">{formatOrderTotal(order)}</p>
                                <div className="flex items-center justify-end gap-2">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]} shadow-sm`}
                                  >
                                    <i className={`${statusInfo.icon} mr-1`}></i>
                                    {statusInfo.label}
                                  </span>
                                  {orderHasPendingPrice(order) && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                      <i className="ri-hourglass-2-line"></i>
                                      Precio pendiente
                                    </span>
                                  )}
                                </div>
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
                            <div className="space-y-3">
                              {orderItems.map((item, idx) => {
                                const detailEntries = extractItemDetails(item);
                                const photoSource = getItemPhotoUrl(item);

                                return (
                                  <div
                                    key={`${order.id}-item-${idx}`}
                                    className="rounded-xl border border-gray-200 bg-white/80 p-3 shadow-sm"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="flex items-center space-x-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">
                                          {item.quantity}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                                          {item.type === 'cake' && (
                                            <p className="text-xs font-medium uppercase tracking-wide text-pink-500">Personalizado</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right text-sm font-bold text-gray-800">
                                        {formatOrderItemPrice(item)}
                                      </div>
                                    </div>

                                    {detailEntries.length > 0 && (
                                      <ul className="mt-3 space-y-1 text-xs text-gray-600">
                                        {detailEntries.map((detail, detailIndex) => (
                                          <li
                                            key={`${order.id}-item-${idx}-detail-${detailIndex}`}
                                            className="flex items-start gap-2"
                                          >
                                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-pink-400"></span>
                                            <span>
                                              {detail.label ? (
                                                <>
                                                  <span className="font-semibold text-gray-700">{detail.label}:</span>{' '}
                                                  <span className={detail.emphasis ? 'text-gray-800 font-semibold' : undefined}>
                                                    {detail.value}
                                                  </span>
                                                </>
                                              ) : (
                                                detail.value
                                              )}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}

                                    {photoSource && (
                                      <div className="mt-3">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Referencia visual</p>
                                        <div className="relative h-28 w-full max-w-xs overflow-hidden rounded-lg border border-pink-100">
                                          <SafeImage
                                            src={photoSource}
                                            alt={`Referencia de ${item.name}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 60vw, 220px"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {specialRequestNotes.length > 0 && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-l-4 border-yellow-400">
                              <div className="flex items-start space-x-2">
                                <i className="ri-lightbulb-line text-yellow-600 mt-0.5"></i>
                                <div>
                                  <p className="text-sm font-bold text-yellow-800">Solicitudes especiales</p>
                                  <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                                    {specialRequestNotes.map((note, index) => (
                                      <li key={`${order.id}-special-request-${index}`} className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500"></span>
                                        <span>{note}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openPrintOrder(order.id)}
                              className="flex-1 min-w-[200px] bg-gradient-to-r from-slate-600 to-slate-800 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-slate-700 hover:to-slate-900 transition-all transform hover:scale-105 shadow-lg"
                              type="button"
                            >
                              <i className="ri-printer-line mr-2"></i>
                              Imprimir orden
                            </button>
                            {currentUser?.role === 'owner' && orderHasPendingPrice(order) && (
                              <button
                                onClick={() => openPriceModal(order)}
                                className="flex-1 min-w-[200px] bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
                                type="button"
                              >
                                <i className="ri-cash-line mr-2"></i>
                                Someter precio
                              </button>
                            )}
                            {!paymentConfirmed && (
                              <button
                                onClick={() => handleConfirmCashPayment(order.id)}
                                className="flex-1 min-w-[200px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-emerald-600 hover:to-teal-600 transition-all transform hover:scale-105 shadow-lg"
                                type="button"
                              >
                                <i className="ri-hand-coin-line mr-2"></i>
                                Confirmar pago en tienda
                              </button>
                            )}
                            {order.status === 'pending' && (
                              <div className="flex-1 min-w-[200px]">
                                <button
                                  onClick={() => {
                                    if (!paymentConfirmed) return;
                                    void updateOrderStatus(order.id, 'baking');
                                  }}
                                  disabled={!paymentConfirmed}
                                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold !rounded-button transition-all ${
                                    paymentConfirmed
                                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transform hover:scale-105 shadow-lg'
                                      : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-80'
                                  }`}
                                  type="button"
                                >
                                  <i className="ri-fire-line mr-2"></i>
                                  Iniciar Horneado
                                </button>
                                {!paymentConfirmed && (
                                  <p className="mt-2 text-xs font-semibold text-orange-600">
                                    Confirma el pago antes de iniciar el horneado.
                                  </p>
                                )}
                              </div>
                            )}
                            {order.status === 'baking' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'decorating')}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
                                type="button"
                              >
                                <i className="ri-brush-line mr-2"></i>
                                Iniciar Decoración
                              </button>
                            )}
                            {order.status === 'decorating' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
                                type="button"
                              >
                                <i className="ri-check-line mr-2"></i>
                                Marcar Listo
                              </button>
                            )}
                            {order.status === 'ready' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-lg"
                                type="button"
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
                                type="button"
                              >
                                <i className="ri-close-line mr-2"></i>
                                {currentUser?.role === 'employee' ? 'Solicitar Cancelar' : 'Cancelar'}
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (order.customer_phone) {
                                  window.open(`tel:${order.customer_phone}`, '_self');
                                }
                              }}
                              className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={!order.customer_phone}
                              type="button"
                            >
                              <i className="ri-phone-line text-lg"></i>
                              <span>Llamar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })
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

      {priceApprovalOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4 py-6"
          onClick={closePriceModal}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={closePriceModal}
              className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              type="button"
            >
              <i className="ri-close-line text-lg"></i>
            </button>

            <div className="space-y-6 p-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Definir precio final</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Ingresa el precio por artículo para aprobar la orden y permitir que el cliente pague.
                </p>
              </div>

              {priceError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {priceError}
                </div>
              )}

              {pendingPriceItems.length === 0 ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                  No se detectaron artículos pendientes de precio en esta orden.
                </div>
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                  {pendingPriceItems.map(({ item, index }) => (
                    <div
                      key={`${priceApprovalOrder.id}-item-${index}`}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-amber-800">{item.name}</p>
                          <p className="text-xs text-amber-700">Cantidad: {item.quantity}</p>
                          {item.details && (
                            <p className="mt-2 whitespace-pre-line text-xs text-amber-700">{item.details}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <label className="mb-1 block text-xs font-medium text-amber-700">
                            Precio unitario ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={priceInputs[String(index)] ?? ''}
                            onChange={(event) =>
                              setPriceInputs((prev) => ({ ...prev, [String(index)]: event.target.value }))
                            }
                            className="w-32 rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-pink-100 bg-pink-50 p-4 text-sm text-pink-900">
                  <p className="font-semibold">Impuesto automático (3%)</p>
                  <p className="mt-1">
                    El sistema calcula y añade automáticamente un recargo del 3% a todas las órdenes para pagos con tarjeta.
                  </p>
                  <p className="mt-2 text-xs text-pink-800">Este valor no requiere ajustes manuales.</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal estimado:</span>
                    <span className="font-semibold text-gray-900">${previewSubtotalRounded.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-gray-600">Impuestos:</span>
                    <span className="font-semibold text-gray-900">${previewTaxRounded.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t pt-2">
                    <span className="text-gray-700">Total al cliente:</span>
                    <span className="text-lg font-bold text-pink-600">${previewTotalRounded.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={closePriceModal}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:w-auto"
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitPriceApproval}
                  className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-pink-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  disabled={isPriceSaveDisabled || pendingPriceItems.length === 0}
                  type="button"
                >
                  {isSavingPrice ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Guardando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <i className="ri-send-plane-fill"></i>
                      Guardar y notificar
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  );

  // -------------------------------------------------------------------------
  // Data derived helpers (moved here to be accessible)
  // -------------------------------------------------------------------------
  function getTodayOrders() {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter((order) => {
      const normalizedPickup = normalizeOrderDate(order.pickup_date);
      const normalizedOrder = normalizeOrderDate(order.order_date);
      const scheduledDate = normalizedPickup || normalizedOrder;
      return scheduledDate === today;
    });
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
  const specialRequestNotes = extractSpecialRequestNotes(quote.special_requests);

  const handlePhotoPrint = (event: MouseEvent<HTMLButtonElement>, photoUrl: string) => {
    event.stopPropagation();
    openPhotoPrintWindow(photoUrl);
  };

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
              <span>
                <span className="font-medium">Teléfono principal:</span>{' '}
                {quote.customer_phone}
              </span>
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
        <div className="mb-4 rounded-lg border-l-4 border-blue-400 bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-800 mb-1">Foto de Referencia:</p>
          <p className="text-sm text-blue-700">{quote.photo_description}</p>
          {quote.reference_photo_url && (
            <div className="mt-3 space-y-2">
              <a
                href={quote.reference_photo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative h-32 w-full overflow-hidden rounded border border-blue-100">
                  <SafeImage
                    src={quote.reference_photo_url}
                    alt="Referencia"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 90vw, 320px"
                  />
                </div>
              </a>
              <div className="flex flex-wrap gap-2">
                <a
                  href={quote.reference_photo_url}
                  download
                  className="inline-flex items-center rounded-lg bg-white px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  <i className="ri-download-line mr-1"></i>
                  Descargar foto
                </a>
                <button
                  type="button"
                  onClick={(event) => handlePhotoPrint(event, quote.reference_photo_url!)}
                  className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
                >
                  <i className="ri-printer-line mr-1"></i>
                  Imprimir foto
                </button>
              </div>
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
            {(quote.cart_items || []).map((item, index) => {
              const detailEntries = extractItemDetails(item);
              const photoSource = getItemPhotoUrl(item);

              return (
                <div
                  key={`${quote.id}-item-${index}`}
                  className="space-y-2 rounded-md border border-pink-100 bg-white p-3 shadow-sm"
                >
                  <div className="text-sm font-semibold text-gray-800">
                    {item.quantity || 1}x {item.name}
                  </div>

                  {detailEntries.length > 0 && (
                    <ul className="space-y-1 text-xs text-gray-600">
                      {detailEntries.map((detail, detailIndex) => (
                        <li
                          key={`${quote.id}-item-${index}-detail-${detailIndex}`}
                          className="flex items-start gap-1.5"
                        >
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-pink-300"></span>
                          <span>
                            {detail.label ? (
                              <>
                                <span className="font-medium text-gray-700">{detail.label}:</span>{' '}
                                <span className={detail.emphasis ? 'font-semibold text-gray-800' : undefined}>
                                  {detail.value}
                                </span>
                              </>
                            ) : (
                              detail.value
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {photoSource && (
                    <div className="space-y-2">
                      <a
                        href={photoSource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="relative h-32 w-full overflow-hidden rounded border border-pink-100">
                          <SafeImage
                            src={photoSource}
                            alt={`Referencia de ${item.name}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 90vw, 320px"
                          />
                        </div>
                      </a>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={photoSource}
                          download
                          className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          <i className="ri-download-line mr-1"></i>
                          Descargar foto
                        </a>
                        <button
                          type="button"
                          onClick={(event) => handlePhotoPrint(event, photoSource)}
                          className="inline-flex items-center rounded-lg bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700 transition-colors hover:bg-pink-200"
                        >
                          <i className="ri-printer-line mr-1"></i>
                          Imprimir foto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {quote.pickup_time && (
            <p className="text-xs text-pink-700 mt-2">
              Hora preferida de recogida: <span className="font-semibold">{quote.pickup_time}</span>
            </p>
          )}
          {specialRequestNotes.length > 0 && (
            <div className="mt-1 space-y-1">
              <p className="text-xs font-semibold text-pink-800">Solicitudes especiales</p>
              <ul className="space-y-1 text-xs text-pink-700">
                {specialRequestNotes.map((note, index) => (
                  <li key={`${quote.id}-special-request-${index}`} className="flex items-start gap-1.5">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-pink-400"></span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
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
