import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ENVIRONMENT = Deno.env.get('NODE_ENV') || 'development'
const ALLOWED_ORIGIN =
  Deno.env.get('ALLOWED_ORIGIN') || (ENVIRONMENT === 'development' ? '*' : '')
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  if (ALLOWED_ORIGIN !== '*' && origin && origin !== ALLOWED_ORIGIN) {
    console.warn(`Blocked request from origin: ${origin}`)
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      to, 
      subject, 
      orderData, 
      type = 'order_confirmation',
      language = 'es' 
    } = await req.json()

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured, simulating email send')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email simulation - RESEND_API_KEY not configured',
          data: { to, subject, type }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Email templates
    const templates = {
      es: {
        order_confirmation: {
          subject: `Confirmación de Pedido #${orderData.id} - Ranger's Bakery`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f472b6, #38bdf8); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Ranger's Bakery</h1>
                <p style="color: white; margin: 10px 0 0 0;">¡Gracias por tu pedido!</p>
              </div>
              
              <div style="padding: 30px 20px; background: white;">
                <h2 style="color: #92400e; margin-bottom: 20px;">Confirmación de Pedido</h2>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0; font-weight: bold;">Pedido #${orderData.id}</p>
                  <p style="margin: 5px 0 0 0;">Estado: ${orderData.status}</p>
                  ${orderData.pickup_time ? `<p style="margin: 5px 0 0 0;">Fecha de recogida: ${orderData.pickup_time}</p>` : ''}
                </div>
                
                <h3 style="color: #92400e;">Detalles del Cliente:</h3>
                <p>Nombre: ${orderData.customer_name}</p>
                <p>Teléfono: ${orderData.customer_phone}</p>
                ${orderData.customer_email ? `<p>Email: ${orderData.customer_email}</p>` : ''}
                
                <h3 style="color: #92400e;">Productos:</h3>
                <ul>
                  ${orderData.items.map((item: any) => 
                    `<li>${item.name} x${item.quantity} - $${item.price}</li>`
                  ).join('')}
                </ul>
                
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p style="margin: 0;"><strong>Subtotal: $${orderData.subtotal}</strong></p>
                  <p style="margin: 5px 0 0 0;"><strong>Impuestos: $${orderData.tax}</strong></p>
                  <p style="margin: 5px 0 0 0; font-size: 18px; color: #92400e;"><strong>Total: $${orderData.total}</strong></p>
                </div>
                
                ${orderData.special_requests ? `
                  <h3 style="color: #92400e;">Solicitudes Especiales:</h3>
                  <p style="background: #f9fafb; padding: 10px; border-radius: 4px;">${orderData.special_requests}</p>
                ` : ''}
                
                <div style="text-align: center; margin-top: 30px;">
                  <p>¡Gracias por elegir Ranger's Bakery!</p>
                  <p style="color: #6b7280;">Te notificaremos cuando tu pedido esté listo para recoger.</p>
                </div>
              </div>
              
              <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                <p>Ranger's Bakery - Repostería Dominicana</p>
                <p>Síguenos en Instagram: @rangersbakery</p>
              </div>
            </div>
          `
        }
      },
      en: {
        order_confirmation: {
          subject: `Order Confirmation #${orderData.id} - Ranger's Bakery`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f472b6, #38bdf8); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Ranger's Bakery</h1>
                <p style="color: white; margin: 10px 0 0 0;">Thank you for your order!</p>
              </div>
              
              <div style="padding: 30px 20px; background: white;">
                <h2 style="color: #92400e; margin-bottom: 20px;">Order Confirmation</h2>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0; font-weight: bold;">Order #${orderData.id}</p>
                  <p style="margin: 5px 0 0 0;">Status: ${orderData.status}</p>
                  ${orderData.pickup_time ? `<p style="margin: 5px 0 0 0;">Pickup time: ${orderData.pickup_time}</p>` : ''}
                </div>
                
                <h3 style="color: #92400e;">Customer Details:</h3>
                <p>Name: ${orderData.customer_name}</p>
                <p>Phone: ${orderData.customer_phone}</p>
                ${orderData.customer_email ? `<p>Email: ${orderData.customer_email}</p>` : ''}
                
                <h3 style="color: #92400e;">Items:</h3>
                <ul>
                  ${orderData.items.map((item: any) => 
                    `<li>${item.name} x${item.quantity} - $${item.price}</li>`
                  ).join('')}
                </ul>
                
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p style="margin: 0;"><strong>Subtotal: $${orderData.subtotal}</strong></p>
                  <p style="margin: 5px 0 0 0;"><strong>Tax: $${orderData.tax}</strong></p>
                  <p style="margin: 5px 0 0 0; font-size: 18px; color: #92400e;"><strong>Total: $${orderData.total}</strong></p>
                </div>
                
                ${orderData.special_requests ? `
                  <h3 style="color: #92400e;">Special Requests:</h3>
                  <p style="background: #f9fafb; padding: 10px; border-radius: 4px;">${orderData.special_requests}</p>
                ` : ''}
                
                <div style="text-align: center; margin-top: 30px;">
                  <p>Thank you for choosing Ranger's Bakery!</p>
                  <p style="color: #6b7280;">We'll notify you when your order is ready for pickup.</p>
                </div>
              </div>
              
              <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                <p>Ranger's Bakery - Dominican Pastries</p>
                <p>Follow us on Instagram: @rangersbakery</p>
              </div>
            </div>
          `
        }
      }
    }

    const template = templates[language as keyof typeof templates]?.[type as keyof typeof templates.es]
    
    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ranger\'s Bakery <orders@rangersbakery.com>',
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    })

    const result = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('Resend API error:', result)
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: result
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        id: result.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})