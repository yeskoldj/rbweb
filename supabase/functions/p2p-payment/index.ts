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

// Helper to verify if a string is a valid UUID
const isValidUUID = (value: string | undefined | null): boolean => {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
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

      // Referencia legible para P2P (se guarda en p2p_reference)
      const p2pRef = `P2P-${Date.now()}`

      // Validate userId before constructing order record
      const userId = orderData?.userId
      if (userId && !isValidUUID(userId)) {
        throw new Error('Invalid userId; must be a UUID')
      }

      // Calcular montos (orderData.amount representa el subtotal)
      const subtotal = Number(orderData.amount.toFixed(2))
      const tax = Number((subtotal * 0.03).toFixed(2))
      const total = Number((subtotal + tax).toFixed(2))

      // Preparar registro con referencia P2P
      const orderRecord: Record<string, any> = {
        user_id: userId || null,
        customer_name: orderData.customerInfo?.name?.trim() || null,
        customer_phone: orderData.customerInfo?.phone?.trim() || null,
        customer_email: orderData.customerInfo?.email?.trim() || null,
        items: orderData.items ?? [],
        subtotal,
        tax,
        total,
        pickup_time: orderData.pickupTime || null,
        special_requests: orderData.specialRequests?.trim() || null,
        p2p_reference: p2pRef,
        status: 'pending',
        order_date: new Date().toISOString().split('T')[0],
        payment_type: orderData.paymentMethod,
        payment_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: insertedOrder, error: dbError } = await supabaseAdmin
        .from('orders')
        .insert([orderRecord])
        .select('id')
        .single()

      if (dbError) {
        console.error('❌ Supabase insert error:', dbError)
        throw new Error(`Error guardando orden: ${dbError.message}`)
      }

      console.log('✅ Orden P2P guardada:', insertedOrder.id)

      return new Response(JSON.stringify({
        success: true,
        orderId: insertedOrder.id,   // UUID real generado por la BD
        reference: p2pRef,           // referencia P2P legible
        status: 'pending_payment',
        amount: total,
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
