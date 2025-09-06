
// ✅ CONFIGURACIÓN CLOVER LISTA PARA PRODUCCIÓN
export const cloverConfig = {
  // CONFIGURACIÓN DINÁMICA - SE ACTUALIZARÁ AUTOMÁTICAMENTE CON TUS TOKENS DE PRODUCCIÓN
  environment: 'production', // Cambiado a producción
  bakeryEmail: 'rangerbakery@gmail.com',
  
  // URLs DE PRODUCCIÓN - LISTAS PARA TUS TOKENS REALES
  baseChargeUrl: 'https://scl.clover.com', // URL de producción
  baseTokenUrl: 'https://token.clover.com', // URL de producción
    
  paymentOptions: {
    currency: 'USD',
    country: 'US',
    acceptedCards: ['visa', 'mastercard', 'amex', 'discover'],
    allowTip: true,
    showReceipt: true
  }
};

export const formatAmountForClover = (amount: number): number => {
  return Math.round(amount * 100);
};

export const createCloverPayment = async (orderData: {
  amount: number;
  items: Array<{name: string, price: string | number, quantity: number}>;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  cardInfo: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
  userId?: string;
  pickupTime?: string;
  specialRequests?: string;
}) => {
  try {
    console.log('🚀 Iniciando proceso de pago Clover - CONFIGURACIÓN DE PRODUCCIÓN');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/clover-payment`;

    console.log('📤 Enviando solicitud a Edge Function (PRODUCCIÓN)...');

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        orderData: {
          ...orderData,
          cardInfo: {
            ...orderData.cardInfo,
            number: orderData.cardInfo.number.replace(/\s/g, ''),
            expiry: orderData.cardInfo.expiry,
            cvv: orderData.cardInfo.cvv,
            name: orderData.cardInfo.name.trim()
          }
        },
        action: 'create_payment'
      })
    });

    console.log('📥 Respuesta de Edge Function (PRODUCCIÓN) - Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error HTTP de Clover:', errorText);
      throw new Error(`Error HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('📋 Resultado del pago PRODUCCIÓN:', {
      success: result.success,
      paymentId: result.paymentId,
      orderId: result.orderId,
      status: result.status,
      environment: result.environment,
      error: result.error
    });

    if (result.success) {
      console.log('✅ Pago exitoso en PRODUCCIÓN!');
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
      console.error('❌ Clover rechazó el pago:', result.error);
      throw new Error(result.error || 'Pago rechazado por Clover');
    }
  } catch (error: any) {
    console.error('❌ Error en createCloverPayment (PRODUCCIÓN):', error);
    return {
      success: false,
      error: error.message || 'Error al procesar el pago con Clover',
      paymentId: null,
      orderId: null
    };
  }
};

export const createPaymentIntent = async (orderData: {
  amount: number;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
}) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/clover-payment`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        orderData,
        action: 'create_payment_intent'
      })
    });

    const result = await response.json();

    if (result.success) {
      return result;
    } else {
      throw new Error(result.error || 'Failed to create payment intent');
    }
  } catch (error) {
    console.error('Payment intent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent'
    };
  }
};

export const processRefund = async (paymentId: string, amount?: number) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/clover-payment`;

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
    const functionUrl = `${supabaseUrl}/functions/v1/clover-payment`;

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
