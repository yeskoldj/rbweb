'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Order } from '@/lib/supabase';
import { squareConfig } from '@/lib/square/config';
import { createSquarePayment } from '@/lib/square/payments';
import { createP2POrder, p2pPaymentConfig } from '@/lib/square/p2p';
import { showCartNotification } from '@/lib/cartNotification';
import { notifyBusinessAboutOrder } from '@/lib/orderNotifications';
import Script from 'next/script';
import { parseSpecialRequestSections } from '@/lib/specialRequestParsing';

interface CartItem {
  id: string;
  name: string;
  price: string | number;
  quantity: number;
  image?: string;
  photoUrl?: string;
  type?: string;
  details?: string;
  customization?: any;
  priceLabel?: string;
  isPricePending?: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface OrderFormProps {
  orderId?: string;
}

export default function OrderForm({ orderId }: OrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteReference, setQuoteReference] = useState<string | null>(null);
  const [systemSummary, setSystemSummary] = useState<string | null>(null);
  const [, setSystemStatusMessage] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);

  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  // Apple Pay y Google Pay deshabilitados temporalmente
  // const [applePay, setApplePay] = useState<any>(null);
  // const [googlePay, setGooglePay] = useState<any>(null);

  const [cardMountState, setCardMountState] =
  useState<'loading' | 'ready' | 'error'>('loading');

useEffect(() => {
  // Si el SDK nunca carga (ej. Brave/AdBlock), cortamos en 5s
  const t = setTimeout(() => {
    if (!(window as any).Square) setCardMountState('error');
  }, 5000);
  return () => clearTimeout(t);
}, []);


  const isP2PEnabled = false;

  const [showP2PInstructions, setShowP2PInstructions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'zelle'>('card');
  const [p2pInstructions, setP2PInstructions] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [formData, setFormData] = useState({
    specialRequests: '',
    pickupDate: '',
    pickupTime: ''
  });

  const [minPickupDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timezoneOffsetMinutes = today.getTimezoneOffset();
    today.setMinutes(today.getMinutes() - timezoneOffsetMinutes);
    return today.toISOString().split('T')[0];
  });

  const formatPickupDateForSummary = (value: string) => {
    if (!value) {
      return '';
    }

    const parsedDate = new Date(`${value}T00:00:00`);
    return parsedDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: ''
  });
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const billingAddress = billingPostalCode.trim();
  const [saveBillingAddress, setSaveBillingAddress] = useState(true);
  const hasPendingPrice = cartItems.some(item => {
    if (existingOrder) return false;
    if (item.isPricePending) return true;
    if (typeof item.price === 'string') {
      const normalized = item.price.toLowerCase();
      return normalized.includes('pendiente') || normalized.includes('cotiza');
    }
    return false;
  });
  const profileEmailFromState = (currentUser?.email || currentUser?.emailAddress || '').trim();
  const profilePhoneFromState = (currentUser?.phone || '').trim();
  const profileHasPhone = Boolean(profilePhoneFromState);
  const requiresContactEmail = !profileEmailFromState;
  const requiresContactPhone = true;
  const shouldShowContactSection = hasPendingPrice && !existingOrder;

  const isMissingBillingColumn = (error: any) =>
    typeof error?.message === 'string' && error.message.includes("'billing_address'");

  const persistPhoneToProfile = useCallback(
    async (rawPhone: string) => {
      const trimmedPhone = (rawPhone || '').trim();
      if (!trimmedPhone) {
        return;
      }

      const currentProfilePhone = (currentUser?.phone || '').trim();
      if (currentProfilePhone === trimmedPhone) {
        return;
      }

      if (currentUser?.id) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ phone: trimmedPhone, updated_at: new Date().toISOString() })
            .eq('id', currentUser.id);

          if (error) {
            console.warn('No se pudo guardar el teléfono del perfil en Supabase:', error.message);
          } else {
            setCurrentUser((prev: any) => (prev ? { ...prev, phone: trimmedPhone } : prev));
          }
        } catch (error) {
          console.warn('Error inesperado al actualizar el teléfono del perfil:', error);
        }
      } else {
        setCurrentUser((prev: any) => (prev ? { ...prev, phone: trimmedPhone } : prev));
      }
    },
    [currentUser]
  );

  const showNotification = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
      const id = Date.now().toString();
      const notification: Notification = { id, type, title, message };

      setNotifications(prev => [...prev, notification]);

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    const emailFromProfile = (currentUser?.email || currentUser?.emailAddress || '').trim();
    const phoneFromProfile = (currentUser?.phone || '').trim();

    setContactInfo(prev => ({
      email: prev.email || emailFromProfile,
      phone: prev.phone || phoneFromProfile
    }));
  }, [currentUser]);

  useEffect(() => {
    const phoneFromOrder = (existingOrder?.customer_phone || '').trim();
    if (phoneFromOrder) {
      setContactInfo(prev => ({
        ...prev,
        phone: prev.phone || phoneFromOrder,
      }));
    }
  }, [existingOrder]);

  const loadExistingOrder = useCallback(
    async (id: string) => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          throw new Error(error?.message || 'Order not found');
        }

        const normalizedItems: CartItem[] = Array.isArray(data.items)
          ? data.items.map((item: any, index: number) => {
              const rawPrice = item?.price;
              const rawPriceLabel = item?.priceLabel || item?.price_label;
              const stringPrice = typeof rawPrice === 'string' ? rawPrice : '';
              const pendingFlagFromItem =
                (item?.isPricePending ?? item?.price_pending) ?? false;
              const pendingFlag = Boolean(
                pendingFlagFromItem ||
                rawPrice === null ||
                rawPrice === undefined ||
                stringPrice.toLowerCase().includes('pendiente') ||
                stringPrice.toLowerCase().includes('cotiza')
              );

              const numericPrice = typeof rawPrice === 'number'
                ? rawPrice
                : parseFloat(String(rawPrice ?? '').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

              return {
                id: item?.id || `${id}-${index}`,
                name: item?.name || `Producto ${index + 1}`,
                price: pendingFlag ? 0 : numericPrice,
                priceLabel: rawPriceLabel || (pendingFlag ? 'Precio pendiente de aprobación' : undefined),
                isPricePending: pendingFlag,
                quantity: item?.quantity ?? 1,
                image: item?.image,
                photoUrl: item?.photoUrl,
                details: item?.details || item?.customization?.summary || '',
                customization: item?.customization,
                type: item?.type,
              };
            })
          : [];

        const parsedSpecial = parseSpecialRequestSections(data.special_requests || '');

        setExistingOrder(data as Order);
        setCartItems(normalizedItems);
        setFormData({
          specialRequests: parsedSpecial.userRequests || '',
          pickupDate: data.pickup_date || '',
          pickupTime: data.pickup_time || '',
        });
        setSystemSummary(parsedSpecial.summary);
        setSystemStatusMessage(parsedSpecial.statusMessage);
        setQuoteReference(parsedSpecial.referenceCode);

        if (typeof data.billing_address === 'string') {
          const rawBilling = data.billing_address.trim();
          if (rawBilling) {
            const parts = rawBilling.split(',').map((part: string) => part.trim()).filter(Boolean);
            const postalCode = parts.length > 0 ? parts[parts.length - 1] : rawBilling;
            setBillingPostalCode(postalCode);
          }
        }
      } catch (err: any) {
        console.error('Error loading existing order:', err);
        showNotification(
          'error',
          'Orden no disponible',
          'No pudimos cargar tu orden. Por favor verifica el enlace o contacta a la panadería.'
        );
      }
    },
    [showNotification]
  );

  const getCustomizationDetails = (item: CartItem): string => {
    if (item.details && String(item.details).trim().length > 0) {
      return item.details;
    }

    const customization = item.customization || {};
    const details: string[] = [];

    if (customization.shape) {
      details.push(`Forma: ${customization.shape}`);
    }
    if (customization.layers) {
      details.push(`Niveles: ${customization.layers}`);
    }
    if (customization.flavors) {
      details.push(`Masa: ${customization.flavors}`);
    }
    if (customization.colors) {
      details.push(`Colores: ${customization.colors}`);
    }
    if (customization.fillings) {
      details.push(`Rellenos: ${customization.fillings}`);
    }
    if (customization.decorations) {
      details.push(`Decoraciones: ${customization.decorations}`);
    }
    if (customization.inscription) {
      details.push(`Mensaje: ${customization.inscription}`);
    }
    if (customization.specialRequests) {
      details.push(`Notas: ${customization.specialRequests}`);
    }
    if (customization.photoUrl) {
      details.push('Incluye foto de referencia');
    }

    return details.join(' | ');
  };

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '';
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '';

  // Inicializar Square después de mostrar el formulario de tarjeta
