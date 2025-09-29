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
      orderData = {},
      quoteData = {},
      type = 'order_confirmation',
      language = 'es'
    } = await req.json()

    const order = {
      ...orderData,
      items: Array.isArray(orderData?.items) ? orderData.items : []
    }
    const quote = {
      ...quoteData,
      cart_items: Array.isArray(quoteData?.cart_items) ? quoteData.cart_items : [],
      reference_code: quoteData?.reference_code || quoteData?.referenceCode || '',
      event_details: quoteData?.event_details || quoteData?.eventDetails || ''
    }
    const quoteItems = Array.isArray(quote.cart_items) ? (quote.cart_items as any[]) : []
    const quoteItemsHtml = quoteItems.length
      ? quoteItems.map((item: any) => `
          <li style="margin-bottom: 8px;">
            <strong>${item.quantity || 1}x ${item.name || 'Artículo'}</strong>
            ${item.price_label ? `<div style="color: #6b7280; font-size: 12px;">${item.price_label}</div>` : ''}
            ${item.details ? `<div style="margin-top: 4px; color: #4b5563; white-space: pre-line;">${item.details}</div>` : ''}
          </li>
        `).join('')
      : '<li style="color: #6b7280;">Sin desglose de artículos adjunto.</li>'
    const formattedQuoteSummary = typeof quote.event_details === 'string'
      ? quote.event_details.replace(/\n/g, '<br />')
      : ''

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured, simulating email send')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email simulation - RESEND_API_KEY not configured',
          data: { to, subject, type, order }
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
          subject: `Confirmación de Pedido #${order.id} - Ranger's Bakery`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f472b6, #38bdf8); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Ranger's Bakery</h1>
                <p style="color: white; margin: 10px 0 0 0;">¡Gracias por tu pedido!</p>
              </div>

              <div style="padding: 30px 20px; background: white;">
                <h2 style="color: #92400e; margin-bottom: 20px;">Confirmación de Pedido</h2>

                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0; font-weight: bold;">Pedido #${order.id}</p>
                  <p style="margin: 5px 0 0 0;">Estado: ${order.status}</p>
                  ${order.pickup_time ? `<p style="margin: 5px 0 0 0;">Fecha de recogida: ${order.pickup_time}</p>` : ''}
                </div>

                <h3 style="color: #92400e;">Detalles del Cliente:</h3>
                <p>Nombre: ${order.customer_name}</p>
                <p>Teléfono: ${order.customer_phone}</p>
                ${order.customer_email ? `<p>Email: ${order.customer_email}</p>` : ''}

                <h3 style="color: #92400e;">Productos:</h3>
                <ul>
                  ${(order.items as any[]).map((item: any) =>
                    `<li>${item.name} x${item.quantity} - $${Number(item.price).toFixed(2)}</li>`
                  ).join('')}
                </ul>

                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p style="margin: 0;"><strong>Subtotal: $${Number(order.subtotal || 0).toFixed(2)}</strong></p>
                  <p style="margin: 5px 0 0 0;"><strong>Impuestos: $${Number(order.tax || 0).toFixed(2)}</strong></p>
                  <p style="margin: 5px 0 0 0; font-size: 18px; color: #92400e;"><strong>Total: $${Number(order.total || 0).toFixed(2)}</strong></p>
                </div>

                ${order.special_requests ? `
                  <h3 style="color: #92400e;">Solicitudes Especiales:</h3>
                  <p style="background: #f9fafb; padding: 10px; border-radius: 4px;">${order.special_requests}</p>
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
        },
        business_new_order: {
          subject: `Nueva orden recibida #${order.id || 'Sin ID'} - Ranger's Bakery`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f97316, #ef4444); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">¡Nueva orden recibida!</h1>
                <p style="color: white; margin: 10px 0 0 0;">Generada desde la app web</p>
              </div>

              <div style="padding: 28px 24px; background: #ffffff;">
                <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">Pedido #${order.id || 'Sin ID'}</p>
                  <p style="margin: 6px 0 0 0; color: #b45309;">Estado inicial: ${order.status || 'pendiente'}</p>
                  ${order.payment_method ? `<p style="margin: 6px 0 0 0; color: #b45309;">Método de pago: ${order.payment_method}</p>` : ''}
                  ${order.pickup_time ? `<p style="margin: 6px 0 0 0; color: #b45309;">Recogida: ${order.pickup_time}</p>` : ''}
                </div>

                <h3 style="color: #0f172a; margin-bottom: 12px;">Información del cliente</h3>
                <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Nombre:</strong> ${order.customer_name || 'Cliente'}</p>
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Teléfono:</strong> ${order.customer_phone || 'No provisto'}</p>
                  ${order.customer_email ? `<p style="margin: 0; color: #475569;"><strong>Email:</strong> ${order.customer_email}</p>` : ''}
                </div>

                <h3 style="color: #0f172a; margin: 24px 0 12px 0;">Resumen del pedido</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f1f5f9; color: #1e293b;">
                      <th style="text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0;">Producto</th>
                      <th style="text-align: center; padding: 10px; border-bottom: 1px solid #e2e8f0;">Cant.</th>
                      <th style="text-align: right; padding: 10px; border-bottom: 1px solid #e2e8f0;">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(order.items as any[]).map((item: any) => `
                      <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #334155;">${item.name}</td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f1f5f9; color: #475569;">${item.quantity}</td>
                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #475569;">$${Number(item.price).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; margin-top: 20px;">
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Subtotal:</strong> $${Number(order.subtotal || 0).toFixed(2)}</p>
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Impuestos:</strong> $${Number(order.tax || 0).toFixed(2)}</p>
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;"><strong>Total:</strong> $${Number(order.total || 0).toFixed(2)}</strong></p>
                </div>

                ${order.special_requests ? `
                  <div style="margin-top: 20px; padding: 16px 20px; background: #ecfeff; border-radius: 12px; border: 1px solid #67e8f9;">
                    <h4 style="margin: 0 0 10px 0; color: #0369a1;">Notas / Solicitudes especiales</h4>
                    <p style="margin: 0; color: #0f172a; white-space: pre-wrap;">${order.special_requests}</p>
                  </div>
                ` : ''}

                <div style="margin-top: 28px; text-align: center;">
                  <a href="https://app.rangersbakery.com/dashboard" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold;">Revisar pedido en el panel</a>
                </div>
              </div>

              <div style="background: #f8fafc; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">Ranger's Bakery - Sistema de pedidos online</p>
                <p style="margin: 6px 0 0 0;">Recibiste este mensaje porque está configurado como correo del negocio.</p>
              </div>
            </div>
          `
        },
        new_quote: {
          subject: subject || `Nueva cotización recibida - ${quote.reference_code || quote.customer_name || 'Cliente'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #c084fc, #6366f1); padding: 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Nueva solicitud de cotización</h1>
                <p style="margin: 8px 0 0 0;">Generada desde el personalizador de pasteles</p>
              </div>
              <div style="padding: 28px 24px; background: #ffffff;">
                <div style="background: #f5f3ff; border-radius: 12px; padding: 18px; border: 1px solid #ddd6fe;">
                  <p style="margin: 0; font-size: 18px; color: #4c1d95; font-weight: bold;">Referencia: ${quote.reference_code || 'Sin código'}</p>
                  <p style="margin: 6px 0 0 0; color: #5b21b6;">Cliente: ${quote.customer_name || 'Cliente'}</p>
                  ${quote.customer_phone ? `<p style="margin: 6px 0 0 0; color: #5b21b6;">Teléfono: ${quote.customer_phone}</p>` : ''}
                  ${quote.customer_email ? `<p style="margin: 6px 0 0 0; color: #5b21b6;">Email: ${quote.customer_email}</p>` : ''}
                </div>

                ${quote.pickup_time ? `
                  <div style="margin-top: 20px;">
                    <p style="margin: 0; font-weight: bold; color: #4338ca;">Hora preferida de recogida:</p>
                    <p style="margin: 4px 0 0 0; color: #312e81;">${quote.pickup_time}</p>
                  </div>
                ` : ''}

                <div style="margin-top: 24px;">
                  <h3 style="margin: 0 0 10px 0; color: #4338ca;">Resumen de la solicitud</h3>
                  <div style="background: #eef2ff; border-radius: 10px; padding: 16px; color: #312e81; white-space: pre-line;">
                    ${formattedQuoteSummary || 'Sin detalles adicionales proporcionados.'}
                  </div>
                </div>

                <div style="margin-top: 24px;">
                  <h3 style="margin: 0 0 10px 0; color: #4338ca;">Artículos personalizados</h3>
                  <ul style="list-style: disc; padding-left: 20px; color: #1f2937;">
                    ${quoteItemsHtml}
                  </ul>
                </div>

                ${quote.special_requests ? `
                  <div style="margin-top: 24px; background: #fffbeb; border-radius: 10px; padding: 16px; border: 1px solid #fef3c7;">
                    <h4 style="margin: 0 0 8px 0; color: #92400e;">Solicitudes especiales</h4>
                    <p style="margin: 0; color: #92400e; white-space: pre-line;">${quote.special_requests}</p>
                  </div>
                ` : ''}

                <div style="margin-top: 28px; text-align: center;">
                  <a href="https://app.rangersbakery.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #c084fc, #6366f1); color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold;">Ver en el panel</a>
                </div>
              </div>
              <div style="background: #f3f4f6; padding: 18px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">Ranger's Bakery - Sistema de pedidos online</p>
                <p style="margin: 6px 0 0 0;">Recibiste este mensaje porque está configurado como correo del negocio.</p>
              </div>
            </div>
          `
        },
        customer_quote_confirmation: {
          subject: subject || 'Hemos recibido tu personalización 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ec4899, #f97316); padding: 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 26px;">¡Gracias por tu solicitud!</h1>
                <p style="margin: 8px 0 0 0;">Estamos preparando la cotización personalizada de tu pastel.</p>
              </div>
              <div style="padding: 28px 24px; background: #ffffff;">
                <p style="font-size: 16px; color: #1f2937;">Hola ${quote.customer_name || 'amigo/a de Ranger Bakery'},</p>
                <p style="color: #4b5563; line-height: 1.6;">
                  Nuestro equipo revisará tu diseño y en menos de 24 horas te enviaremos el precio final por correo o teléfono.
                </p>

                <div style="background: #fdf2f8; border-radius: 12px; padding: 18px; border: 1px solid #fbcfe8;">
                  <p style="margin: 0; color: #be185d; font-weight: bold;">Tu código de referencia</p>
                  <p style="margin: 4px 0 0 0; color: #9d174d; font-size: 20px; letter-spacing: 1px; font-weight: bold;">${quote.reference_code || 'Pendiente'}</p>
                  ${quote.pickup_time ? `<p style="margin: 8px 0 0 0; color: #be185d;">Hora preferida de recogida: ${quote.pickup_time}</p>` : ''}
                </div>

                <div style="margin-top: 24px;">
                  <h3 style="margin: 0 0 10px 0; color: #db2777;">Resumen de tu pastel</h3>
                  <ul style="list-style: disc; padding-left: 20px; color: #1f2937;">
                    ${quoteItemsHtml}
                  </ul>
                </div>

                ${formattedQuoteSummary ? `
                  <div style="margin-top: 24px; background: #f3f4f6; border-radius: 10px; padding: 16px; color: #374151;">
                    ${formattedQuoteSummary}
                  </div>
                ` : ''}

                ${quote.special_requests ? `
                  <div style="margin-top: 24px; background: #fff7ed; border-radius: 10px; padding: 16px; border: 1px solid #fed7aa;">
                    <h4 style="margin: 0 0 8px 0; color: #b45309;">Tus notas</h4>
                    <p style="margin: 0; color: #b45309; white-space: pre-line;">${quote.special_requests}</p>
                  </div>
                ` : ''}

                <p style="margin-top: 28px; color: #4b5563; line-height: 1.6;">
                  Te avisaremos por email tan pronto tengamos el precio listo. Si necesitas hacer cambios, responde a este correo o escríbenos por WhatsApp al <strong>(862) 233-7204</strong>.
                </p>
              </div>
              <div style="background: #f3f4f6; padding: 18px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">Ranger's Bakery - Endulzando tus celebraciones</p>
                <p style="margin: 6px 0 0 0;">Síguenos en Instagram @rangersbakery</p>
              </div>
            </div>
          `
        }
      },
      en: {
        order_confirmation: {
          subject: `Order Confirmation #${order.id} - Ranger's Bakery`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f472b6, #38bdf8); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Ranger's Bakery</h1>
                <p style="color: white; margin: 10px 0 0 0;">Thank you for your order!</p>
              </div>

              <div style="padding: 30px 20px; background: white;">
                <h2 style="color: #92400e; margin-bottom: 20px;">Order Confirmation</h2>

                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0; font-weight: bold;">Order #${order.id}</p>
                  <p style="margin: 5px 0 0 0;">Status: ${order.status}</p>
                  ${order.pickup_time ? `<p style="margin: 5px 0 0 0;">Pickup time: ${order.pickup_time}</p>` : ''}
                </div>

                <h3 style="color: #92400e;">Customer Details:</h3>
                <p>Name: ${order.customer_name}</p>
                <p>Phone: ${order.customer_phone}</p>
                ${order.customer_email ? `<p>Email: ${order.customer_email}</p>` : ''}

                <h3 style="color: #92400e;">Items:</h3>
                <ul>
                  ${(order.items as any[]).map((item: any) =>
                    `<li>${item.name} x${item.quantity} - $${Number(item.price).toFixed(2)}</li>`
                  ).join('')}
                </ul>

                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p style="margin: 0;"><strong>Subtotal: $${Number(order.subtotal || 0).toFixed(2)}</strong></p>
                  <p style="margin: 5px 0 0 0;"><strong>Tax: $${Number(order.tax || 0).toFixed(2)}</strong></p>
                  <p style="margin: 5px 0 0 0; font-size: 18px; color: #92400e;"><strong>Total: $${Number(order.total || 0).toFixed(2)}</strong></p>
                </div>

                ${order.special_requests ? `
                  <h3 style="color: #92400e;">Special Requests:</h3>
                  <p style="background: #f9fafb; padding: 10px; border-radius: 4px;">${order.special_requests}</p>
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
        },
        business_new_order: {
          subject: `New order received #${order.id || 'N/A'} - Ranger's Bakery`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">New order received</h1>
                <p style="color: white; margin: 10px 0 0 0;">Submitted from the web app</p>
              </div>

              <div style="padding: 28px 24px; background: #ffffff;">
                <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #312e81;">Order #${order.id || 'N/A'}</p>
                  <p style="margin: 6px 0 0 0; color: #4338ca;">Initial status: ${order.status || 'pending'}</p>
                  ${order.payment_method ? `<p style="margin: 6px 0 0 0; color: #4338ca;">Payment method: ${order.payment_method}</p>` : ''}
                  ${order.pickup_time ? `<p style="margin: 6px 0 0 0; color: #4338ca;">Pickup: ${order.pickup_time}</p>` : ''}
                </div>

                <h3 style="color: #0f172a; margin-bottom: 12px;">Customer information</h3>
                <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Name:</strong> ${order.customer_name || 'Customer'}</p>
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Phone:</strong> ${order.customer_phone || 'Not provided'}</p>
                  ${order.customer_email ? `<p style="margin: 0; color: #475569;"><strong>Email:</strong> ${order.customer_email}</p>` : ''}
                </div>

                <h3 style="color: #0f172a; margin: 24px 0 12px 0;">Order summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f1f5f9; color: #1e293b;">
                      <th style="text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0;">Item</th>
                      <th style="text-align: center; padding: 10px; border-bottom: 1px solid #e2e8f0;">Qty</th>
                      <th style="text-align: right; padding: 10px; border-bottom: 1px solid #e2e8f0;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(order.items as any[]).map((item: any) => `
                      <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #334155;">${item.name}</td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f1f5f9; color: #475569;">${item.quantity}</td>
                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #475569;">$${Number(item.price).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; margin-top: 20px;">
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Subtotal:</strong> $${Number(order.subtotal || 0).toFixed(2)}</p>
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Tax:</strong> $${Number(order.tax || 0).toFixed(2)}</p>
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;"><strong>Total:</strong> $${Number(order.total || 0).toFixed(2)}</p>
                </div>

                ${order.special_requests ? `
                  <div style="margin-top: 20px; padding: 16px 20px; background: #eef2ff; border-radius: 12px; border: 1px solid #c7d2fe;">
                    <h4 style="margin: 0 0 10px 0; color: #3730a3;">Notes / Special requests</h4>
                    <p style="margin: 0; color: #0f172a; white-space: pre-wrap;">${order.special_requests}</p>
                  </div>
                ` : ''}

                <div style="margin-top: 28px; text-align: center;">
                  <a href="https://app.rangersbakery.com/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold;">Open order dashboard</a>
                </div>
              </div>

              <div style="background: #f8fafc; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">Ranger's Bakery - Online order system</p>
                <p style="margin: 6px 0 0 0;">You are receiving this email because you are configured as the business contact.</p>
              </div>
            </div>
          `
        },
        new_quote: {
          subject: subject || `New quote request - ${quote.reference_code || quote.customer_name || 'Customer'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #60a5fa, #2563eb); padding: 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">New custom cake request</h1>
                <p style="margin: 8px 0 0 0;">Submitted from the cake designer</p>
              </div>
              <div style="padding: 28px 24px; background: #ffffff;">
                <div style="background: #dbeafe; border-radius: 12px; padding: 18px; border: 1px solid #bfdbfe;">
                  <p style="margin: 0; font-size: 18px; color: #1d4ed8; font-weight: bold;">Reference: ${quote.reference_code || 'N/A'}</p>
                  <p style="margin: 6px 0 0 0; color: #1e40af;">Customer: ${quote.customer_name || 'Customer'}</p>
                  ${quote.customer_phone ? `<p style="margin: 6px 0 0 0; color: #1e40af;">Phone: ${quote.customer_phone}</p>` : ''}
                  ${quote.customer_email ? `<p style="margin: 6px 0 0 0; color: #1e40af;">Email: ${quote.customer_email}</p>` : ''}
                </div>

                ${quote.pickup_time ? `
                  <div style="margin-top: 20px;">
                    <p style="margin: 0; font-weight: bold; color: #1d4ed8;">Preferred pickup time:</p>
                    <p style="margin: 4px 0 0 0; color: #1e3a8a;">${quote.pickup_time}</p>
                  </div>
                ` : ''}

                <div style="margin-top: 24px;">
                  <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">Request summary</h3>
                  <div style="background: #eff6ff; border-radius: 10px; padding: 16px; color: #1e3a8a; white-space: pre-line;">
                    ${formattedQuoteSummary || 'No additional event details provided.'}
                  </div>
                </div>

                <div style="margin-top: 24px;">
                  <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">Requested items</h3>
                  <ul style="list-style: disc; padding-left: 20px; color: #111827;">
                    ${quoteItemsHtml}
                  </ul>
                </div>

                ${quote.special_requests ? `
                  <div style="margin-top: 24px; background: #fef9c3; border-radius: 10px; padding: 16px; border: 1px solid #fde047;">
                    <h4 style="margin: 0 0 8px 0; color: #92400e;">Special notes</h4>
                    <p style="margin: 0; color: #92400e; white-space: pre-line;">${quote.special_requests}</p>
                  </div>
                ` : ''}

                <div style="margin-top: 28px; text-align: center;">
                  <a href="https://app.rangersbakery.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #60a5fa, #2563eb); color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold;">Open dashboard</a>
                </div>
              </div>
              <div style="background: #f3f4f6; padding: 18px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">Ranger's Bakery - Online ordering system</p>
              </div>
            </div>
          `
        },
        customer_quote_confirmation: {
          subject: subject || 'We received your cake request! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ec4899, #6366f1); padding: 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 26px;">Thank you!</h1>
                <p style="margin: 8px 0 0 0;">We are reviewing your custom cake design.</p>
              </div>
              <div style="padding: 28px 24px; background: #ffffff;">
                <p style="font-size: 16px; color: #111827;">Hi ${quote.customer_name || 'Ranger Bakery friend'},</p>
                <p style="color: #4b5563; line-height: 1.6;">
                  Our team will review your request and send the final quote within the next 24 hours.
                </p>

                <div style="background: #ede9fe; border-radius: 12px; padding: 18px; border: 1px solid #ddd6fe;">
                  <p style="margin: 0; color: #4338ca; font-weight: bold;">Your reference code</p>
                  <p style="margin: 4px 0 0 0; color: #312e81; font-size: 20px; letter-spacing: 1px; font-weight: bold;">${quote.reference_code || 'Pending'}</p>
                  ${quote.pickup_time ? `<p style="margin: 8px 0 0 0; color: #4338ca;">Preferred pickup time: ${quote.pickup_time}</p>` : ''}
                </div>

                <div style="margin-top: 24px;">
                  <h3 style="margin: 0 0 10px 0; color: #6366f1;">Your cake summary</h3>
                  <ul style="list-style: disc; padding-left: 20px; color: #111827;">
                    ${quoteItemsHtml}
                  </ul>
                </div>

                ${formattedQuoteSummary ? `
                  <div style="margin-top: 24px; background: #f3f4f6; border-radius: 10px; padding: 16px; color: #374151;">
                    ${formattedQuoteSummary}
                  </div>
                ` : ''}

                ${quote.special_requests ? `
                  <div style="margin-top: 24px; background: #fff7ed; border-radius: 10px; padding: 16px; border: 1px solid #fde68a;">
                    <h4 style="margin: 0 0 8px 0; color: #b45309;">Your notes</h4>
                    <p style="margin: 0; color: #b45309; white-space: pre-line;">${quote.special_requests}</p>
                  </div>
                ` : ''}

                <p style="margin-top: 28px; color: #4b5563; line-height: 1.6;">
                  We will email you the final quote soon. Need adjustments? Reply to this email or text us on WhatsApp at <strong>(862) 233-7204</strong>.
                </p>
              </div>
              <div style="background: #f3f4f6; padding: 18px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">Ranger's Bakery - Bringing sweetness to your events</p>
              </div>
            </div>
          `
        }
      }
    }

    const languageTemplates = templates[language as keyof typeof templates] || templates.es
    const template = (languageTemplates as Record<string, { subject: string; html: string }>)[type]

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
