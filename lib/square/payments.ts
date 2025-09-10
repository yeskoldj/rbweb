// lib/square/payments.ts

import { EDGE_FUNCTIONS } from './config';

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
export type SquarePaymentMethod = 'card';

export type SquareOrderItem = {
  name: string;
  price: number; // unit price in dollars
  quantity: number;
};

export interface SquareOrderData {
  amount: number; // in dollars (NOT cents)
  items: SquareOrderItem[];
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    billingAddress?: string;
  };
  paymentMethod: SquarePaymentMethod;

  // Token returned by Square Web Payments SDK (card)
  sourceId?: string;

  userId: string;
  pickupTime?: string | null;
  specialRequests?: string | null;
  currency?: 'USD';
}

// ---- Square payment (calls Supabase Edge Function) ----
export async function createSquarePayment(orderData: SquareOrderData) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

    const functionUrl = `${supabaseUrl}/functions/v1/${EDGE_FUNCTIONS.square}`;
    if (!isValidUUID(orderData.userId)) {
      throw new Error('Invalid userId');
    }

    const sanitizedOrderData = {
      ...orderData,
      currency: orderData.currency ?? 'USD',
      // DO NOT send raw card data; we use sourceId from the SDK
    };

    // Abort the request if the Edge Function takes too long to respond
    async function fetchWithTimeout(url: string, options: RequestInit, timeout = 15000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    }

    const res = await fetchWithTimeout(functionUrl, {
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
      error:
        err?.name === 'AbortError'
          ? 'Payment request timed out'
          : err?.message || 'Error processing Square payment',
      paymentId: null,
      orderId: null,
    };
  }
}

// ---- Refund (calls Square edge function) ----
export async function processRefund(paymentId: string, amount?: number) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

    const functionUrl = `${supabaseUrl}/functions/v1/${EDGE_FUNCTIONS.square}`;

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

    const functionUrl = `${supabaseUrl}/functions/v1/${EDGE_FUNCTIONS.square}`;

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
