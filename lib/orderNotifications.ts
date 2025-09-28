export interface OrderNotificationItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderNotificationPayload {
  id: string;
  status: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string | null;
  pickupTime?: string | null;
  specialRequests?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  items: OrderNotificationItem[];
  paymentMethod?: string;
}

export async function notifyBusinessAboutOrder(payload: OrderNotificationPayload) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const businessEmail =
    process.env.NEXT_PUBLIC_BUSINESS_NOTIFICATION_EMAIL || 'rangerbakery@gmail.com';

  if (!supabaseUrl || !anonKey) {
    console.warn('Missing Supabase configuration for order notifications');
    return { success: false, error: 'Supabase configuration missing' };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        to: businessEmail,
        type: 'business_new_order',
        language: 'es',
        orderData: {
          id: payload.id,
          status: payload.status,
          customer_name: payload.customerName,
          customer_phone: payload.customerPhone,
          customer_email: payload.customerEmail,
          pickup_time: payload.pickupTime,
          special_requests: payload.specialRequests,
          subtotal: payload.subtotal,
          tax: payload.tax,
          total: payload.total,
          items: payload.items,
          payment_method: payload.paymentMethod,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      throw new Error(result?.error || 'Failed to send business notification email');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending business order notification:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}
