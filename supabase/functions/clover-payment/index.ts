// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ✅ CONFIGURACIÓN LISTA PARA PRODUCCIÓN
const ENV = Deno.env.get("CLOVER_ENV") || "prod";
const TOKEN_BASE = ENV === "prod" ? "https://token.clover.com" : "https://token-sandbox.dev.clover.com";
const CHARGE_BASE = ENV === "prod" ? "https://scl.clover.com" : "https://scl-sandbox.dev.clover.com";

const PUB = (Deno.env.get("CLOVER_PUBLIC_KEY")||"").trim();
const PRIVATE = (Deno.env.get("CLOVER_PRIVATE_KEY")||"").trim();

console.log('🚀 Clover ENV:', ENV, 'tokenHost:', TOKEN_BASE, 'chargeHost:', CHARGE_BASE);

const formatAmountForClover = (amount: number): number => {
  return Math.round(amount * 100);
};

// Cliente Supabase con service_role para insertar sin RLS
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    const { orderData, action = 'create_payment' } = await req.json()
    console.log('🚀 Nueva solicitud Clover:', { 
      action, 
      amount: orderData?.amount,
      env: ENV,
      tokenBase: TOKEN_BASE,
      chargeBase: CHARGE_BASE
    })

    if (action === 'create_payment') {
      // Validación de datos requeridos
      if (!orderData?.cardInfo?.number || !orderData?.amount) {
        throw new Error('Datos de pago incompletos');
      }

      console.log('💳 Tokenización con configuración de producción')
      
      // Tokenización con endpoints de producción
      const cardNumber = orderData.cardInfo.number.replace(/\s+/g, '');
      const expiryParts = orderData.cardInfo.expiry.split('/');
      
      const [mm, yyRaw] = expiryParts;
      const exp_year = (yyRaw || "").split("").length === 2 ? `20${yyRaw.trim()}` : (yyRaw || "").split("");

      console.log('🔐 Datos de tokenización:', {
        cardMasked: `****-****-****-${cardNumber.slice(-4)}`,
        exp_month: mm,
        exp_year: exp_year,
        tokenUrl: `${TOKEN_BASE}/v1/tokens`
      });

      const tokenRes = await fetch(`${TOKEN_BASE}/v1/tokens`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${PUB}`, "Content-Type": "application/json" },
        body: JSON.stringify({ card: { number: orderData.cardInfo.number, exp_month: mm, exp_year, cvv: orderData.cardInfo.cvv }})
      });

      if (tokenRes.status === 401) throw new Error(`Tokenización falló: llave pública inválida para ${TOKEN_BASE}`);
      if (tokenRes.status === 200) throw new Error(`Tokenización falló: ${await tokenRes.text()}`);

      const tokenJson = await tokenRes.json();
      
      if (tokenRes.status !== 201) throw new Error(`Tokenización falló: ${JSON.stringify(tokenJson)}`);
      if (!tokenJson?.id) throw new Error(`Token no recibido: ${JSON.stringify(tokenJson)}`);

      const cardToken = tokenJson.id;
      console.log('✅ Token creado exitosamente');

      console.log('💰 Procesando cargo con configuración de producción')

      // Generar ID único para el pedido
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Cargo con endpoints de producción
      const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "127.0.0.1";

      const chargeRes = await fetch(`${CHARGE_BASE}/v1/charges`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${PRIVATE}`, 
          "Content-Type": "application/json", 
          "Accept":"application/json", 
          "x-forwarded-for": ip 
        },
        body: JSON.stringify({ 
          amount: Math.round(orderData.amount*100), 
          currency:"usd", 
          ecomind:"ecom", 
          source: tokenJson.id 
        })
      });

      const chargeResult = await chargeRes.json();
      
      console.log('💳 Respuesta de Clover (PRODUCCIÓN):', {
        httpStatus: chargeRes.status,
        success: chargeRes.ok,
        paymentStatus: chargeResult.status,
        paid: chargeResult.paid,
        chargeId: chargeResult.id
      });

      // VALIDACIÓN ESTRICTA - Solo "succeeded"
      if (!chargeRes.ok || chargeResult.status !== 'succeeded') {
        const errorMsg = chargeResult.message || chargeResult.error?.message || 'Pago rechazado por Clover';
        console.error('❌ Clover rechazó el pago:', {
          httpStatus: chargeRes.status,
          error: errorMsg,
          fullResponse: chargeResult
        });
        throw new Error(errorMsg);
      }

      console.log('✅ PAGO EXITOSO EN PRODUCCIÓN! Status: succeeded, ID:', chargeResult.id);
      console.log('💾 Guardando orden en DB...')

      // Guardar orden en base de datos
      const orderRecord = {
        id: orderId,
        user_id: orderData.userId || null,
        customer_name: orderData.customerInfo.name.trim(),
        customer_phone: orderData.customerInfo.phone.trim(),
        customer_email: orderData.customerInfo.email?.trim() || null,
        items: orderData.items,
        subtotal: parseFloat((orderData.amount - (orderData.amount * 0.03)).toFixed(2)),
        tax: parseFloat((orderData.amount * 0.03).toFixed(2)),
        total: parseFloat(orderData.amount.toFixed(2)),
        pickup_time: orderData.pickupTime || null,
        special_requests: orderData.specialRequests?.trim() || null,
        status: 'pending' as const,
        order_date: new Date().toISOString().split('T')[0],
        payment_id: chargeResult.id,
        payment_method: 'clover',
        payment_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insertar con service_role (server-side)
      const { data: insertedOrder, error: dbError } = await supabaseAdmin
        .from('orders')
        .insert([orderRecord])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Error guardando en Supabase:', dbError);
        throw new Error(`Pago exitoso pero error guardando: ${dbError.message}`);
      }

      console.log('✅ Orden guardada en Supabase:', insertedOrder.id);

      // RESPUESTA EXITOSA PARA PRODUCCIÓN
      return new Response(
        JSON.stringify({
          success: true,
          paymentId: chargeResult.id,
          orderId: insertedOrder.id,
          status: 'completed',
          amount: orderData.amount,
          currency: 'USD',
          environment: 'production'
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    // Refund action para producción
    if (action === 'refund') {
      const { paymentId, amount } = orderData
      
      const refundData = {
        charge: paymentId,
        amount: amount ? formatAmountForClover(amount) : undefined
      };

      const response = await fetch(`${CHARGE_BASE}/v1/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PRIVATE}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(refundData)
      });

      const result = await response.json();

      if (response.ok && result.status === 'succeeded') {
        return new Response(
          JSON.stringify({
            success: true,
            refundId: result.id,
            status: 'completed',
            amount: result.amount / 100,
            originalPaymentId: paymentId,
            environment: 'production'
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            } 
          }
        )
      } else {
        throw new Error(result.message || 'Refund failed')
      }
    }

    // Get status action para producción
    if (action === 'get_status') {
      const { paymentId } = orderData
      
      const response = await fetch(`${CHARGE_BASE}/v1/charges/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PRIVATE}`,
          'Accept': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            paymentId: result.id,
            status: result.status,
            amount: result.amount / 100,
            currency: result.currency.toUpperCase(),
            created: result.created,
            environment: 'production'
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            } 
          }
        )
      } else {
        throw new Error('Pago no encontrado')
      }
    }

    return new Response(
      JSON.stringify({ error: 'Acción inválida' }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )

  } catch (error: any) {
    console.error('❌ ERROR en función Clover (PRODUCCIÓN):', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error procesando pago con Clover'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  }
})