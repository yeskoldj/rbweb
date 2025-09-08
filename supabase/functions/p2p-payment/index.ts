import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { orderData, action = 'create_order' } = await req.json()
    console.log('🚀 Nueva solicitud P2P:', { 
      action, 
      amount: orderData?.amount,
      paymentMethod: orderData?.paymentMethod
    })

    if (action === 'create_order') {
      // Validación de datos requeridos
      if (!orderData?.amount || !orderData?.paymentMethod) {
        throw new Error('Datos de orden incompletos');
      }

      console.log('💰 Creando orden P2P para:', orderData.paymentMethod)
      
      // Generar ID único para el pedido
      const orderId = `P2P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('💾 Guardando orden P2P en DB...')

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
        status: 'pending' as const, // Orden creada, esperando pago
        order_date: new Date().toISOString().split('T')[0],
        payment_method: orderData.paymentMethod,
        payment_status: 'pending', // Pago pendiente de confirmación
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
        throw new Error(`Error guardando orden: ${dbError.message}`);
      }

      console.log('✅ Orden P2P guardada en Supabase:', insertedOrder.id);

      // RESPUESTA EXITOSA PARA P2P
      return new Response(
        JSON.stringify({
          success: true,
          orderId: insertedOrder.id,
          status: 'pending_payment',
          amount: orderData.amount,
          paymentMethod: orderData.paymentMethod,
          message: 'Orden creada exitosamente. Procede con el pago usando las instrucciones proporcionadas.'
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    // Confirmar pago P2P (acción futura para el dashboard)
    if (action === 'confirm_payment') {
      const { orderId } = orderData
      
      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ 
          payment_status: 'completed',
          status: 'pending', // Cambia a pendiente de producción
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error confirmando pago: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          orderId: updatedOrder.id,
          status: 'payment_confirmed',
          message: 'Pago confirmado exitosamente. La orden procederá a producción.'
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
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
    console.error('❌ ERROR en función P2P:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error procesando orden P2P'
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