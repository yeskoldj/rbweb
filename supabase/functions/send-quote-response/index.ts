import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  getWhatsAppBusinessRecipients,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from '../_shared/whatsapp.ts'
import { requireUser, isStaffRole } from '../_shared/auth.ts'
import {
  getAllowedOrigins,
  getCorsConfigError,
  getCorsHeaders,
  isOriginAllowed,
} from '../_shared/cors.ts'

const corsConfigurationError = getCorsConfigError()

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
)

const isValidUUID = (value: string | undefined | null): boolean => {
  if (!value) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const responseCorsHeaders = getCorsHeaders(origin)

  if (corsConfigurationError) {
    return new Response(
      JSON.stringify({ error: corsConfigurationError }),
      {
        status: 500,
        headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  if (!isOriginAllowed(origin)) {
    console.warn(`Blocked request from origin: ${origin || 'unknown'}. Allowed origins: ${getAllowedOrigins().join(', ')}`)
    return new Response(
      JSON.stringify({ error: 'Forbidden origin' }),
      {
        status: 403,
        headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: responseCorsHeaders })
  }

  try {
    const {
      quoteId,
      estimatedPrice,
      adminNotes,
    } = await req.json()

    if (!quoteId || !isValidUUID(quoteId)) {
      return new Response(JSON.stringify({ error: 'Invalid quote id' }), {
        status: 400,
        headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const auth = await requireUser(req, supabaseAdmin, responseCorsHeaders)
    if (auth instanceof Response) {
      return auth
    }

    if (!isStaffRole(auth.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const priceNumber = Number(estimatedPrice)
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid estimated price' }), {
        status: 400,
        headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update quote status and response
    const { error: updateError } = await supabaseAdmin
      .from('quotes')
      .update({
        status: 'responded',
        estimated_price: priceNumber,
        admin_notes: adminNotes,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)

    if (updateError) {
      console.error('Error updating quote:', updateError)
      throw updateError
    }

    const { data: quoteRecord, error: fetchError } = await supabaseAdmin
      .from('quotes')
      .select('id, customer_email, customer_name, customer_phone, event_date, occasion, theme, admin_notes, reference_code, cart_items, event_details, pickup_time, special_requests')
      .eq('id', quoteId)
      .single()

    if (fetchError || !quoteRecord) {
      return new Response(JSON.stringify({ error: 'Quote not found after update' }), {
        status: 404,
        headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const customerEmail = quoteRecord.customer_email
    if (!customerEmail) {
      console.warn(`Quote ${quoteId} responded without customer email; skipping notification`)
      return new Response(JSON.stringify({
        success: true,
        message: 'Quote updated without customer email'
      }), { headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' } })
    }

    const customerName = quoteRecord.customer_name || 'Cliente'
    const customerPhone = quoteRecord.customer_phone || ''
    const eventType = quoteRecord.occasion || quoteRecord.theme || null
    const eventDate = quoteRecord.event_date || null
    const adminNotesText =
      typeof adminNotes === 'string' && adminNotes.trim().length > 0
        ? adminNotes.trim()
        : (typeof quoteRecord.admin_notes === 'string' ? quoteRecord.admin_notes : '')

    // Prepare email content
    const emailSubject = `Cotización Lista - Ranger Bakery 🎂`
    
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
        .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 30px 20px; }
        .quote-card { background: #f8f9fa; border-left: 4px solid #f5576c; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .price-highlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0; }
        .price-highlight .amount { font-size: 32px; font-weight: bold; margin: 0; }
        .price-highlight .label { font-size: 14px; opacity: 0.9; margin: 5px 0 0 0; }
        .details-grid { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #495057; }
        .detail-value { color: #6c757d; }
        .notes-section { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .notes-section h4 { color: #856404; margin: 0 0 10px 0; font-size: 16px; }
        .notes-section p { color: #856404; margin: 0; line-height: 1.5; }
        .action-buttons { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 15px 30px; margin: 0 10px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
        .btn-accept { background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); color: white; }
        .btn-contact { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .contact-info { background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .contact-info h4 { color: #1565c0; margin: 0 0 15px 0; }
        .contact-methods { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
        .contact-method { display: flex; align-items: center; color: #1565c0; font-weight: 500; }
        .contact-method span { margin-left: 8px; }
        .footer { background: #495057; color: white; padding: 20px; text-align: center; }
        .footer p { margin: 5px 0; font-size: 14px; }
        .watermark { text-align: center; padding: 15px; background: #f8f9fa; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎂 Ranger Bakery</h1>
            <p>Su cotización está lista</p>
        </div>
        
        <div class="content">
            <h2 style="color: #f5576c; margin-bottom: 10px;">¡Hola ${customerName}!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #495057;">
                Gracias por confiar en Ranger Bakery para su evento especial. Hemos preparado su cotización personalizada con mucho cuidado.
            </p>

            ${eventType || eventDate ? `
            <div class="quote-card">
                <h4 style="color: #f5576c; margin: 0 0 15px 0;">📋 Detalles del Evento</h4>
                <div class="details-grid" style="background: white; padding: 15px;">
                    ${eventType ? `
                    <div class="detail-row">
                        <span class="detail-label">Tipo de Evento:</span>
                        <span class="detail-value">${eventType}</span>
                    </div>
                    ` : ''}
                    ${eventDate ? `
                    <div class="detail-row">
                        <span class="detail-label">Fecha del Evento:</span>
                        <span class="detail-value">${eventDate}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            <div class="price-highlight">
                <p class="amount">$${priceNumber.toFixed(2)}</p>
                <p class="label">Precio Estimado</p>
            </div>

            ${adminNotesText ? `
            <div class="notes-section">
                <h4>💬 Notas Especiales de Nuestro Chef</h4>
                <p>${adminNotesText}</p>
            </div>
            ` : ''}

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #2e7d32; margin: 0 0 10px 0;">✨ Lo que incluye su cotización:</h4>
                <ul style="color: #2e7d32; margin: 0; padding-left: 20px;">
                    <li>Diseño personalizado según sus especificaciones</li>
                    <li>Ingredientes frescos y de la más alta calidad</li>
                    <li>Decoración artesanal profesional</li>
                    <li>Consultoría gratuita para ajustes</li>
                </ul>
            </div>

            <div class="action-buttons">
                <a href="tel:8622337204" class="btn btn-contact">
                    📞 Llamar Ahora
                </a>
                <a href="https://wa.me/18622337204?text=Hola%20Ranger%20Bakery,%20acepto%20la%20cotización%20de%20$${priceNumber.toFixed(2)}%20para%20mi%20evento.%20Quiero%20proceder%20con%20el%20pedido." class="btn btn-accept">
                    ✅ Aceptar Cotización
                </a>
            </div>

            <div class="contact-info">
                <h4>📞 Contáctanos para Confirmar</h4>
                <div class="contact-methods">
                    <div class="contact-method">
                        <strong>📱</strong>
                        <span>(862) 233-7204</span>
                    </div>
                    <div class="contact-method">
                        <strong>📧</strong>
                        <span>rangerbakery@gmail.com</span>
                    </div>
                    <div class="contact-method">
                        <strong>💬</strong>
                        <span>WhatsApp Disponible</span>
                    </div>
                </div>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px; text-align: center;">
                    <strong>⏰ Importante:</strong> Esta cotización es válida por 7 días. Para confirmar su pedido, contáctenos lo antes posible.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>🎂 Ranger Bakery</strong></p>
            <p>Endulzando sus momentos especiales desde el corazón</p>
            <p>📧 rangerbakery@gmail.com | 📱 (862) 233-7204</p>
        </div>
        
        <div class="watermark">
            <p>Email enviado automáticamente desde el sistema de gestión de Ranger Bakery</p>
        </div>
    </div>
</body>
</html>`

    // Send email using FormSubmit
    const formData = new FormData()
    formData.append('_to', customerEmail)
    formData.append('_cc', 'rangerbakery@gmail.com')
    formData.append('_subject', emailSubject)
    formData.append('_template', 'table')
    formData.append('_captcha', 'false')
      formData.append('message', emailBody)

    const emailResponse = await fetch('https://formsubmit.co/ajax/rangerbakery@gmail.com', {
      method: 'POST',
      body: formData
    })

    if (!emailResponse.ok) {
      throw new Error('Failed to send email')
    }

    const whatsappResults: Record<string, unknown> = {}
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(priceNumber)

    const whatsappTemplateName = Deno.env.get('WHATSAPP_TEMPLATE_QUOTE_APPROVED')
    const whatsappLanguage = Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') || 'es'

    if (customerPhone) {
      const customerMessage = `Hola ${customerName || 'cliente Ranger Bakery'}, tu cotización ya está lista. El precio estimado es ${formattedPrice}. ${adminNotesText ? `Notas especiales: ${adminNotesText}. ` : ''}Responde a este mensaje o llámanos al (862) 233-7204 para confirmar.`

      whatsappResults.customer = whatsappTemplateName
        ? await sendWhatsAppTemplateMessage({
            to: customerPhone,
            templateName: whatsappTemplateName,
            languageCode: whatsappLanguage,
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: customerName || 'cliente Ranger Bakery' },
                  { type: 'text', text: formattedPrice },
                  { type: 'text', text: adminNotesText || 'Sin notas adicionales' },
                ],
              },
            ],
          })
        : await sendWhatsAppTextMessage({
            to: customerPhone,
            body: customerMessage,
          })
    }

    const businessRecipients = getWhatsAppBusinessRecipients()
    if (businessRecipients.length > 0) {
      const businessMessage = `Cotización respondida para ${customerName || 'cliente'} por ${formattedPrice}. ${adminNotesText ? `Notas: ${adminNotesText}. ` : ''}${eventType ? `Evento: ${eventType}. ` : ''}${eventDate ? `Fecha: ${eventDate}. ` : ''}ID: ${quoteId}.`
      const businessTemplate = Deno.env.get('WHATSAPP_TEMPLATE_BUSINESS_QUOTE_ALERT')

      whatsappResults.business = await Promise.all(
        businessRecipients.map((recipient) =>
          businessTemplate
            ? sendWhatsAppTemplateMessage({
                to: recipient,
                templateName: businessTemplate,
                languageCode: whatsappLanguage,
                components: [
                  {
                    type: 'body',
                    parameters: [
                      { type: 'text', text: customerName || 'cliente' },
                      { type: 'text', text: formattedPrice },
                      { type: 'text', text: quoteId },
                    ],
                  },
                ],
              })
            : sendWhatsAppTextMessage({
                to: recipient,
                body: businessMessage,
              })
        )
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quote response sent successfully',
        emailSent: true,
        whatsapp: whatsappResults,
      }),
      {
        headers: {
          ...responseCorsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...responseCorsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})