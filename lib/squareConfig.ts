
// ✅ CONFIGURACIÓN SQUARE CORREGIDA
export const squareConfig = {
  environment: 'production',
  bakeryEmail: 'rangerbakery@gmail.com',
  
  baseUrl: 'https://connect.squareup.com', // Producción
  sandboxUrl: 'https://connect.squareupsandbox.com', // Sandbox
    
  paymentOptions: {
    currency: 'USD',
    country: 'US',
    acceptedCards: ['visa', 'mastercard', 'amex', 'discover'],
    allowTip: true,
    showReceipt: true
  }
};

// Configuración P2P
export const p2pPaymentConfig = {
  zelle: {
    email: 'rangerbakery@gmail.com',
    phone: '(862) 233-7204',
    instructions: 'Envía el pago por Zelle y toma captura de pantalla como comprobante. Tu orden será confirmada una vez verificado el pago.'
  },
  cashapp: {
    handle: '$RangersBakery',
    instructions: 'Envía el pago por Cash App a $RangersBakery. Incluye tu número de orden en la nota. Tu orden será confirmada una vez verificado el pago.'
  },
  venmo: {
    handle: '@RangersBakery',
    instructions: 'Envía el pago por Venmo a @RangersBakery. Incluye tu número de orden en la nota. Tu orden será confirmada una vez verificado el pago.'
  }
};

export const formatAmountForSquare = (amount: number): number => {
  return Math.round(amount * 100);
};

export const createSquarePayment = async (orderData: {
  amount: number;
  items: Array<{name: string, price: number, quantity: number}>;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  cardInfo?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
  paymentMethod: 'card' | 'apple_pay' | 'google_pay';
  userId?: string;
  pickupTime?: string;
  specialRequests?: string;
}) => {
  try {
    console.log('🚀 Iniciando proceso de pago Square');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/square-payment`;

    console.log('📤 Enviando solicitud a Edge Function Square...');

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        orderData: {
          ...orderData,
          cardInfo: orderData.cardInfo ? {
            ...orderData.cardInfo,
            number: orderData.cardInfo.number.replace(/\s/g, ''),
            expiry: orderData.cardInfo.expiry,
            cvv: orderData.cardInfo.cvv,
            name: orderData.cardInfo.name.trim()
          } : undefined
        },
        action: 'create_payment'
      })
    });

    console.log('📥 Respuesta de Edge Function Square - Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error HTTP de Square:', errorText);
      throw new Error(`Error HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('📋 Resultado del pago Square:', {
      success: result.success,
      paymentId: result.paymentId,
      orderId: result.orderId,
      status: result.status,
      error: result.error
    });

    if (result.success) {
      console.log('✅ Pago exitoso con Square!');
      return {
        success: true,
        paymentId: result.paymentId,
        orderId: result.orderId,
        status: result.status,
        amount: result.amount,
        currency: result.currency,
        environment: 'production'
      };
    } else {
      console.error('❌ Square rechazó el pago:', result.error);
      throw new Error(result.error || 'Pago rechazado por Square');
    }
  } catch (error: any) {
    console.error('❌ Error en createSquarePayment:', error);
    return {
      success: false,
      error: error.message || 'Error al procesar el pago con Square',
      paymentId: null,
      orderId: null
    };
  }
};

export const createP2POrder = async (orderData: {
  amount: number;
  items: Array<{name: string, price: number, quantity: number}>;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  paymentMethod: 'zelle' | 'cashapp' | 'venmo';
  userId?: string;
  pickupTime?: string;
  specialRequests?: string;
}) => {
  try {
    console.log('🚀 Iniciando proceso P2P:', orderData.paymentMethod);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/p2p-payment`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        orderData,
        action: 'create_order'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Orden P2P creada exitosamente!');
      
      // Obtener instrucciones de pago
      const paymentConfig = p2pPaymentConfig[orderData.paymentMethod];
      
      return {
        success: true,
        orderId: result.orderId,
        status: 'pending_payment',
        paymentInstructions: {
          method: orderData.paymentMethod,
          amount: orderData.amount,
          email: 'email' in paymentConfig ? paymentConfig.email : undefined,
          phone: 'phone' in paymentConfig ? paymentConfig.phone : undefined,
          handle: 'handle' in paymentConfig ? paymentConfig.handle : undefined,
          instructions: paymentConfig.instructions,
          orderId: result.orderId
        }
      };
    } else {
      throw new Error(result.error || 'Error creando orden P2P');
    }
  } catch (error: any) {
    console.error('❌ Error en createP2POrder:', error);
    return {
      success: false,
      error: error.message || 'Error al crear orden P2P'
    };
  }
};

export const processRefund = async (paymentId: string, amount?: number) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/square-payment`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        orderData: { paymentId, amount },
        action: 'refund'
      })
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        refundId: result.refundId,
        status: 'completed',
        amount: amount || 0,
        originalPaymentId: paymentId,
        environment: 'production'
      };
    } else {
      throw new Error(result.error || 'Refund failed');
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error al procesar el reembolso'
    };
  }
};

export const getPaymentStatus = async (paymentId: string) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/square-payment`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        orderData: { paymentId },
        action: 'get_status'
      })
    });

    const result = await response.json();

    if (result.success) {
      return result;
    } else {
      throw new Error(result.error || 'Unable to retrieve payment status');
    }
  } catch (error) {
    return {
      success: false,
      error: 'No se pudo consultar el estado del pago'
    };
  }
};
