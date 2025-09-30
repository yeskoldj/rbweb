// lib/square/p2p.ts

import { EDGE_FUNCTIONS } from './config';
import { isValidUUID, SquareOrderItem } from './payments';

// ---- P2P config with proper typing to avoid union errors ----
type ZelleConfig = {
  email: string;
  name: string;
  instructions: string;
};

export const p2pPaymentConfig: { zelle: ZelleConfig } = {
  zelle: {
    email: 'rangerbakery@gmail.com',
    name: "Ranger's Bakery LLC",
    instructions:
      'Send your payment via Zelle to the email below. After sending, click "Confirmar con Propietario" to submit your order.',
  },
};

// ---- P2P order (Zelle) ----
export async function createP2POrder(orderData: {
  amount: number; // dollars
  items: SquareOrderItem[];
  customerInfo: { name: string; phone: string; email?: string; billingAddress?: string };
  paymentMethod: 'zelle';
  userId: string;
  pickupTime?: string;
  pickupDate?: string;
  specialRequests?: string;
  orderId?: string;
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

    const functionUrl = `${supabaseUrl}/functions/v1/${EDGE_FUNCTIONS.p2p}`;
    if (!isValidUUID(orderData.userId)) {
      throw new Error('Invalid userId');
    }

    const sanitizedOrderData = {
      ...orderData,
    };

    async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const res = await fetch(url, options);
          if (!res.ok) {
            const txt = await res.text();
            throw new Error(`HTTP ${res.status}: ${txt}`);
          }
          return res;
        } catch (err) {
          if (attempt === retries - 1) throw err;
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
      }
      throw new Error('Unexpected fetch retry error');
    }

    const res = await fetchWithRetry(functionUrl, {
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
