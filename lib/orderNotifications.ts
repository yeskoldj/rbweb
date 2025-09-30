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

interface OrderNotificationResultDetail {
  recipient: string;
  success: boolean;
  error?: string;
}

interface OrderNotificationResult {
  success: boolean;
  error?: string;
  details?: OrderNotificationResultDetail[];
}

export async function notifyBusinessAboutOrder(payload: OrderNotificationPayload): Promise<OrderNotificationResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const businessEmail =
    process.env.NEXT_PUBLIC_BUSINESS_NOTIFICATION_EMAIL || 'rangerbakery@gmail.com';
  const employeeEmails = (process.env.NEXT_PUBLIC_EMPLOYEE_NOTIFICATION_EMAILS || '')
    .split(',')
    .map(email => email.trim())
    .filter(Boolean);

  if (!supabaseUrl || !anonKey) {
    console.warn('Missing Supabase configuration for order notifications');
    return { success: false, error: 'Supabase configuration missing' };
  }

  const recipients = Array.from(new Set([businessEmail, ...employeeEmails]));

  const results = await Promise.all(
    recipients.map(async (recipient) => {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            to: recipient,
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

        return { recipient, success: true };
      } catch (error: any) {
        console.error(`Error sending business notification to ${recipient}:`, error);
        return { recipient, success: false, error: error?.message || 'Unknown error' };
      }
    })
  );

  const failedRecipients = results.filter((result) => !result.success);

  if (failedRecipients.length > 0) {
    const errorMessage = `Failed to notify: ${failedRecipients
      .map(({ recipient }) => recipient)
      .join(', ')}`;

    return {
      success: false,
      error: errorMessage,
      details: results,
    };
  }

  return { success: true, details: results };
}
