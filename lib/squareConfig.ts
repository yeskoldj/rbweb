// lib/squareConfig.ts

// ---- Public (front-end) Square config (non-secret) ----
export const squareConfig = {
  // Use production by default; switch to sandbox only for testing
  environment: 'production',
  bakeryEmail: 'rangerbakery@gmail.com',

  baseUrl: 'https://connect.squareup.com',          // Production
  sandboxUrl: 'https://connect.squareupsandbox.com', // Sandbox

  paymentOptions: {
    currency: 'USD',
    country: 'US',
    acceptedCards: ['visa', 'mastercard', 'amex', 'discover'],
    allowTip: true,
    showReceipt: true,
  },
};

// ---- P2P config with proper typing to avoid union errors ----
type ZelleConfig = {
  email: string;
  name: string;
  instructions: string;
};

export const p2pPaymentConfig: {
  zelle: ZelleConfig;
} = {
  zelle: {
    email: 'rangerbakery@gmail.com',
    name: "Ranger's Bakery LLC",
    instructions:
      'Send your payment via Zelle to the email below. After sending, click "Confirmar con Propietario" to submit your order.',
  },
};

// ---- Helpers ----
export const formatAmountForSquare = (amount: number): number => {
  // Front sends dollars; edge function will convert to cents.
  return Math.round(amount * 100);
};

// Validate that a string is a properly formatted UUID
export const isValidUUID = (value?: string | null): boolean => {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// ---- Types for Square payments ----
export type SquarePaymentMethod = 'card' | 'apple_pay' | 'google_pay';

export type SquareOrderItem = {
  name: string;
  price: number;     // unit price in dollars
  quantity: number;
};

export interface SquareOrderData {
  amount: number; // in dollars (NOT cents)
  items: SquareOrderItem[];
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  paymentMethod: SquarePaymentMethod;

  // Token returned by Square Web Payments SDK (card / Apple Pay / Google Pay)
  sourceId?: string;

  userId?: string;
  pickupTime?: string | null;
  specialRequests?: string | null;
  currency?: 'USD';
}

// ---- Square payment (calls Supabase Edge Function) ----
export async function createSquarePayment(orderData: SquareOrderData) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

    const functionUrl = `${supabaseUrl}/functions/v1/square-payment`;

    const sanitizedOrderData = {
      ...orderData,
      userId: orderData.userId && isValidUUID(orderData.userId) ? orderData.userId : undefined,
      currency: orderData.currency ?? 'USD',
      // DO NOT send raw card data; we use sourceId from the SDK
    };

    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // anon key is public; the edge function still enforces server-side security
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'create_payment',
        orderData: sanitizedOrderData,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }

    const result = await res.json();

    if (!result?.success) {
      throw new Error(result?.error || 'Square payment failed');
    }

    return {
      success: true,
      paymentId: result.paymentId,
      orderId: result.orderId,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      environment: result.environment ?? 'production',
    };
  } catch (err: any) {
    console.error('createSquarePayment error:', err);
    return {
      success: false,
      error: err?.message || 'Error processing Square payment',
      paymentId: null,
      orderId: null,
    };
  }
}

// ---- P2P order (Zelle) ----
export async function createP2POrder(orderData: {
  amount: number; // dollars
  items: SquareOrderItem[];
  customerInfo: { name: string; phone: string; email?: string };
  paymentMethod: 'zelle';
  userId?: string;
  pickupTime?: string;
  specialRequests?: string;
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

    const functionUrl = `${supabaseUrl}/functions/v1/p2p-payment`;

    const sanitizedOrderData = {
      ...orderData,
      userId: orderData.userId && isValidUUID(orderData.userId) ? orderData.userId : undefined,
    };

    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'create_order',
        orderData: sanitizedOrderData,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }

    const result = await res.json();
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to create P2P order');
    }

    const paymentConfig = p2pPaymentConfig.zelle;

    return {
      success: true,
      orderId: result.orderId,
      reference: result.reference,
      status: 'pending_payment' as const,
      paymentInstructions: {
        method: orderData.paymentMethod,
        amount: orderData.amount,
        email: paymentConfig.email,
        name: paymentConfig.name,
        instructions: paymentConfig.instructions,
        orderId: result.orderId,
        reference: result.reference,
      },
    };
  } catch (err: any) {
    console.error('createP2POrder error:', err);
    return {
      success: false,
      error: err?.message || 'Error creating P2P order',
    };
  }
}

// ---- Refund (calls Square edge function) ----
export async function processRefund(paymentId: string, amount?: number) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

    const functionUrl = `${supabaseUrl}/functions/v1/square-payment`;

    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'refund',
        orderData: { paymentId, amount },
      }),
    });

    const result = await res.json();
    if (!result?.success) {
      throw new Error(result?.error || 'Refund failed');
    }

    return {
      success: true,
      refundId: result.refundId,
      status: 'completed' as const,
      amount: amount ?? 0,
      originalPaymentId: paymentId,
      environment: result.environment ?? 'production',
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error processing refund' };
  }
}

// ---- Status (calls Square edge function) ----
export async function getPaymentStatus(paymentId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

    const functionUrl = `${supabaseUrl}/functions/v1/square-payment`;

    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'get_status',
        orderData: { paymentId },
      }),
    });

    const result = await res.json();
    if (!result?.success) {
      throw new Error(result?.error || 'Unable to get payment status');
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Status check failed' };
  }
}