const initSquareCard = useCallback(async () => {
  try {
    setCardMountState('loading');

    const Square = (window as any).Square;
    if (!Square) throw new Error('SDK no disponible (bloqueado o no cargó)');

    if (!appId || !locationId) {
      throw new Error('Falta APP_ID o LOCATION_ID');
    }

    // Evitar doble init
    if ((window as any).__sq_card) {
      setCardMountState('ready');
      return;
    }

    // Square.payments es síncrono
    // Explicitly specify the Square environment to match the configured credentials
    const p = Square.payments(appId, locationId, {
      environment: squareConfig.environment,
    });
    setPayments(p);

    const c = await p.card();
    await c.attach('#card-container');      // <-- requiere el div en el JSX
    setCard(c);
    (window as any).__sq_card = c;

    // Apple Pay y Google Pay deshabilitados

    setCardMountState('ready');
    console.log('✅ Square SDK initialized');
  } catch (e: any) {
    console.error('Square init failed:', e);
    setCardMountState('error');
    showNotification('error', 'Square no cargó', e?.message || 'Permite web.squarecdn.com o revisa IDs/domains');
  }
}, [appId, locationId, showNotification]);


  // Inicializar Square para otros métodos de pago
  const initSquareCardPayments = useCallback(async () => {
    try {
      // Square SDK global
      const Square = (window as any).Square;
      if (!Square || payments) return;

      // Initialize the payments object with the configured environment
      const p = await Square.payments(appId, locationId, {
        environment: squareConfig.environment,
      });
      setPayments(p);

      // Apple Pay y Google Pay deshabilitados
      console.log('✅ Square Payments SDK initialized');
    } catch (e) {
      console.error('Square init failed:', e);
    }
  }, [payments, appId, locationId]);

  // Inicializar Square cuando se carga el script
  useEffect(() => {
    if (!payments) {
      const checkSquare = setInterval(() => {
        // Square SDK global
        if ((window as any).Square) {
          initSquareCardPayments();
          clearInterval(checkSquare);
        }
      }, 100);
      
      // Limpiar después de 10 segundos si no se carga
      setTimeout(() => clearInterval(checkSquare), 10000);
      
      return () => clearInterval(checkSquare);
    }
  }, [initSquareCardPayments, payments]);

  // Inicializar Square Card cuando se muestra el formulario
  useEffect(() => {
    if (showCardForm && !card) {
      // Dar tiempo al DOM para renderizar
      setTimeout(() => {
        initSquareCard();
      }, 100);
    }
  }, [showCardForm, card, initSquareCard]);

  useEffect(() => {
    if (orderId) {
      loadExistingOrder(orderId);
    } else {
      setSystemSummary(null);
      setSystemStatusMessage(null);
      if (!quoteSubmitted) {
        setQuoteReference(null);
      }
      const savedCart = localStorage.getItem('bakery-cart');
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch {
          setCartItems([]);
        }
      }

      const savedForm = localStorage.getItem('bakery-order-form');
      if (savedForm) {
        try {
          const parsed = JSON.parse(savedForm);
          setFormData({
            specialRequests: parsed.specialRequests || '',
            pickupDate: parsed.pickupDate || '',
            pickupTime: parsed.pickupTime || ''
          });
        } catch {
          setFormData({ specialRequests: '', pickupDate: '', pickupTime: '' });
        }
      }
    }

    const savedBilling = localStorage.getItem('bakery-billing-address');
    if (savedBilling) {
      try {
        const parsed = JSON.parse(savedBilling);
        if (typeof parsed === 'string') {
          setBillingPostalCode(parsed);
        } else if (parsed && typeof parsed === 'object') {
          setBillingPostalCode(parsed.postalCode || parsed.zip || '');
        }
      } catch {
        const parts = savedBilling.split(',').map(p => p.trim()).filter(Boolean);
        const lastPart = parts.length > 0 ? parts[parts.length - 1] : savedBilling.trim();
        setBillingPostalCode(lastPart);
      }
    }

    checkCurrentUser();
  }, [orderId, loadExistingOrder, quoteSubmitted]);

  useEffect(() => {
    localStorage.setItem('bakery-order-form', JSON.stringify(formData));
  }, [formData]);

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
        }
      }
    } catch (error) {
      console.log('Error checking user:', error);
    }
  };

  const handleContactInfoChange = (field: 'email' | 'phone') => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const addToCart = (item: CartItem) => {
    if (existingOrder) {
      showNotification(
        'warning',
        'Orden bloqueada',
        'Esta orden ya fue creada. Si necesitas cambios, contacta a la panadería.'
      );
      return;
    }

    const cartItem = {
      id: `${item.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: item.name,
      price: item.price,
      priceLabel: item.priceLabel,
      isPricePending: item.isPricePending,
      quantity: 1,
      image: item.image,
      photoUrl: item.photoUrl,
      details: item.details || getCustomizationDetails(item),
      customization: item.customization,
      type: item.type,
    };

    const existingCart = localStorage.getItem('bakery-cart');
    const cart = existingCart ? JSON.parse(existingCart) : [];
    
    const existingItemIndex = cart.findIndex((cartItem: any) => cartItem.name === item.name);
    
    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push(cartItem);
    }
    
    localStorage.setItem('bakery-cart', JSON.stringify(cart));
    setCartItems(cart);

    // Mostrar confirmación visual
    showCartNotification(`${item.name} agregado al carrito`);

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

  const removeFromCart = (id: string, name: string) => {
    if (existingOrder) {
      showNotification(
        'warning',
        'Orden bloqueada',
        'Esta orden ya fue creada. Si necesitas cambios, contacta a la panadería.'
      );
      return;
    }

    const existingCart = localStorage.getItem('bakery-cart');
    let cart = existingCart ? JSON.parse(existingCart) : [];
    cart = cart.filter((cartItem: any) => cartItem.id !== id);
    localStorage.setItem('bakery-cart', JSON.stringify(cart));
    setCartItems(cart);
    setAddedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    // Mostrar confirmación de eliminación
    showCartNotification(`${name} eliminado del carrito`, 'remove');
  };

  const getItemPrice = (item: CartItem): number => {
    if (item.isPricePending) {
      return 0;
    }
    if (typeof item.price === 'number') {
      return item.price;
    }
    if (typeof item.price === 'string') {
      const normalized = item.price.toLowerCase();
      if (normalized.includes('pendiente') || normalized.includes('cotiza')) {
        return 0;
      }
      return parseFloat(item.price.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    }
    return 0;
  };

  const formatPrice = (item: CartItem): string => {
    if (item.isPricePending) {
      return existingOrder
        ? item.priceLabel || 'Incluido en total'
        : item.priceLabel || 'Precio pendiente de aprobación';
    }
    if (typeof item.price === 'number') {
      return `$${item.price.toFixed(2)}`;
    }
    if (typeof item.price === 'string') {
      const trimmed = item.price.trim();
      if (!trimmed) {
        return existingOrder ? 'Incluido en total' : '$0.00';
      }
      const normalized = trimmed.toLowerCase();
      if (normalized.includes('cotiza') || normalized.includes('pendiente')) {
        return trimmed;
      }
      const parsed = parseFloat(trimmed.replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (!Number.isNaN(parsed)) {
        return `$${parsed.toFixed(2)}`;
      }
      return trimmed;
    }
    return existingOrder ? item.priceLabel || 'Incluido en total' : '$0.00';
  };

  const calculateSubtotal = () => {
    if (existingOrder) {
      return existingOrder.subtotal ?? 0;
    }

    return cartItems.reduce((total, item) => {
      const price = getItemPrice(item);
      return total + price * item.quantity;
    }, 0);
  };

  const calculateTax = () => {
    if (existingOrder) {
      return existingOrder.tax ?? 0;
    }

    if (!isP2PEnabled) {
      return calculateSubtotal() * 0.03;
    }

    return selectedPaymentMethod === 'zelle' ? 0 : calculateSubtotal() * 0.03;
  };

  const calculateTotalValue = () => {
    return calculateSubtotal() + calculateTax();
  };

  const calculateTotal = () => {
    return calculateTotalValue().toFixed(2);
  };

  const submitCakeQuote = async () => {
    const cakeItems = cartItems.filter(
      (item) => (item.type === 'cake' || item.customization) && !existingOrder
    );

    if (cakeItems.length === 0) {
      showNotification('error', 'Sin pasteles personalizados', 'No se detectaron pasteles personalizados en tu carrito.');
      return;
    }

    const customerName = (currentUser?.full_name || currentUser?.fullName || '').trim() || 'Cliente';
    const profileEmail = (currentUser?.email || currentUser?.emailAddress || '').trim();
    const profilePhone = (currentUser?.phone || '').trim();
    const providedEmail = contactInfo.email.trim();
    const providedPhone = contactInfo.phone.trim();
    const customerEmail = providedEmail || profileEmail;
    const customerPhone = providedPhone || profilePhone;

    if (!customerPhone) {
      showNotification(
        'warning',
        'Teléfono requerido',
        'Ingresa un número de teléfono válido para coordinar tu cotización personalizada.'
      );
      return;
    }

    setIsSubmitting(true);

    let supabaseUserId: string | null = null;

    try {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const contactUpdates: Record<string, string> = {};

        if (user?.id) {
          supabaseUserId = user.id;
          if (providedEmail && providedEmail !== profileEmail) {
            contactUpdates.email = providedEmail;
          }
          if (providedPhone && providedPhone !== profilePhone) {
            contactUpdates.phone = providedPhone;
          }

          if (Object.keys(contactUpdates).length > 0) {
            await supabase
              .from('profiles')
              .update({
                ...contactUpdates,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);

            setCurrentUser((prev: any) => (prev ? { ...prev, ...contactUpdates } : prev));
          }
        }
      } catch (profileUpdateError) {
        console.warn('No se pudo actualizar el perfil con los datos de contacto:', profileUpdateError);
      }

      await persistPhoneToProfile(customerPhone);

      const formattedItems = cartItems.map((item) => {
        const numericPrice = getItemPrice(item);
        const priceLabel = item.priceLabel || (item.isPricePending ? 'Precio pendiente de aprobación' : undefined);

        return {
          name: item.name,
          quantity: item.quantity,
          price: item.isPricePending ? null : numericPrice,
          details: getCustomizationDetails(item),
          customization: item.customization || null,
          type: item.type || null,
          photoUrl: item.photoUrl || null,
          ...(priceLabel ? { price_label: priceLabel } : {}),
          ...(item.isPricePending ? { isPricePending: true } : {}),
        };
      });

      const cakeSummaries = cakeItems.map((item, index) => {
        const detail = getCustomizationDetails(item);
        return `Pastel ${index + 1}: ${item.name}${detail ? `\n${detail}` : ''}`;
      });

      const pickupDateLine = formData.pickupDate
        ? `\nFecha preferida de recogida: ${formatPickupDateForSummary(formData.pickupDate)}`
        : '';
      const pickupTimeLine = formData.pickupTime
        ? `\nHora preferida de recogida: ${formData.pickupTime}`
        : '';
      const specialLine = formData.specialRequests.trim()
        ? `\nSolicitudes especiales: ${formData.specialRequests.trim()}`
        : '';

      const summary = `Resumen de personalización:\n${cakeSummaries.join('\n\n')}${pickupDateLine}${pickupTimeLine}${specialLine}`;
      const referenceCode = `CAKE-${Date.now()}`;

      const subtotalValue = cartItems.reduce((total, item) => {
        return total + getItemPrice(item) * item.quantity;
      }, 0);
      const taxValue = 0;
      const totalValue = subtotalValue + taxValue;

      const specialRequestSections = [
        summary,
        '---',
        `Referencia interna: ${referenceCode}`,
        'Estado: Esperando confirmación de precio personalizado.',
      ];

      const orderPayload: Record<string, any> = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        billing_address: billingAddress.trim() ? billingAddress.trim() : null,
        items: formattedItems,
        subtotal: Number(subtotalValue.toFixed(2)),
        tax: Number(taxValue.toFixed(2)),
        total: Number(totalValue.toFixed(2)),
        pickup_date: formData.pickupDate || null,
        pickup_time: formData.pickupTime || null,
        special_requests: specialRequestSections.join('\n\n'),
        status: 'pending',
        payment_status: 'pending',
        payment_type: 'manual_quote',
        order_date: new Date().toISOString().split('T')[0],
      };

      if (supabaseUserId) {
        orderPayload.user_id = supabaseUserId;
      }

      const storedBillingValue = orderPayload.billing_address ?? null;

      let {
        data: insertedData,
        error: insertError,
      } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (insertError && isMissingBillingColumn(insertError)) {
        console.warn(
          "La columna 'billing_address' no existe en la tabla orders. Reintentando sin esa columna."
        );
        const fallbackPayload = { ...orderPayload };
        delete fallbackPayload.billing_address;
        const retryResponse = await supabase
          .from('orders')
          .insert([fallbackPayload])
          .select()
          .single();

        insertError = retryResponse.error;
        insertedData = retryResponse.data
          ? { ...retryResponse.data, billing_address: storedBillingValue }
          : retryResponse.data;
      }

      if (insertError) {
        throw new Error(insertError?.message || 'No se pudo guardar la orden personalizada.');
      }

      const insertedOrder = insertedData || {};
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('User not authenticated');
      }
      const finalReference = referenceCode;

      try {
        await notifyBusinessAboutOrder({
          id: insertedOrder.id || finalReference,
          status: insertedOrder.status || 'pending',
          customerName: customerName,
          customerPhone: customerPhone,
          customerEmail: customerEmail || undefined,
          pickupDate: formData.pickupDate || null,
          pickupTime: formData.pickupTime || null,
          specialRequests: orderPayload.special_requests,
          subtotal: orderPayload.subtotal,
          tax: orderPayload.tax,
          total: orderPayload.total,
          items: cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: getItemPrice(item),
          })),
          paymentMethod: 'manual_quote',
        }, { accessToken });
      } catch (notificationError) {
        console.log('No se pudo notificar al negocio sobre la orden personalizada:', notificationError);
      }

      if (customerEmail) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseUrl) {
            await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                to: customerEmail,
                type: 'customer_quote_confirmation',
                language: 'es',
                quoteData: {
                  customer_email: customerEmail,
                  customer_phone: customerPhone,
                  reference_code: finalReference,
                  cart_items: formattedItems,
                  event_details: summary,
                },
              }),
            });
          }
        } catch (customerNotificationError) {
          console.log('Error enviando confirmación al cliente:', customerNotificationError);
        }
      }

      localStorage.removeItem('bakery-cart');
      localStorage.removeItem('bakery-order-form');

      setQuoteSubmitted(true);
      setQuoteReference(finalReference);
      setCartItems([]);
      setFormData({ specialRequests: '', pickupDate: '', pickupTime: '' });
      setShowPayment(false);
      setShowCardForm(false);
      setShowP2PInstructions(false);

      showNotification(
        'success',
        'Orden enviada',
        'Tu pedido personalizado fue enviado al propietario. Te contactaremos pronto con la confirmación del precio.'
      );
    } catch (err: any) {
      console.error('Error enviando orden personalizada:', err);
      showNotification(
        'error',
        'Error al enviar la orden',
        err?.message || 'Ocurrió un error al enviar tu pedido personalizado. Intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      showNotification('warning', 'Carrito Vacío', 'Tu carrito está vacío. Por favor agrega productos del menú primero.');
      return;
    }

    if (!existingOrder && !formData.pickupDate) {
      showNotification('warning', 'Fecha de Recogida', 'Por favor selecciona una fecha de recogida antes de continuar.');
      return;
    }

    if (!existingOrder && !formData.pickupTime) {
      showNotification('warning', 'Hora de Recogida', 'Por favor selecciona una hora de recogida antes de continuar.');
      return;
    }

    const contactPhone = contactInfo.phone.trim();
    const existingOrderPhone = (existingOrder?.customer_phone || '').trim();
    const phoneAvailable = contactPhone || profilePhoneFromState || existingOrderPhone;

    if (!phoneAvailable) {
      showNotification(
        'warning',
        'Teléfono requerido',
        'Agrega un número de teléfono en tu perfil o en la sección de contacto para continuar con tu pedido.'
      );
      return;
    }

    if (existingOrder) {
      setShowPayment(true);
      return;
    }

    const containsCake = cartItems.some((item) => item.type === 'cake' || item.customization);
    if (containsCake) {
      await submitCakeQuote();
      return;
    }

    setShowPayment(true);
  };

  const processPayment = async () => {
    setIsSubmitting(true);

    try {
      console.log('🔥 Iniciando proceso de pago:', selectedPaymentMethod);

      const postalCode = billingPostalCode.trim();
      const contactPhoneValue = contactInfo.phone.trim();
      const existingOrderPhone = (existingOrder?.customer_phone || '').trim();
      const customerPhone = contactPhoneValue || profilePhoneFromState || existingOrderPhone;

      if (!customerPhone) {
        showNotification(
          'warning',
          'Teléfono requerido',
          'Agrega o actualiza un número de teléfono válido en tu perfil antes de continuar con el pago.'
        );
        return;
      }

      await persistPhoneToProfile(customerPhone);

      const effectivePickupDate = existingOrder?.pickup_date || formData.pickupDate || null;
      const effectivePickupTime = existingOrder?.pickup_time || formData.pickupTime || null;

      if (saveBillingAddress && postalCode) {
        localStorage.setItem(
          'bakery-billing-address',
          JSON.stringify({ postalCode })
        );
      } else {
        localStorage.removeItem('bakery-billing-address');
      }

      if (isP2PEnabled && selectedPaymentMethod === 'zelle') {
        const totalAmount = Number(calculateTotalValue().toFixed(2));
        setP2PInstructions({
          method: 'zelle',
          amount: totalAmount,
          email: p2pPaymentConfig.zelle.email,
          name: p2pPaymentConfig.zelle.name,
          instructions: p2pPaymentConfig.zelle.instructions,
        });
        setShowP2PInstructions(true);
        setShowPayment(false);
        setShowCardForm(false);
        return;
      }


      if (selectedPaymentMethod === 'card' && !postalCode) {
        showNotification(
          'warning',
          'Código postal requerido',
          'Square necesita un código postal de facturación para procesar tu pago.'
        );
        return;
      }



      // Tokenizar con Square según el método seleccionado
      let sourceId: string | undefined;

      if (selectedPaymentMethod === 'card') {
        if (!card) {
          throw new Error('Square Card no está inicializado. Por favor recarga la página.');
        }
        const res = await card.tokenize();
        if (!res || res.status !== 'OK') {
          throw new Error(res?.errors?.[0]?.detail || 'Error al procesar la tarjeta');
        }
        sourceId = res.token;
      } else {
        throw new Error('Método de pago no válido');
      }

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const accessToken = session?.access_token;
      if (!userId || !accessToken) {
        throw new Error('User not authenticated');
      }

      // Crear pago con Square usando el token
      const subtotal = Number(calculateSubtotal().toFixed(2));
      const tax = Number(calculateTax().toFixed(2));
      const total = Number(calculateTotalValue().toFixed(2));

      const paymentResult = await createSquarePayment({
        amount: total,
        subtotal,
        tax,
        items: cartItems.map(item => ({
          name: item.name,
          price: getItemPrice(item),
          quantity: item.quantity,
          photoUrl: item.photoUrl,
          details: getCustomizationDetails(item),
          type: item.type,
          customization: item.customization,
        })),
        customerInfo: {
          name: (currentUser?.full_name || currentUser?.fullName || '').trim(),
          phone: customerPhone,
          email: currentUser?.email || '',
          billingAddress: postalCode,
        },
        paymentMethod: 'card',
        sourceId,
        currency: 'USD',
        userId,
        pickupDate: effectivePickupDate || undefined,
        pickupTime: effectivePickupTime || undefined,
        specialRequests: (existingOrder?.special_requests || formData.specialRequests)?.trim() || undefined,
        orderId: existingOrder?.id,
      }, { accessToken });

      if (paymentResult.success) {
        const subtotal = Number(calculateSubtotal().toFixed(2));
        const tax = Number(calculateTax().toFixed(2));
        const total = Number(parseFloat(calculateTotal()).toFixed(2));

        const notificationResult = await notifyBusinessAboutOrder({
          id: paymentResult.orderId ?? 'SIN-ID',
          status: 'pending',
          customerName: (currentUser?.full_name || currentUser?.fullName || 'Cliente').trim(),
          customerPhone: customerPhone,
          customerEmail: currentUser?.email || undefined,
          pickupDate: effectivePickupDate,
          pickupTime: effectivePickupTime,
          specialRequests: (existingOrder?.special_requests || formData.specialRequests)?.trim() || null,
          subtotal,
          tax,
          total,
          paymentMethod: 'Pago con tarjeta (Square)',
          items: cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: getItemPrice(item),
          })),
        }, { accessToken });

        if (!notificationResult.success) {
          console.warn('No se pudo enviar la notificación de la orden al negocio');
        }

        // Limpiar carrito y formulario
        localStorage.removeItem('bakery-cart');
        localStorage.removeItem('bakery-order-form');

        // Mostrar éxito
        setShowSuccess(true);
        setShowPayment(false);
        setShowCardForm(false);

        if (existingOrder) {
          setExistingOrder({
            ...existingOrder,
            payment_status: 'completed',
            payment_type: 'card',
            subtotal,
            tax,
            total,
            items: cartItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: getItemPrice(item),
              photoUrl: item.photoUrl,
              details: getCustomizationDetails(item),
              customization: item.customization,
              type: item.type,
            })),
            customer_phone: customerPhone,
            billing_address: postalCode,
            pickup_date: effectivePickupDate,
            pickup_time: effectivePickupTime,
          } as Order);
        }

        // Redirigir al dashboard
        setTimeout(() => {
          setShowSuccess(false);
          router.push(existingOrder ? '/track' : '/dashboard');
        }, 3000);
      }

      // Validación: Solo continuar si el procesamiento fue exitoso
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Error en el procesamiento del pago');
      }

    } catch (error: any) {
      console.error('❌ Error en el proceso de pago:', error);
      showNotification('error', 'Error en el Pago', error?.message || 'Por favor intenta de nuevo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmP2POrder = async () => {
    setIsSubmitting(true);

    try {
      const postalCode = billingPostalCode.trim();
      const contactPhoneValue = contactInfo.phone.trim();
      const existingOrderPhone = (existingOrder?.customer_phone || '').trim();
      const customerPhone = contactPhoneValue || profilePhoneFromState || existingOrderPhone;

      if (!customerPhone) {
        showNotification(
          'warning',
          'Teléfono requerido',
          'Agrega o actualiza un número de teléfono válido en tu perfil antes de continuar con la orden.'
        );
        return;
      }

      await persistPhoneToProfile(customerPhone);

      if (saveBillingAddress && postalCode) {
        localStorage.setItem(
          'bakery-billing-address',
          JSON.stringify({ postalCode })
        );
      } else {
        localStorage.removeItem('bakery-billing-address');
      }

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const accessToken = session?.access_token;
      if (!userId || !accessToken) {
        throw new Error('User not authenticated');
      }

      const effectivePickupDate = existingOrder?.pickup_date || formData.pickupDate || null;
      const effectivePickupTime = existingOrder?.pickup_time || formData.pickupTime || null;

      const result = await createP2POrder({
        amount: existingOrder ? existingOrder.total ?? calculateSubtotal() : calculateSubtotal(),
        items: cartItems.map(item => ({
          name: item.name,
          price: getItemPrice(item),
          quantity: item.quantity,
          photoUrl: item.photoUrl,
          details: getCustomizationDetails(item),
          type: item.type,
          customization: item.customization,
        })),
        customerInfo: {
          name: (currentUser?.full_name || currentUser?.fullName || '').trim(),
          phone: customerPhone,
          email: currentUser?.email || '',
          billingAddress: postalCode,
        },
        paymentMethod: 'zelle',
        userId,
        pickupDate: effectivePickupDate || undefined,
        pickupTime: effectivePickupTime || undefined,
        specialRequests: (existingOrder?.special_requests || formData.specialRequests)?.trim() || undefined,
        orderId: existingOrder?.id,
      }, { accessToken });

      if (!result || !result.success) {
        throw new Error(result?.error || 'Error creando la orden');
      }

      const subtotal = Number(calculateSubtotal().toFixed(2));
      const total = subtotal; // Zelle no tiene impuestos adicionales

      const notificationResult = await notifyBusinessAboutOrder({
        id: result.orderId ?? 'SIN-ID',
        status: 'pending',
        customerName: (currentUser?.full_name || currentUser?.fullName || 'Cliente').trim(),
        customerPhone: customerPhone,
        customerEmail: currentUser?.email || undefined,
        pickupDate: effectivePickupDate,
        pickupTime: effectivePickupTime,
        specialRequests: (existingOrder?.special_requests || formData.specialRequests)?.trim() || null,
        subtotal,
        tax: 0,
        total,
        paymentMethod: 'Transferencia Zelle',
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: getItemPrice(item),
        })),
      }, { accessToken });

      if (!notificationResult.success) {
        console.warn('No se pudo enviar la notificación de la orden al negocio');
      }

      // Limpiar carrito y formulario
      localStorage.removeItem('bakery-cart');
      localStorage.removeItem('bakery-order-form');

      setShowSuccess(true);
      setShowP2PInstructions(false);

      if (existingOrder) {
        setExistingOrder({
          ...existingOrder,
          payment_status: 'pending',
          payment_type: 'zelle',
          items: cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: getItemPrice(item),
            photoUrl: item.photoUrl,
            details: getCustomizationDetails(item),
            customization: item.customization,
            type: item.type,
          })),
          customer_phone: customerPhone,
          billing_address: postalCode,
          pickup_date: effectivePickupDate,
          pickup_time: effectivePickupTime,
        } as Order);
      }

      setTimeout(() => {
        setShowSuccess(false);
        router.push(existingOrder ? '/track' : '/dashboard');
      }, 3000);
    } catch (err: any) {
      console.error('❌ Error confirmando pago P2P:', err);
      showNotification('error', 'Error en el Pedido', err?.message || 'Por favor intenta de nuevo');
    }

    setIsSubmitting(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (existingOrder) {
      showNotification(
        'warning',
        'Pedido en revisión',
        'Si necesitas cambiar la hora o notas, contacta directamente a la panadería.'
      );
      return;
    }

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

  // Componente de instrucciones P2P para Zelle
  const P2PInstructionsModal = () => {
    if (!showP2PInstructions || !p2pInstructions) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mx-auto mb-4">
            <i className="ri-bank-line text-green-600 text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Información de Pago Zelle</h3>
          <p className="text-gray-600 text-sm mb-4">Monto a pagar: <span className="font-mono text-green-600">${p2pInstructions.amount.toFixed(2)}</span></p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between bg-white rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center">
                <i className="ri-mail-line text-blue-600 mr-3 text-xl"></i>
                <div>
                  <p className="text-xs text-gray-600">Correo</p>
                  <span className="font-bold text-lg text-gray-800">{p2pInstructions.email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(p2pInstructions.email);
                  showNotification('success', 'Copiado', 'Correo copiado al portapapeles');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center"
              >
                <i className="ri-file-copy-line mr-2"></i>
                Copiar
              </button>
            </div>

            <div className="flex items-center justify-between bg-white rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center">
                <i className="ri-user-line text-blue-600 mr-3 text-xl"></i>
                <div>
                  <p className="text-xs text-gray-600">Nombre</p>
                  <span className="font-bold text-lg text-gray-800">{p2pInstructions.name}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(p2pInstructions.name);
                  showNotification('success', 'Copiado', 'Nombre copiado al portapapeles');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center"
              >
                <i className="ri-file-copy-line mr-2"></i>
                Copiar
              </button>
            </div>
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
            onClick={confirmP2POrder}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enviando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <i className="ri-check-line text-xl mr-2"></i>
                Confirmar con Propietario
              </div>
            )}
          </button>

          <button
            onClick={() => {
              setShowP2PInstructions(false);
              setShowPayment(true);
            }}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
          >
            Elegir otro método de pago
          </button>

          <p className="text-center text-xs text-gray-500">
            Tu orden se enviará al propietario para verificación del pago
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

  if (quoteSubmitted) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 flex items-center justify-center bg-pink-100 rounded-full mx-auto mb-4">
          <i className="ri-customer-service-2-line text-pink-500 text-2xl"></i>
        </div>
        <h3 className="text-xl font-bold text-pink-600 mb-2">¡Pedido enviado!</h3>
        <p className="text-gray-600 mb-3">
          El propietario revisará tu personalización y se pondrá en contacto contigo con la confirmación del precio final.
        </p>
        {quoteReference && (
          <p className="text-sm text-gray-500 mb-4">
            Código de referencia: <span className="font-mono text-pink-600">{quoteReference}</span>
          </p>
        )}
        <button
          onClick={() => router.push('/track')}
          className="w-full bg-gradient-to-r from-pink-400 to-teal-400 text-white py-3 rounded-lg font-medium"
        >
          Ver mis órdenes
        </button>
      </div>
    );
  }

  if (showCardForm) {
    return (
      <>
        <NotificationSystem />
        <Script
            src="https://web.squarecdn.com/v1/square.js"
            strategy="afterInteractive"
            onLoad={initSquareCard}
            onError={() => {
              setCardMountState('error');
              showNotification('error', 'No se pudo cargar el SDK de Square', 'Permite web.squarecdn.com / intenta sin Brave Shields');
            }}
          />

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
                <span className="text-sm font-medium text-green-800">Procesado por Square - PCI Compliant</span>
              </div>
            </div>
          </div>

          {/* CONTENEDOR PARA SQUARE CARD ELEMENT */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Detalles de la Tarjeta</h4>

          <div id="card-container" className="border rounded-lg p-4 min-h-[90px] flex items-center justify-center">
            {cardMountState === 'loading' && (
              <span className="text-gray-500 text-sm">Cargando formulario seguro…</span>
            )}
            {cardMountState === 'error' && (
              <div className="text-center text-sm">
                <div className="text-red-600 font-medium mb-2">No se pudo cargar el formulario.</div>
                <div className="text-gray-600 mb-3">
                  Si usas Brave/AdBlock, permite <code>web.squarecdn.com</code> o desactiva “Shields” para este sitio.
                </div>
                <button type="button" onClick={initSquareCard} className="px-3 py-2 rounded-lg bg-amber-600 text-white">
                  Reintentar
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Los datos de tu tarjeta son procesados de forma segura por Square
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Código postal de facturación</h4>
          <p className="text-xs text-gray-500 mb-2">
            Square solo requiere el código postal asociado a tu tarjeta para verificar el pago.
          </p>
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Código postal"
            inputMode="numeric"
            value={billingPostalCode}
            onChange={(e) => setBillingPostalCode(e.target.value)}
          />
          <label className="flex items-center mt-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="mr-2"
              checked={saveBillingAddress}
              onChange={(e) => setSaveBillingAddress(e.target.checked)}
            />
            Guardar este código postal para futuras compras
          </label>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Resumen del Pago</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                {calculateTax() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impuesto (3%):</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                )}
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
              disabled={isSubmitting || !card}
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

            <button
              onClick={() => {
                setShowCardForm(false);
                // Destruir el card element cuando volvemos
                if (card) {
                  card.destroy();
                  setCard(null);
                  delete (window as any).__sq_card;
                }
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
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
                {calculateTax() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impuesto (3%):</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                )}
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

              {/* Apple Pay y Google Pay deshabilitados */}

              {isP2PEnabled && (
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

                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                if (!isP2PEnabled || selectedPaymentMethod === 'card') {
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
                  {isP2PEnabled && selectedPaymentMethod === 'zelle'
                    ? 'Continuar con Zelle'
                    : 'Ingresar Datos de Tarjeta'}
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
          <a href="/menu" className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-6 py-3 rounded-lg font-medium inline-block">
            Ver Menú
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <Script
        src="https://web.squarecdn.com/v1/square.js"
        strategy="afterInteractive"
        onLoad={() => initSquareCardPayments()}
      />
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
                    <span
                      className={`text-sm ml-2 ${
                        item.isPricePending && !existingOrder
                          ? 'text-amber-600 font-medium'
                          : 'text-pink-600'
                      }`}
                    >
                      {formatPrice(item)}
                    </span>
                    {getCustomizationDetails(item) && (
                      <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">
                        {getCustomizationDetails(item)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">x{item.quantity}</span>
                    {!existingOrder && (
                      <>
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
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.name)}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2 border-t">
              {hasPendingPrice ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  El precio final será definido por la panadería. Te enviaremos la cotización para confirmar antes de pagar.
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  {calculateTax() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Impuesto (3%):</span>
                      <span>${calculateTax().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-800">Total:</span>
                    <span className="text-lg font-bold text-pink-600">${calculateTotal()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Preferida de Recogida
            </label>
            <input
              type="date"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={handleInputChange}
              min={minPickupDate}
              required={!existingOrder}
              disabled={Boolean(existingOrder)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm ${
                existingOrder ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
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
              required={!existingOrder}
              disabled={Boolean(existingOrder)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm ${
                existingOrder ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
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

          {shouldShowContactSection && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-800">
                Confirma tus datos de contacto
              </h4>
              <p className="text-xs text-purple-700 mt-1">
                Necesitamos al menos un correo o teléfono válido para enviarte la cotización personalizada.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-purple-800 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={handleContactInfoChange('email')}
                    placeholder="tu@email.com"
                    required={requiresContactEmail}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                  />
                  {requiresContactEmail && (
                    <p className="text-[11px] text-purple-600 mt-1">Ingresa un correo para recibir la respuesta del bakery.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-800 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={handleContactInfoChange('phone')}
                    placeholder="(555) 123-4567"
                    required={requiresContactPhone}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                  />
                  {requiresContactPhone && (
                    <p className="text-[11px] text-purple-600 mt-1">
                      {profileHasPhone
                        ? 'Puedes actualizar el número si necesitas un contacto diferente para esta orden.'
                        : 'Ingresa un número de teléfono para que podamos coordinar tu pedido.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {existingOrder && systemSummary && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Resumen confirmado por la panadería</h4>
              {systemSummary && (
                <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-white border border-gray-200 rounded-md p-3">
                  {systemSummary}
                </pre>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solicitudes Especiales
            </label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
              maxLength={500}
              disabled={Boolean(existingOrder)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm h-20 resize-none ${
                existingOrder ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="¿Alguna instrucción especial o requerimientos dietéticos?"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.specialRequests.length}/500 caracteres</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-pink-400 to-teal-400 text-white py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? hasPendingPrice && !existingOrder
                ? 'Enviando personalización...'
                : 'Procesando...'
              : existingOrder
                ? `Continuar con el pago - $${calculateTotal()}`
                : hasPendingPrice
                  ? 'Enviar personalización al bakery'
                  : `Continuar al Pago - $${calculateTotal()}`}
          </button>
        </div>

        {hasPendingPrice ? (
          <div className="mt-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
            <div className="flex items-start">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-customer-service-2-line text-pink-600 text-sm"></i>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-pink-800">Revisión del propietario</h4>
                <p className="text-xs text-pink-700 mt-1">
                  Revisaremos tu personalización y te enviaremos la cotización final. Luego podrás regresar para pagar el monto aprobado.
                </p>
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </form>
    </>
  );
}