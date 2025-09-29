import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cliente Supabase con service_role para insertar sin RLS
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const ENVIRONMENT = Deno.env.get('NODE_ENV') || 'development'
const ALLOWED_ORIGIN =
  Deno.env.get('ALLOWED_ORIGIN') || (ENVIRONMENT === 'development' ? '*' : '')
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
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
  const origin = req.headers.get('origin') || ''
  if (ALLOWED_ORIGIN !== '*' && origin && origin !== ALLOWED_ORIGIN) {
    console.warn(`Blocked request from origin: ${origin}`)
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

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

      // Referencia legible para P2P (se guarda en p2p_reference como TEXT)
      const p2pRef = `P2P-${Date.now()}`
      
      // NO generes orderId manualmente, deja que PostgreSQL lo haga
      // const orderId = crypto.randomUUID()  ← COMENTAR ESTA LÍNEA

      // Validate userId antes de usar
      const userId = orderData?.userId
      if (!userId || !isValidUUID(userId)) {
        throw new Error('Invalid or missing userId')
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (profileError || !profile?.id) {
        throw new Error('User profile not found')
      }

      // Calcular montos (orderData.amount representa el subtotal)
      const subtotal = Number(orderData.amount.toFixed(2))
      const tax = 0
      const total = subtotal

      const existingOrderId = orderData?.orderId
      if (existingOrderId && isValidUUID(existingOrderId)) {
        const { data: existingOrder, error: existingError } = await supabaseAdmin
          .from('orders')
          .select('special_requests')
          .eq('id', existingOrderId)
          .single()

        if (existingError) {
          throw new Error('Order not found for update')
        }

        const baseRequests = orderData.specialRequests
          ? orderData.specialRequests.trim()
          : (existingOrder?.special_requests || '').trim()

        const updateData: Record<string, any> = {
          items: orderData.items || [],
          subtotal,
          tax,
          total,
          p2p_reference: p2pRef,
          payment_type: orderData.paymentMethod,
          payment_status: 'pending',
          updated_at: new Date().toISOString(),
          awaiting_quote: false,
        }

        updateData.special_requests = baseRequests
          ? `${baseRequests}\n[Pagado con Zelle | Ref: ${p2pRef}]`
          : `[Pagado con Zelle | Ref: ${p2pRef}]`

        if (orderData.pickupTime !== undefined) {
          updateData.pickup_time = orderData.pickupTime || null
        }

        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update(updateData)
          .eq('id', existingOrderId)
          .select('id, p2p_reference')
          .single()

        if (updateError) {
          console.error('❌ Supabase update error:', updateError)
          throw new Error(`Error actualizando orden: ${updateError.message}`)
        }

        return new Response(JSON.stringify({
          success: true,
          orderId: existingOrderId,
          reference: p2pRef,
          status: 'pending_payment',
          amount: total,
          paymentMethod: orderData.paymentMethod,
          message: 'Orden actualizada. Esperando confirmación del propietario.'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ✅ CORRECCIÓN: NO incluir 'id' en el objeto
      const orderRecord: any = {
        user_id: profile.id,
        customer_name: orderData.customerInfo?.name?.trim() || 'Cliente',
        customer_phone: orderData.customerInfo?.phone?.trim() || '',
        customer_email: orderData.customerInfo?.email?.trim() || null,
        billing_address: orderData.customerInfo?.billingAddress?.trim() || null,
        items: orderData.items || [],
        subtotal,
        tax,
        total,
        pickup_time: orderData.pickupTime || null,
        special_requests: orderData.specialRequests
          ? `${orderData.specialRequests}\n[Pagado con Zelle | Ref: ${p2pRef}]`
          : `[Pagado con Zelle | Ref: ${p2pRef}]`,

        // ✅ Asegurar que p2p_reference sea TEXT, no UUID
        p2p_reference: p2pRef,

        status: 'pending',
        order_date: new Date().toISOString().split('T')[0],
        payment_type: orderData.paymentMethod,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        awaiting_quote: false,
      }

      console.log('📋 Insertando orden P2P:', {
        p2p_reference: p2pRef,
        user_id: orderRecord.user_id,
        total: orderRecord.total
      })

      const { data: insertedOrder, error: dbError } = await supabaseAdmin
        .from('orders')
        .insert([orderRecord])
        .select('id, p2p_reference')
        .single()

      if (dbError) {
        console.error('❌ Supabase insert error:', dbError)
        throw new Error(`Error guardando orden: ${dbError.message}`)
      }

      console.log('✅ Orden P2P guardada:', insertedOrder)

      return new Response(JSON.stringify({
        success: true,
        orderId: insertedOrder.id,           // UUID real generado por PostgreSQL
        reference: insertedOrder.p2p_reference || p2pRef,  // Referencia P2P legible
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
          updated_at: new Date().toISOString(),
          awaiting_quote: false,
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
