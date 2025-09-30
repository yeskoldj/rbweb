import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// === CONFIG ===========
const ENV = Deno.env.get("SQUARE_ENV") || "production";
// Point to the correct Square endpoint based on environment
const SQUARE_BASE_URL =
  ENV === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";

const ACCESS_TOKEN   = Deno.env.get("SQUARE_ACCESS_TOKEN") || "";
const APPLICATION_ID = Deno.env.get("SQUARE_APPLICATION_ID") || "";
const LOCATION_ID    = Deno.env.get("SQUARE_LOCATION_ID") || ""; // <-- NUEVO (opcional)

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const ENVIRONMENT = Deno.env.get('NODE_ENV') || 'development';
const ALLOWED_ORIGIN =
  Deno.env.get('ALLOWED_ORIGIN') || (ENVIRONMENT === 'development' ? '*' : '');
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const toCents = (amount: number) => Math.round(amount * 100);

// Helper to verify if a string is a valid UUID
const isValidUUID = (value: string | undefined | null): boolean => {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const isMissingBillingColumn = (error: any): boolean => {
  return typeof error?.message === 'string' && error.message.includes("'billing_address'");
};

// ======================

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  if (ALLOWED_ORIGIN !== '*' && origin && origin !== ALLOWED_ORIGIN) {
    console.warn(`Blocked request from origin: ${origin}`);
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const action   = body?.action ?? 'create_payment';
    const orderData = body?.orderData || {};
    const sourceId  = body?.sourceId ?? orderData?.sourceId; // <-- TOKEN del frontend

    if (action === 'create_payment') {
      if (typeof orderData.amount !== 'number') {
        throw new Error('Missing or invalid amount');
      }

      const idempotencyKey = `PAY_${Date.now()}_${crypto.randomUUID()}`;
      let paymentResult: any;

      // --- SIMULACIÓN si faltan credenciales ---
      if (!ACCESS_TOKEN || !APPLICATION_ID) {
        paymentResult = {
          id: `SIM_${idempotencyKey}`,
          status: 'COMPLETED',
          amount_money: { amount: toCents(orderData.amount), currency: 'USD' }
        };
      } else {
        // Pago REAL: necesitamos el token del frontend
        if (!sourceId) {
          throw new Error('Missing sourceId. Tokenize in the frontend and send it here.');
        }

        const paymentRequest: Record<string, any> = {
          source_id: sourceId,
          idempotency_key: idempotencyKey,
          amount_money: {
            amount: toCents(orderData.amount),
            currency: 'USD',
          },
          // Autocomplete por defecto = true
          buyer_email_address: orderData?.customerInfo?.email || undefined,
          note: `Online order`,
        };

        // Location (recomendado)
        if (LOCATION_ID) paymentRequest.location_id = LOCATION_ID;

        const resp = await fetch(`${SQUARE_BASE_URL}/v2/payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Square-Version': '2024-01-18',
          },
          body: JSON.stringify(paymentRequest),
        });

        const data = await resp.json();
        if (!resp.ok) {
          console.error('Square API error:', data);
          const code = data?.errors?.[0]?.code;
          let message = data?.errors?.[0]?.detail || 'Error al procesar el pago con Square';
          if (code === 'VERIFY_CVV_FAILURE') {
            message = 'El código de seguridad (CVV) es incorrecto. Verifica los datos de tu tarjeta.';
          } else if (code === 'INVALID_CARD_DATA') {
            message = 'Los datos de la tarjeta son inválidos. Revisa el número, fecha y CVV.';
          }
          throw new Error(message);
        }

        paymentResult = data.payment;
      }

      if (!paymentResult || paymentResult.status !== 'COMPLETED') {
        throw new Error('Payment not completed');
      }

      const paymentId: string | undefined = paymentResult.id;
      const amountValue = typeof orderData.amount === 'number' ? orderData.amount : 0;
      const normalizedSubtotal =
        typeof orderData?.subtotal === 'number' && !Number.isNaN(orderData.subtotal)
          ? Math.round(orderData.subtotal * 100) / 100
          : Math.round((amountValue - amountValue * 0.03) * 100) / 100;
      const normalizedTax =
        typeof orderData?.tax === 'number' && !Number.isNaN(orderData.tax)
          ? Math.round(orderData.tax * 100) / 100
          : Math.round((amountValue * 0.03) * 100) / 100;

      const customerPhoneValue = orderData?.customerInfo?.phone?.trim() || '';
      const billingAddressValue = orderData?.customerInfo?.billingAddress?.trim() || null;
      const existingOrderId = orderData?.orderId;
      if (existingOrderId && isValidUUID(existingOrderId)) {
        const updateData: Record<string, any> = {
          items: orderData.items || [],
          subtotal: normalizedSubtotal,
          tax: normalizedTax,
          total: Math.round(amountValue * 100) / 100,
          payment_status: 'completed',
          payment_type: orderData.paymentMethod || 'square',
          payment_reference: paymentId,
          payment_id: null,
          updated_at: new Date().toISOString(),
        };

        if (orderData.pickupTime !== undefined) {
          updateData.pickup_time = orderData.pickupTime || null;
        }

        if (orderData.pickupDate !== undefined) {
          updateData.pickup_date = orderData.pickupDate || null;
        }

        if (orderData.specialRequests !== undefined) {
          updateData.special_requests = orderData.specialRequests?.trim() || null;
        }

        if (orderData.customerInfo && orderData.customerInfo.phone !== undefined) {
          updateData.customer_phone = customerPhoneValue || null;
        }

        if (orderData.customerInfo && orderData.customerInfo.billingAddress !== undefined) {
          updateData.billing_address = billingAddressValue;
        }

        let { error: updateError } = await supabaseAdmin
          .from('orders')
          .update(updateData)
          .eq('id', existingOrderId)
          .select('id')
          .single();

        if (updateError && isMissingBillingColumn(updateError)) {
          console.warn("La columna 'billing_address' no existe al actualizar orden Square. Reintentando sin esa columna.");
          const fallbackUpdate = { ...updateData };
          delete fallbackUpdate.billing_address;
          const retryUpdate = await supabaseAdmin
            .from('orders')
            .update(fallbackUpdate)
            .eq('id', existingOrderId)
            .select('id')
            .single();

          updateError = retryUpdate.error;
        }

        if (updateError) {
          console.error('❌ Database update error:', updateError);
          throw new Error(`Payment ok but DB update error: ${updateError.message}`);
        }

        if (orderData?.userId && isValidUUID(orderData.userId) && customerPhoneValue) {
          const { error: phoneUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ phone: customerPhoneValue, updated_at: new Date().toISOString() })
            .eq('id', orderData.userId);

          if (phoneUpdateError) {
            console.warn('⚠️ No se pudo actualizar el teléfono del perfil (Square update):', phoneUpdateError.message);
          }
        }

        console.log('✅ Orden Square actualizada:', existingOrderId);

        return new Response(JSON.stringify({
          success: true,
          paymentId: paymentResult.id,
          orderId: existingOrderId,
          status: 'completed',
          amount: amountValue,
          currency: 'USD',
          environment: ENV,
          paymentMethod: orderData.paymentMethod,
          isSimulated: !ACCESS_TOKEN || !APPLICATION_ID,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // === Guardar orden nueva en DB ===
      const userId = orderData?.userId;
      if (!userId || !isValidUUID(userId)) {
        throw new Error('Invalid or missing userId');
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, phone')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.id) {
        throw new Error('User profile not found');
      }

      const profilePhone = (profile as any)?.phone ? String((profile as any).phone).trim() : '';
      if (customerPhoneValue && customerPhoneValue !== profilePhone) {
        const { error: phoneUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({ phone: customerPhoneValue, updated_at: new Date().toISOString() })
          .eq('id', profile.id);

        if (phoneUpdateError) {
          console.warn('⚠️ No se pudo actualizar el teléfono del perfil (Square):', phoneUpdateError.message);
        }
      }

      const orderRecord: Record<string, any> = {
        user_id: profile.id,
        customer_name: orderData.customerInfo?.name?.trim() || 'Cliente',
        customer_phone: customerPhoneValue,
        customer_email: orderData.customerInfo?.email?.trim() || null,
        billing_address: billingAddressValue,
        items: orderData.items || [],
        subtotal: normalizedSubtotal,
        tax: normalizedTax,
        total: Math.round(amountValue * 100) / 100,
        pickup_time: orderData.pickupTime || null,
        pickup_date: orderData.pickupDate || null,
        special_requests: orderData.specialRequests?.trim() || null,
        status: 'pending',
        order_date: new Date().toISOString().split('T')[0],
        payment_id: null,
        payment_reference: paymentId,
        payment_type: orderData.paymentMethod || 'square',
        payment_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('📋 Insertando orden Square:', {
        payment_reference: paymentId,
        user_id: orderRecord.user_id,
        total: orderRecord.total,
      });

      const storedBillingValue = orderRecord.billing_address ?? null;

      let { data: insertedOrder, error: dbError } = await supabaseAdmin
        .from('orders')
        .insert([orderRecord])
        .select('id')
        .single();

      if (dbError && isMissingBillingColumn(dbError)) {
        console.warn("La columna 'billing_address' no existe al insertar orden Square. Reintentando sin esa columna.");
        const fallbackRecord = { ...orderRecord };
        delete fallbackRecord.billing_address;
        const retryInsert = await supabaseAdmin
          .from('orders')
          .insert([fallbackRecord])
          .select('id')
          .single();

        dbError = retryInsert.error;
        insertedOrder = retryInsert.data
          ? { ...retryInsert.data, billing_address: storedBillingValue }
          : retryInsert.data;
      }

      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw new Error(`Payment ok but DB error: ${dbError.message}`);
      }

      console.log('✅ Orden Square guardada:', insertedOrder);

      return new Response(JSON.stringify({
        success: true,
        paymentId: paymentResult.id,
        orderId: insertedOrder.id,
        status: 'completed',
        amount: amountValue,
        currency: 'USD',
        environment: ENV,
        paymentMethod: orderData.paymentMethod,
        isSimulated: !ACCESS_TOKEN || !APPLICATION_ID,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // === Refund ===
    if (action === 'refund') {
      const paymentId = orderData?.paymentId;
      const amount    = orderData?.amount;

      if (!ACCESS_TOKEN || !APPLICATION_ID) {
        return new Response(JSON.stringify({
          success: true,
          refundId: `REFUND_SIM_${Date.now()}`,
          status: 'completed',
          amount,
          environment: ENV,
          isSimulated: true,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const refundReq: any = {
        idempotency_key: `REF_${Date.now()}_${crypto.randomUUID()}`,
        payment_id: paymentId,
      };
      if (typeof amount === 'number') {
        refundReq.amount_money = { amount: toCents(amount), currency: 'USD' };
      }

      const resp = await fetch(`${SQUARE_BASE_URL}/v2/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18',
        },
        body: JSON.stringify(refundReq),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(`Square Refund Error: ${JSON.stringify(data)}`);

      return new Response(JSON.stringify({
        success: true,
        refundId: data.refund.id,
        status: data.refund.status,
        amount: (data.refund.amount_money?.amount || 0) / 100,
        environment: ENV,
        isSimulated: false,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // === Get status ===
    if (action === 'get_status') {
      const paymentId = orderData?.paymentId;

      if (!ACCESS_TOKEN || !APPLICATION_ID) {
        return new Response(JSON.stringify({
          success: true,
          paymentId,
          status: 'COMPLETED',
          amount: 0,
          currency: 'USD',
          created: new Date().toISOString(),
          environment: ENV,
          isSimulated: true,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const resp = await fetch(`${SQUARE_BASE_URL}/v2/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Square-Version': '2024-01-18',
        },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(`Square Status Error: ${JSON.stringify(data)}`);

      return new Response(JSON.stringify({
        success: true,
        paymentId: data.payment.id,
        status: data.payment.status,
        amount: (data.payment.amount_money?.amount || 0) / 100,
        currency: data.payment.amount_money?.currency || 'USD',
        created: data.payment.created_at,
        environment: ENV,
        isSimulated: false,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Square function error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err?.message || 'Square payment error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
