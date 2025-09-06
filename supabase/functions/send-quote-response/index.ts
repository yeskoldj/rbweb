import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { quoteId, estimatedPrice, adminNotes, customerEmail, customerName, eventType, eventDate } = await req.json()

    if (!quoteId || !estimatedPrice || !customerEmail) {
      throw new Error('Missing required fields')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Update quote status and response
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'responded',
        estimated_price: estimatedPrice,
        admin_notes: adminNotes,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)

    if (updateError) {
      console.error('Error updating quote:', updateError)
      throw updateError
    }

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
                <p class="amount">$${estimatedPrice}</p>
                <p class="label">Precio Estimado</p>
            </div>

            ${adminNotes ? `
            <div class="notes-section">
                <h4>💬 Notas Especiales de Nuestro Chef</h4>
                <p>${adminNotes}</p>
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
                <a href="https://wa.me/18622337204?text=Hola%20Ranger%20Bakery,%20acepto%20la%20cotización%20de%20$${estimatedPrice}%20para%20mi%20evento.%20Quiero%20proceder%20con%20el%20pedido." class="btn btn-accept">
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Quote response sent successfully',
        emailSent: true
      }),
      { 
        headers: { 
          ...corsHeaders, 
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
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})