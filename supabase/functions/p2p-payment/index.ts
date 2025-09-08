import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cliente Supabase con service_role para insertar sin RLS
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { orderData, action = 'create_order' } = await req.json()
    console.log('🚀 P2P request:', { action, amount: orderData?.amount, method: orderData?.paymentMethod })

    if (action === 'create_order') {
      // Validación mínima
      if (!orderData?.amount || !orderData?.paymentMethod) {
        throw new Error('Datos de orden incompletos')
      }

      // Referencia legible para P2P (NO se usa como id de la tabla)
      const p2pRef = `P2P-${Date.now()}-${crypto.randomUUID()}`

      // Preparar registro SIN 'id' (lo genera Postgres por ser UUID)
      const orderRecord: any = {
        user_id: orderData.userId || null,
        customer_name: orderData.customerInfo?.name?.trim() ?? null,
        customer_phone: orderData.customerInfo?.phone?.trim() ?? null,
        customer_email: orderData.customerInfo?.email?.trim() ?? null,
        items: orderData.items ?? [],
        subtotal: Number((orderData.amount - orderData.amount * 0.03).toFixed(2)),
        tax: Number((orderData.amount * 0.03).toFixed(2)),
        total: Number(orderData.amount.toFixed(2)),
        pickup_time: orderData.pickupTime || null,
        special_requests: orderData.specialRequests
          ? `${orderData.specialRequests}\n[Payment: ${orderData.paymentMethod} | Ref: ${p2pRef}]`
          : `[Payment: ${orderData.paymentMethod} | Ref: ${p2pRef}]`,
        status: 'pending',                  // esperando confirmación de pago
        order_date: new Date().toISOString(),
        payment_method: orderData.paymentMethod,
        // Marcar como pagado vía Zelle sin requerir comprobación adicional
        payment_status: 'paid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: inserted, error: dbError } = await supabaseAdmin
        .from('orders')
        .insert([orderRecord])
        .select('id')
        .single()

      if (dbError) {
        console.error('❌ Supabase insert error:', dbError)
        throw new Error(`Error guardando orden: ${dbError.message}`)
      }

      console.log('✅ Orden P2P guardada:', inserted.id)

      return new Response(JSON.stringify({
        success: true,
        orderId: inserted.id,        // UUID real
        reference: p2pRef,           // tu referencia P2P legible
        status: 'pending_payment',
        amount: orderData.amount,
        paymentMethod: orderData.paymentMethod,
        message: 'Orden creada. Sigue las instrucciones para pagar por P2P.'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'confirm_payment') {
      const { orderId } = orderData

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'completed',
          status: 'pending', // pasa a producción
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('id')
        .single()

      if (updateError) throw new Error(`Error confirmando pago: ${updateError.message}`)

      return new Response(JSON.stringify({
        success: true,
        orderId: updated.id,
        status: 'payment_confirmed',
        message: 'Pago confirmado. La orden procederá a producción.'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Acción inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('❌ P2P function error:', { message: err.message, stack: err.stack })
    return new Response(JSON.stringify({ success: false, error: err.message || 'Error procesando orden P2P' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
