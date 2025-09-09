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

      // Referencia legible para P2P (se guarda en p2p_reference como TEXT)
      const p2pRef = `P2P-${Date.now()}`
      
      // NO generes orderId manualmente, deja que PostgreSQL lo haga
      // const orderId = crypto.randomUUID()  ← COMENTAR ESTA LÍNEA

      // Validate userId antes de usar
      const userId = orderData?.userId
      if (userId && !isValidUUID(userId)) {
        console.warn('Invalid userId provided, setting to null:', userId)
        // No lances error, solo usa null
      }

      // Calcular montos (orderData.amount representa el subtotal)
      const subtotal = Number(orderData.amount.toFixed(2))
      const tax = Number((subtotal * 0.03).toFixed(2))
      const total = Number((subtotal + tax).toFixed(2))

      // ✅ CORRECCIÓN: NO incluir 'id' en el objeto
      // Ensure name/email come from the user account when not provided
      let customerName = orderData.customerInfo?.name?.trim() || null;
      let customerEmail = orderData.customerInfo?.email?.trim() || null;

      if ((!customerName || !customerEmail) && userId && isValidUUID(userId)) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('id', userId)
          .single();
        if (profile) {
          if (!customerName) customerName = profile.full_name || null;
          if (!customerEmail) customerEmail = profile.email || null;
        }
      }

      const orderRecord: any = {
        // ❌ id: orderId,  ← ELIMINAR ESTA LÍNEA
        // ✅ Deja que PostgreSQL genere el UUID automáticamente

        user_id: (userId && isValidUUID(userId)) ? userId : null,
        customer_name: customerName,
        customer_phone: orderData.customerInfo?.phone?.trim() || null,
        customer_email: customerEmail,
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
        payment_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
