import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  getWhatsAppBusinessRecipients,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from '../_shared/whatsapp.ts'
import type {
  WhatsAppTemplateComponent,
  WhatsAppTemplateComponentParameter,
} from '../_shared/whatsapp.ts'
import { requireUser, isStaffRole } from '../_shared/auth.ts'
import {
  getAllowedOrigins,
  getCorsConfigError,
  getCorsHeaders,
  isOriginAllowed,
} from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const corsConfigurationError = getCorsConfigError()
const DEFAULT_APP_BASE_URL = 'https://app.rangersbakery.com'
const RAW_APP_BASE_URL = Deno.env.get('PUBLIC_APP_BASE_URL') || DEFAULT_APP_BASE_URL
const NORMALIZED_APP_BASE_URL = RAW_APP_BASE_URL.replace(/\/$/, '') || DEFAULT_APP_BASE_URL
const WHATSAPP_LANGUAGE = (Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') || 'es').toLowerCase()
const WHATSAPP_TEMPLATE_CUSTOMER_ORDER_CONFIRMATION = Deno.env.get('WHATSAPP_TEMPLATE_CUSTOMER_ORDER_CONFIRMATION') || ''
const WHATSAPP_TEMPLATE_CUSTOMER_QUOTE_CONFIRMATION = Deno.env.get('WHATSAPP_TEMPLATE_CUSTOMER_QUOTE_CONFIRMATION') || ''
const WHATSAPP_TEMPLATE_CUSTOMER_PAYMENT_READY = Deno.env.get('WHATSAPP_TEMPLATE_CUSTOMER_ORDER_PAYMENT_READY') || ''
const WHATSAPP_TEMPLATE_CUSTOMER_READY_FOR_PICKUP = Deno.env.get('WHATSAPP_TEMPLATE_CUSTOMER_ORDER_READY_FOR_PICKUP') || ''
const WHATSAPP_TEMPLATE_BUSINESS_ORDER_ALERT = Deno.env.get('WHATSAPP_TEMPLATE_BUSINESS_ORDER_ALERT') || ''
const WHATSAPP_TEMPLATE_BUSINESS_QUOTE_ALERT = Deno.env.get('WHATSAPP_TEMPLATE_BUSINESS_QUOTE_ALERT') || ''
const ensureAppUrl = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.startsWith(NORMALIZED_APP_BASE_URL) ? trimmed : null
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
)

const BUSINESS_NOTIFICATION_ALLOWLIST = new Set(
  (Deno.env.get('BUSINESS_NOTIFICATION_ALLOWLIST') || 'rangerbakery@gmail.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

function formatCurrencyValue(value: number | string | null | undefined) {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : typeof value === 'bigint'
          ? Number(value)
          : Number(value ?? 0)

  const safeNumber = Number.isFinite(numericValue) ? numericValue : 0

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(safeNumber)
}

function normalizeLanguageCode(language?: string) {
  if (!language) return WHATSAPP_LANGUAGE
  const normalized = language.toLowerCase()
  if (normalized.startsWith('en')) return 'en'
  if (normalized.startsWith('es')) return 'es'
  return WHATSAPP_LANGUAGE
}

function isValidUUID(value: string | undefined | null): boolean {
  if (!value) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

const HTML_ESCAPE_REGEX = /[&<>'"`]/g
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
  '`': '&#96;',
}

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  return stringValue.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char)
}

function sanitizePlainText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') {
    return escapeHtml(value)
  }
  return escapeHtml(String(value))
}

function sanitizeMultiline(value: unknown): string {
  const sanitized = sanitizePlainText(value)
  return sanitized
}

function sanitizeLink(value: unknown): string {
  if (typeof value !== 'string') return ''
  const ensuredUrl = ensureAppUrl(value)
  return ensuredUrl ? escapeHtml(ensuredUrl) : ''
}

function buildCustomerWhatsAppMessage(
  type: string,
  language: string,
  order: any,
  quote: any,
): string | null {
  const lang = normalizeLanguageCode(language)
  const fallbackName = lang === 'en' ? 'Ranger Bakery friend' : 'cliente Ranger Bakery'
  const name = order?.customer_name || quote?.customer_name || fallbackName
  const orderId = order?.id ? `#${order.id}` : ''
  const total = formatCurrencyValue(order?.total ?? order?.subtotal ?? 0)

  switch (type) {
    case 'order_confirmation':
      return lang === 'en'
        ? `Hi ${name}, we received your order ${orderId}. We'll keep you posted. Total: ${total}.`
        : `Hola ${name}, recibimos tu orden ${orderId}. Te mantendremos al tanto. Total: ${total}.`
    case 'customer_quote_confirmation': {
      const reference = quote?.reference_code ? ` (${quote.reference_code})` : ''
      return lang === 'en'
        ? `Hi ${name}, we received your quote request${reference}. We'll review the details and reply soon.`
        : `Hola ${name}, recibimos tu solicitud de cotización${reference}. Revisaremos los detalles y te responderemos pronto.`
    }
    case 'customer_order_payment_ready': {
      const paymentUrl = order?.payment_url || order?.tracking_url || ''
      const paymentSentence = paymentUrl ? (lang === 'en' ? ` Pay here: ${paymentUrl}` : ` Paga aquí: ${paymentUrl}`) : ''
      return lang === 'en'
        ? `Hi ${name}, your order ${orderId} is ready for payment. Total: ${total}.${paymentSentence}`
        : `Hola ${name}, tu orden ${orderId} ya está lista para pagar. Total: ${total}.${paymentSentence}`
    }
    case 'customer_order_ready_for_pickup': {
      const pickupTime = order?.pickup_time
      return lang === 'en'
        ? `Hi ${name}, your order ${orderId} is ready for pickup${pickupTime ? ` at ${pickupTime}` : ''}. See you soon!`
        : `Hola ${name}, tu orden ${orderId} está lista para recoger${pickupTime ? ` a las ${pickupTime}` : ''}. ¡Te esperamos!`
    }
    default:
      return null
  }
}

function buildBusinessWhatsAppMessage(type: string, order: any, quote: any): string | null {
  const name = order?.customer_name || quote?.customer_name || 'Cliente'
  const phone = order?.customer_phone || quote?.customer_phone || 'sin teléfono'
  const orderId = order?.id ? `#${order.id}` : ''
  const total = formatCurrencyValue(order?.total ?? order?.subtotal ?? 0)

  switch (type) {
    case 'business_new_order':
      return `Nueva orden ${orderId} de ${name}. Total ${total}. Tel: ${phone}. Estado: ${order?.status || 'pendiente'}.`
    case 'order_confirmation':
      return `Pedido confirmado ${orderId} de ${name}. Total ${total}. Tel: ${phone}.`
    case 'customer_order_payment_ready':
      return `Orden ${orderId} de ${name} lista para pagar. Total ${total}. Tel: ${phone}.`
    case 'customer_order_ready_for_pickup':
      return `Orden ${orderId} de ${name} lista para recoger${order?.pickup_time ? ` a las ${order.pickup_time}` : ''}. Tel: ${phone}.`
    case 'customer_quote_confirmation':
    case 'new_quote': {
      const reference = quote?.reference_code ? ` (${quote.reference_code})` : ''
      return `Nueva cotización${reference} de ${name}. Tel: ${phone}.`
    }
    default:
      return null
  }
}

function buildCustomerTemplateComponents(
  type: string,
  order: any,
  quote: any,
): WhatsAppTemplateComponent[] {
  const parameters: WhatsAppTemplateComponentParameter[] = []

  switch (type) {
    case 'order_confirmation':
      parameters.push({ type: 'text', text: order?.customer_name || quote?.customer_name || 'cliente Ranger Bakery' })
      parameters.push({ type: 'text', text: order?.id ? `#${order.id}` : 'sin-id' })
      parameters.push({ type: 'text', text: formatCurrencyValue(order?.total ?? order?.subtotal ?? 0) })
      break
    case 'customer_quote_confirmation':
      parameters.push({ type: 'text', text: quote?.customer_name || 'cliente Ranger Bakery' })
      parameters.push({ type: 'text', text: quote?.reference_code || 'sin-codigo' })
      break
    case 'customer_order_payment_ready':
      parameters.push({ type: 'text', text: order?.customer_name || 'cliente Ranger Bakery' })
      parameters.push({ type: 'text', text: formatCurrencyValue(order?.total ?? order?.subtotal ?? 0) })
      parameters.push({ type: 'text', text: order?.payment_url || order?.tracking_url || 'sin-enlace' })
      break
    case 'customer_order_ready_for_pickup':
      parameters.push({ type: 'text', text: order?.customer_name || 'cliente Ranger Bakery' })
      parameters.push({ type: 'text', text: order?.pickup_time || 'Horario pendiente' })
      parameters.push({ type: 'text', text: order?.id ? `#${order.id}` : 'sin-id' })
      break
    default:
      break
  }

  return parameters.length
    ? [
        {
          type: 'body',
          parameters,
        },
      ]
    : []
}

function buildBusinessTemplateComponents(type: string, order: any, quote: any): WhatsAppTemplateComponent[] {
  const parameters: WhatsAppTemplateComponentParameter[] = []

  switch (type) {
    case 'business_new_order':
    case 'order_confirmation':
    case 'customer_order_payment_ready':
    case 'customer_order_ready_for_pickup':
      parameters.push({ type: 'text', text: order?.customer_name || 'Cliente' })
      parameters.push({ type: 'text', text: order?.id ? `#${order.id}` : 'sin-id' })
      parameters.push({ type: 'text', text: formatCurrencyValue(order?.total ?? order?.subtotal ?? 0) })
      parameters.push({ type: 'text', text: order?.customer_phone || 'sin-telefono' })
      break
    case 'customer_quote_confirmation':
    case 'new_quote':
      parameters.push({ type: 'text', text: quote?.customer_name || 'Cliente' })
      parameters.push({ type: 'text', text: quote?.reference_code || 'sin-codigo' })
      parameters.push({ type: 'text', text: quote?.customer_phone || 'sin-telefono' })
      break
    default:
      break
  }

  return parameters.length
    ? [
        {
          type: 'body',
          parameters,
        },
      ]
    : []
}

async function sendCustomerWhatsAppNotification(
  type: string,
  language: string,
  order: any,
  quote: any,
) {
  const phone = order?.customer_phone || quote?.customer_phone
  if (!phone) return null

  const message = buildCustomerWhatsAppMessage(type, language, order, quote)
  if (!message) return null

  const templateName =
    (type === 'order_confirmation' && WHATSAPP_TEMPLATE_CUSTOMER_ORDER_CONFIRMATION) ||
    (type === 'customer_quote_confirmation' && WHATSAPP_TEMPLATE_CUSTOMER_QUOTE_CONFIRMATION) ||
    (type === 'customer_order_payment_ready' && WHATSAPP_TEMPLATE_CUSTOMER_PAYMENT_READY) ||
    (type === 'customer_order_ready_for_pickup' && WHATSAPP_TEMPLATE_CUSTOMER_READY_FOR_PICKUP) ||
    ''

  if (templateName) {
    return await sendWhatsAppTemplateMessage({
      to: phone,
      templateName,
      languageCode: normalizeLanguageCode(language),
      components: buildCustomerTemplateComponents(type, order, quote),
    })
  }

  return await sendWhatsAppTextMessage({
    to: phone,
    body: message,
    previewUrl: /https?:\/\//i.test(message),
  })
}

async function sendBusinessWhatsAppNotifications(type: string, order: any, quote: any) {
  const recipients = getWhatsAppBusinessRecipients()
  if (!recipients.length) return []

  const message = buildBusinessWhatsAppMessage(type, order, quote)
  if (!message) return []

  const templateName =
    ((type === 'customer_quote_confirmation' || type === 'new_quote') && (WHATSAPP_TEMPLATE_BUSINESS_QUOTE_ALERT || WHATSAPP_TEMPLATE_BUSINESS_ORDER_ALERT)) ||
    (type === 'business_new_order' && WHATSAPP_TEMPLATE_BUSINESS_ORDER_ALERT) ||
    (type === 'order_confirmation' && WHATSAPP_TEMPLATE_BUSINESS_ORDER_ALERT) ||
    (type === 'customer_order_payment_ready' && WHATSAPP_TEMPLATE_BUSINESS_ORDER_ALERT) ||
    (type === 'customer_order_ready_for_pickup' && WHATSAPP_TEMPLATE_BUSINESS_ORDER_ALERT) ||
    ''

  return await Promise.all(
    recipients.map((recipient) =>
      templateName
        ? sendWhatsAppTemplateMessage({
            to: recipient,
            templateName,
            languageCode: WHATSAPP_LANGUAGE,
            components: buildBusinessTemplateComponents(type, order, quote),
          })
        : sendWhatsAppTextMessage({
            to: recipient,
            body: message,
          })
    )
  )
}

async function dispatchWhatsAppNotifications(
  type: string,
  language: string,
  order: any,
  quote: any,
) {
  const results: Record<string, unknown> = {}

  const customerResult = await sendCustomerWhatsAppNotification(type, language, order, quote)
  if (customerResult) {
    results.customer = customerResult
  }

  const businessResults = await sendBusinessWhatsAppNotifications(type, order, quote)
  if (businessResults.length) {
    results.business = businessResults
  }

  return results
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

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: responseCorsHeaders })
  }

  try {
    const body = await req.json()
    let { to, type = 'order_confirmation' } = body || {}
    const subject = typeof body?.subject === 'string'
      ? body.subject.replace(/[\r\n]+/g, ' ').trim()
      : undefined
    const language = typeof body?.language === 'string' ? body.language : 'es'
    let orderData = body?.orderData || {}
    let quoteData = body?.quoteData || {}

    const normalizedType = typeof type === 'string' ? type.trim() : 'order_confirmation'

    const auth = await requireUser(req, supabaseAdmin, responseCorsHeaders)
    if (auth instanceof Response) {
      return auth
    }

    const isStaff = isStaffRole(auth.role)

    const rawRecipient = typeof to === 'string' ? to.trim() : ''
    const normalizedRecipient = rawRecipient.toLowerCase()
    const isBusinessType = normalizedType.startsWith('business_') || normalizedType === 'new_quote'
    const isCustomerType = normalizedType.startsWith('customer_') || normalizedType === 'order_confirmation'

    let finalRecipient = rawRecipient

    if (isBusinessType) {
      if (!isStaff) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!rawRecipient) {
        return new Response(JSON.stringify({ error: 'Missing recipient' }), {
          status: 400,
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!BUSINESS_NOTIFICATION_ALLOWLIST.has(normalizedRecipient)) {
        return new Response(JSON.stringify({ error: 'Recipient not allowed' }), {
          status: 403,
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (normalizedType === 'business_new_order' && isValidUUID(orderData?.id)) {
        const { data: dbOrder } = await supabaseAdmin
          .from('orders')
          .select('id, customer_name, customer_phone, customer_email, subtotal, tax, total, status, items, payment_type, pickup_date, pickup_time, special_requests')
          .eq('id', orderData.id)
          .maybeSingle()

        if (dbOrder) {
          orderData = {
            ...dbOrder,
            id: dbOrder.id,
            items: Array.isArray(dbOrder.items) ? dbOrder.items : [],
          }
        }
      }

      if (normalizedType === 'new_quote' && isValidUUID(quoteData?.id)) {
        const { data: dbQuote } = await supabaseAdmin
          .from('quotes')
          .select('id, customer_name, customer_phone, customer_email, occasion, theme, event_date, event_details, special_requests, reference_code, cart_items, pickup_time')
          .eq('id', quoteData.id)
          .maybeSingle()

        if (dbQuote) {
          quoteData = {
            ...dbQuote,
            cart_items: Array.isArray(dbQuote.cart_items) ? dbQuote.cart_items : [],
          }
        }
      }
    } else if (normalizedType === 'customer_quote_confirmation') {
      if (isStaff && isValidUUID(quoteData?.id)) {
        const { data: dbQuote, error: quoteError } = await supabaseAdmin
          .from('quotes')
          .select('id, customer_email, customer_name, customer_phone, occasion, theme, event_date, event_details, special_requests, reference_code, cart_items')
          .eq('id', quoteData.id)
          .single()

        if (quoteError || !dbQuote?.customer_email) {
          return new Response(JSON.stringify({ error: 'Quote not found or missing email' }), {
            status: 404,
            headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
          })
        }

        finalRecipient = dbQuote.customer_email
        quoteData = {
          ...dbQuote,
          cart_items: Array.isArray(dbQuote.cart_items) ? dbQuote.cart_items : [],
        }
      } else {
        const authEmail = auth.email?.trim().toLowerCase()
        if (!authEmail || authEmail !== normalizedRecipient) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
          })
        }
        finalRecipient = auth.email || ''
      }
    } else if (isCustomerType) {
      const orderId = typeof orderData?.id === 'string' ? orderData.id : orderData?.order_id
      if (!isValidUUID(orderId)) {
        return new Response(JSON.stringify({ error: 'Missing or invalid order id' }), {
          status: 400,
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: orderRecord, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('id, user_id, customer_email, customer_name, customer_phone, pickup_date, pickup_time, subtotal, tax, total, status, items, special_requests, payment_status, payment_type, payment_reference, p2p_reference')
        .eq('id', orderId)
        .single()

      if (orderError || !orderRecord) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const ownsOrder = orderRecord.user_id ? orderRecord.user_id === auth.userId : false
      if (!isStaff && !ownsOrder) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!orderRecord.customer_email) {
        return new Response(JSON.stringify({ error: 'Order has no customer email' }), {
          status: 400,
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        })
      }

      finalRecipient = orderRecord.customer_email
      const paymentFallback = `${NORMALIZED_APP_BASE_URL}/order?orderId=${orderRecord.id}`
      const trackingFallback = `${NORMALIZED_APP_BASE_URL}/track?orderId=${orderRecord.id}`
      orderData = {
        ...orderRecord,
        id: orderRecord.id,
        payment_url: ensureAppUrl(orderData?.payment_url) || paymentFallback,
        tracking_url: ensureAppUrl(orderData?.tracking_url) || trackingFallback,
        items: Array.isArray(orderRecord.items) ? orderRecord.items : [],
      }
    } else {
      if (!isStaff) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (!rawRecipient) {
        return new Response(JSON.stringify({ error: 'Missing recipient' }), {
          status: 400,
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    to = finalRecipient

    type = normalizedType

    const inferredOrderId = orderData?.id || orderData?.order_id
    const fallbackPaymentUrl = inferredOrderId
      ? `${NORMALIZED_APP_BASE_URL}/order?orderId=${inferredOrderId}`
      : `${NORMALIZED_APP_BASE_URL}/order`
    const fallbackTrackingUrl = inferredOrderId
      ? `${NORMALIZED_APP_BASE_URL}/track?orderId=${inferredOrderId}`
      : `${NORMALIZED_APP_BASE_URL}/track`

    const order = {
      ...orderData,
      id: inferredOrderId,
      items: Array.isArray(orderData?.items) ? orderData.items : [],
      payment_url: orderData?.payment_url || fallbackPaymentUrl,
      tracking_url: orderData?.tracking_url || fallbackTrackingUrl,
    }
    const quote = {
      ...quoteData,
      cart_items: Array.isArray(quoteData?.cart_items) ? quoteData.cart_items : [],
      reference_code: quoteData?.reference_code || quoteData?.referenceCode || '',
      event_details: quoteData?.event_details || quoteData?.eventDetails || '',
      customer_name: quoteData?.customer_name || quoteData?.contactInfo?.name || quoteData?.name || '',
      customer_phone: quoteData?.customer_phone || quoteData?.contactInfo?.phone || '',
      customer_email: quoteData?.customer_email || quoteData?.contactInfo?.email || '',
    }
    const sanitizedOrder = {
      id: sanitizePlainText(order.id),
      status: sanitizePlainText(order.status),
      pickup_time: sanitizePlainText(order.pickup_time),
      pickup_date: sanitizePlainText(order.pickup_date),
      customer_name: sanitizePlainText(order.customer_name),
      customer_phone: sanitizePlainText(order.customer_phone),
      customer_email: sanitizePlainText(order.customer_email),
      payment_method: sanitizePlainText(order.payment_method || order.payment_type),
      payment_type: sanitizePlainText(order.payment_type),
      payment_status: sanitizePlainText(order.payment_status),
      payment_url: sanitizeLink(order.payment_url),
      tracking_url: sanitizeLink(order.tracking_url),
      payment_reference: sanitizePlainText(order.payment_reference),
      p2p_reference: sanitizePlainText(order.p2p_reference),
      special_requests: sanitizeMultiline(order.special_requests),
    }
    const sanitizedQuote = {
      reference_code: sanitizePlainText(quote.reference_code),
      customer_name: sanitizePlainText(quote.customer_name),
      customer_phone: sanitizePlainText(quote.customer_phone),
      customer_email: sanitizePlainText(quote.customer_email),
      occasion: sanitizePlainText(quote.occasion),
      theme: sanitizePlainText(quote.theme),
      event_date: sanitizePlainText(quote.event_date),
      event_details: sanitizeMultiline(quote.event_details),
      pickup_time: sanitizePlainText(quote.pickup_time),
      special_requests: sanitizeMultiline(quote.special_requests),
    }
    const orderItems = Array.isArray(order.items) ? (order.items as any[]) : []
    const orderItemsHtml = orderItems.length
      ? orderItems
          .map((item: any) => {
            const quantityNumber = Number(item?.quantity ?? 1)
            const safeQuantity = Number.isFinite(quantityNumber) ? quantityNumber : 1
            const priceNumber = Number(item?.price ?? 0)
            const safePrice = Number.isFinite(priceNumber) ? priceNumber : 0
            return `
              <li>${sanitizePlainText(item?.name || 'Artículo')} x${escapeHtml(String(safeQuantity))} - $${safePrice.toFixed(2)}</li>
            `
          })
          .join('')
      : '<li>Sin productos adjuntos.</li>'
    const orderItemsTableHtml = orderItems.length
      ? orderItems
          .map((item: any) => {
            const quantityNumber = Number(item?.quantity ?? 1)
            const safeQuantity = Number.isFinite(quantityNumber) ? quantityNumber : 1
            const priceNumber = Number(item?.price ?? 0)
            const safePrice = Number.isFinite(priceNumber) ? priceNumber : 0
            return `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #334155;">${sanitizePlainText(item?.name || 'Artículo')}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f1f5f9; color: #475569;">${escapeHtml(String(safeQuantity))}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #475569;">$${safePrice.toFixed(2)}</td>
              </tr>
            `
          })
          .join('')
      : '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #6b7280;">Sin productos adjuntos.</td></tr>'
    const quoteItems = Array.isArray(quote.cart_items) ? (quote.cart_items as any[]) : []
    const quoteItemsHtml = quoteItems.length
      ? quoteItems
          .map((item: any) => {
            const quantityNumber = Number(item?.quantity ?? 1)
            const safeQuantity = Number.isFinite(quantityNumber) ? quantityNumber : 1
            const priceLabel = sanitizePlainText(item?.price_label)
            const details = sanitizeMultiline(item?.details)
            return `
              <li style="margin-bottom: 8px;">
                <strong>${escapeHtml(String(safeQuantity))}x ${sanitizePlainText(item?.name || 'Artículo')}</strong>
                ${priceLabel ? `<div style="color: #6b7280; font-size: 12px;">${priceLabel}</div>` : ''}
                ${details ? `<div style="margin-top: 4px; color: #4b5563; white-space: pre-line;">${details}</div>` : ''}
              </li>
            `
          })
          .join('')
      : '<li style="color: #6b7280;">Sin desglose de artículos adjunto.</li>'
    const formattedQuoteSummary = typeof quote.event_details === 'string'
      ? sanitizeMultiline(quote.event_details).replace(/\n/g, '<br />')
      : ''

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured, simulating email send')
      const whatsapp = await dispatchWhatsAppNotifications(type, language, order, quote)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email simulation - RESEND_API_KEY not configured',
          data: { to, subject, type, order },
          whatsapp,
        }),
        {
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Email templates
    const templates = {
      es: {
        order_confirmation: {
          subject: `Confirmación de Pedido #${sanitizedOrder.id || 'Sin ID'} - Ranger's Bakery`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f472b6, #38bdf8); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Ranger's Bakery</h1>
                <p style="color: white; margin: 10px 0 0 0;">¡Gracias por tu pedido!</p>
              </div>

              <div style="padding: 30px 20px; background: white;">
                <h2 style="color: #92400e; margin-bottom: 20px;">Confirmación de Pedido</h2>

                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0; font-weight: bold;">Pedido #${sanitizedOrder.id || 'Sin ID'}</p>
                  <p style="margin: 5px 0 0 0;">Estado: ${sanitizedOrder.status || 'pendiente'}</p>
                  ${sanitizedOrder.pickup_time ? `<p style="margin: 5px 0 0 0;">Fecha de recogida: ${sanitizedOrder.pickup_time}</p>` : ''}
                </div>

                <h3 style="color: #92400e;">Detalles del Cliente:</h3>
                <p>Nombre: ${sanitizedOrder.customer_name || 'Cliente'}</p>
                <p>Teléfono: ${sanitizedOrder.customer_phone || 'No provisto'}</p>
                ${sanitizedOrder.customer_email ? `<p>Email: ${sanitizedOrder.customer_email}</p>` : ''}

                <h3 style="color: #92400e;">Productos:</h3>
                <ul>
                  ${orderItemsHtml}
                </ul>

                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p style="margin: 0;"><strong>Subtotal: $${Number(order.subtotal || 0).toFixed(2)}</strong></p>
                  <p style="margin: 5px 0 0 0;"><strong>Impuestos: $${Number(order.tax || 0).toFixed(2)}</strong></p>
                  <p style="margin: 5px 0 0 0; font-size: 18px; color: #92400e;"><strong>Total: $${Number(order.total || 0).toFixed(2)}</strong></p>
                </div>

                ${sanitizedOrder.special_requests ? `
                  <h3 style="color: #92400e;">Solicitudes Especiales:</h3>
                  <p style="background: #f9fafb; padding: 10px; border-radius: 4px; white-space: pre-wrap;">${sanitizedOrder.special_requests}</p>
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
          subject: `Nueva orden recibida #${sanitizedOrder.id || 'Sin ID'} - Ranger's Bakery`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f97316, #ef4444); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">¡Nueva orden recibida!</h1>
                <p style="color: white; margin: 10px 0 0 0;">Generada desde la app web</p>
              </div>

              <div style="padding: 28px 24px; background: #ffffff;">
                <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">Pedido #${sanitizedOrder.id || 'Sin ID'}</p>
                  <p style="margin: 6px 0 0 0; color: #b45309;">Estado inicial: ${sanitizedOrder.status || 'pendiente'}</p>
                  ${sanitizedOrder.payment_method ? `<p style="margin: 6px 0 0 0; color: #b45309;">Método de pago: ${sanitizedOrder.payment_method}</p>` : ''}
                  ${sanitizedOrder.pickup_time ? `<p style="margin: 6px 0 0 0; color: #b45309;">Recogida: ${sanitizedOrder.pickup_time}</p>` : ''}
                </div>

                <h3 style="color: #0f172a; margin-bottom: 12px;">Información del cliente</h3>
                <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Nombre:</strong> ${sanitizedOrder.customer_name || 'Cliente'}</p>
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Teléfono:</strong> ${sanitizedOrder.customer_phone || 'No provisto'}</p>
                  ${sanitizedOrder.customer_email ? `<p style="margin: 0; color: #475569;"><strong>Email:</strong> ${sanitizedOrder.customer_email}</p>` : ''}
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
                    ${orderItemsTableHtml}
                  </tbody>
                </table>

                <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; margin-top: 20px;">
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Subtotal:</strong> $${Number(order.subtotal || 0).toFixed(2)}</p>
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Impuestos:</strong> $${Number(order.tax || 0).toFixed(2)}</p>
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;"><strong>Total:</strong> $${Number(order.total || 0).toFixed(2)}</strong></p>
                </div>

                ${sanitizedOrder.special_requests ? `
                  <div style="margin-top: 20px; padding: 16px 20px; background: #ecfeff; border-radius: 12px; border: 1px solid #67e8f9;">
                    <h4 style="margin: 0 0 10px 0; color: #0369a1;">Notas / Solicitudes especiales</h4>
                    <p style="margin: 0; color: #0f172a; white-space: pre-wrap;">${sanitizedOrder.special_requests}</p>
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
          subject: subject || `Nueva cotización recibida - ${sanitizedQuote.reference_code || sanitizedQuote.customer_name || 'Cliente'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #c084fc, #6366f1); padding: 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Nueva solicitud de cotización</h1>
                <p style="margin: 8px 0 0 0;">Generada desde el personalizador de pasteles</p>
              </div>
              <div style="padding: 28px 24px; background: #ffffff;">
                <div style="background: #f5f3ff; border-radius: 12px; padding: 18px; border: 1px solid #ddd6fe;">
                  <p style="margin: 0; font-size: 18px; color: #4c1d95; font-weight: bold;">Referencia: ${sanitizedQuote.reference_code || 'Sin código'}</p>
                  <p style="margin: 6px 0 0 0; color: #5b21b6;">Cliente: ${sanitizedQuote.customer_name || 'Cliente'}</p>
                  ${sanitizedQuote.customer_phone ? `<p style="margin: 6px 0 0 0; color: #5b21b6;">Teléfono: ${sanitizedQuote.customer_phone}</p>` : ''}
                  ${sanitizedQuote.customer_email ? `<p style="margin: 6px 0 0 0; color: #5b21b6;">Email: ${sanitizedQuote.customer_email}</p>` : ''}
                </div>

                ${sanitizedQuote.pickup_time ? `
                  <div style="margin-top: 20px;">
                    <p style="margin: 0; font-weight: bold; color: #4338ca;">Hora preferida de recogida:</p>
                    <p style="margin: 4px 0 0 0; color: #312e81;">${sanitizedQuote.pickup_time}</p>
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

                ${sanitizedQuote.special_requests ? `
                  <div style="margin-top: 24px; background: #fffbeb; border-radius: 10px; padding: 16px; border: 1px solid #fef3c7;">
                    <h4 style="margin: 0 0 8px 0; color: #92400e;">Solicitudes especiales</h4>
                    <p style="margin: 0; color: #92400e; white-space: pre-line;">${sanitizedQuote.special_requests}</p>
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
                <p style="font-size: 16px; color: #1f2937;">Hola ${sanitizedQuote.customer_name || 'amigo/a de Ranger Bakery'},</p>
                <p style="color: #4b5563; line-height: 1.6;">
                  Nuestro equipo revisará tu diseño y en menos de 24 horas te enviaremos el precio final por correo o teléfono.
                </p>

                <div style="background: #fdf2f8; border-radius: 12px; padding: 18px; border: 1px solid #fbcfe8;">
                  <p style="margin: 0; color: #be185d; font-weight: bold;">Tu código de referencia</p>
                  <p style="margin: 4px 0 0 0; color: #9d174d; font-size: 20px; letter-spacing: 1px; font-weight: bold;">${sanitizedQuote.reference_code || 'Pendiente'}</p>
                  ${sanitizedQuote.pickup_time ? `<p style="margin: 8px 0 0 0; color: #be185d;">Hora preferida de recogida: ${sanitizedQuote.pickup_time}</p>` : ''}
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

                ${sanitizedQuote.special_requests ? `
                  <div style="margin-top: 24px; background: #fff7ed; border-radius: 10px; padding: 16px; border: 1px solid #fed7aa;">
                    <h4 style="margin: 0 0 8px 0; color: #b45309;">Tus notas</h4>
                    <p style="margin: 0; color: #b45309; white-space: pre-line;">${sanitizedQuote.special_requests}</p>
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
        },
        customer_order_payment_ready: {
          subject: `Tu orden ${sanitizedOrder.id ? `#${sanitizedOrder.id} ` : ''}está lista para pagar 💳`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #fb7185, #f97316); padding: 26px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 26px;">¡Tu orden está lista!</h1>
                <p style="margin: 10px 0 0 0;">Ya puedes completar el pago para continuar con la preparación.</p>
              </div>
              <div style="padding: 28px 24px; background: #ffffff;">
                <p style="font-size: 16px; color: #1f2937;">Hola ${sanitizedOrder.customer_name || 'cliente Ranger'},</p>
                <p style="color: #4b5563; line-height: 1.6;">
                  Hemos revisado tu pedido y confirmamos el precio final. Completa el pago en línea para que podamos comenzar a trabajar en tu orden.
                </p>

                <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                  <p style="margin: 0; color: #64748b;">Total a pagar</p>
                  <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #0f172a;">$${Number(order.total || 0).toFixed(2)}</p>
                  <p style="margin: 8px 0 0 0; color: #64748b;">Subtotal: $${Number(order.subtotal || 0).toFixed(2)} ${Number(order.tax || 0) > 0 ? `| Impuestos: $${Number(order.tax || 0).toFixed(2)}` : ''}</p>
                </div>

                ${sanitizedOrder.payment_url ? `
                  <div style="text-align: center; margin-bottom: 28px;">
                    <a href="${sanitizedOrder.payment_url}" style="display: inline-block; background: linear-gradient(135deg, #fb7185, #f97316); color: white; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-size: 16px; font-weight: bold;">Pagar mi orden</a>
                  </div>
                ` : ''}

                ${sanitizedOrder.pickup_time ? `
                  <p style="color: #4b5563; line-height: 1.6; text-align: center;">
                    Hora estimada de recogida: <strong>${sanitizedOrder.pickup_time}</strong>
                  </p>
                ` : ''}

                ${sanitizedOrder.tracking_url ? `
                  <p style="color: #6b7280; text-align: center;">
                    Puedes seguir el estado de tu orden aquí: <a href="${sanitizedOrder.tracking_url}" style="color: #f97316; font-weight: 600;">Ver mi orden</a>
                  </p>
                ` : ''}
              </div>
              <div style="background: #f3f4f6; padding: 18px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">Gracias por confiar en Ranger's Bakery 🍰</p>
                <p style="margin: 6px 0 0 0;">Si tienes preguntas escríbenos al (862) 233-7204</p>
              </div>
            </div>
          `
        },
        customer_order_ready_for_pickup: {
          subject: `Tu orden ${sanitizedOrder.id ? `#${sanitizedOrder.id} ` : ''}está lista para recoger 🎉`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #34d399, #22d3ee); padding: 26px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 26px;">¡Listo para recoger!</h1>
                <p style="margin: 10px 0 0 0;">Tu pedido ya está terminado y esperándote.</p>
              </div>
              <div style="padding: 28px 24px; background: #ffffff;">
                <p style="font-size: 16px; color: #1f2937;">Hola ${sanitizedOrder.customer_name || 'cliente Ranger'},</p>
                <p style="color: #4b5563; line-height: 1.6;">
                  Queríamos avisarte que tu orden está lista para recoger en la panadería. ¡No podemos esperar a que la veas!
                </p>

                ${sanitizedOrder.pickup_time ? `
                  <div style="background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; color: #0f172a;">Horario sugerido:</p>
                    <p style="margin: 6px 0 0 0; font-size: 18px; font-weight: bold; color: #0f172a;">${sanitizedOrder.pickup_time}</p>
                  </div>
                ` : ''}

                ${sanitizedOrder.tracking_url ? `
                  <p style="color: #6b7280; text-align: center;">
                    Revisa los detalles y el estado aquí: <a href="${sanitizedOrder.tracking_url}" style="color: #0ea5e9; font-weight: 600;">Seguir mi orden</a>
                  </p>
                ` : ''}

                ${sanitizedOrder.payment_url ? `
                  <p style="color: #f97316; text-align: center; font-weight: 600;">
                    Si aún no has pagado, puedes hacerlo en línea: <a href="${sanitizedOrder.payment_url}" style="color: #fb7185;">Pagar ahora</a>
                  </p>
                ` : ''}

                <p style="color: #4b5563; line-height: 1.6;">
                  Dirección: <strong>Ranger's Bakery, 371 Bloomfield Ave, Caldwell, NJ</strong>.<br />
                  Si necesitas reprogramar la recogida, llámanos o escríbenos por WhatsApp.
                </p>
              </div>
              <div style="background: #f3f4f6; padding: 18px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">¡Gracias por apoyar a un negocio local! 💖</p>
                <p style="margin: 6px 0 0 0;">Ranger's Bakery - (862) 233-7204</p>
              </div>
            </div>
          `
        }
      },
      en: {
        order_confirmation: {
          subject: `Order Confirmation #${sanitizedOrder.id || 'N/A'} - Ranger's Bakery`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f472b6, #38bdf8); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Ranger's Bakery</h1>
                <p style="color: white; margin: 10px 0 0 0;">Thank you for your order!</p>
              </div>

              <div style="padding: 30px 20px; background: white;">
                <h2 style="color: #92400e; margin-bottom: 20px;">Order Confirmation</h2>

                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0; font-weight: bold;">Order #${sanitizedOrder.id || 'N/A'}</p>
                  <p style="margin: 5px 0 0 0;">Status: ${sanitizedOrder.status || 'pending'}</p>
                  ${sanitizedOrder.pickup_time ? `<p style="margin: 5px 0 0 0;">Pickup time: ${sanitizedOrder.pickup_time}</p>` : ''}
                </div>

                <h3 style="color: #92400e;">Customer Details:</h3>
                <p>Name: ${sanitizedOrder.customer_name || 'Customer'}</p>
                <p>Phone: ${sanitizedOrder.customer_phone || 'Not provided'}</p>
                ${sanitizedOrder.customer_email ? `<p>Email: ${sanitizedOrder.customer_email}</p>` : ''}

                <h3 style="color: #92400e;">Items:</h3>
                <ul>
                  ${orderItemsHtml}
                </ul>

                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p style="margin: 0;"><strong>Subtotal: $${Number(order.subtotal || 0).toFixed(2)}</strong></p>
                  <p style="margin: 5px 0 0 0;"><strong>Tax: $${Number(order.tax || 0).toFixed(2)}</strong></p>
                  <p style="margin: 5px 0 0 0; font-size: 18px; color: #92400e;"><strong>Total: $${Number(order.total || 0).toFixed(2)}</strong></p>
                </div>

                ${sanitizedOrder.special_requests ? `
                  <h3 style="color: #92400e;">Special Requests:</h3>
                  <p style="background: #f9fafb; padding: 10px; border-radius: 4px; white-space: pre-wrap;">${sanitizedOrder.special_requests}</p>
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
          subject: `New order received #${sanitizedOrder.id || 'N/A'} - Ranger's Bakery`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">New order received</h1>
                <p style="color: white; margin: 10px 0 0 0;">Submitted from the web app</p>
              </div>

              <div style="padding: 28px 24px; background: #ffffff;">
                <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #312e81;">Order #${sanitizedOrder.id || 'N/A'}</p>
                  <p style="margin: 6px 0 0 0; color: #4338ca;">Initial status: ${sanitizedOrder.status || 'pending'}</p>
                  ${sanitizedOrder.payment_method ? `<p style="margin: 6px 0 0 0; color: #4338ca;">Payment method: ${sanitizedOrder.payment_method}</p>` : ''}
                  ${sanitizedOrder.pickup_time ? `<p style="margin: 6px 0 0 0; color: #4338ca;">Pickup: ${sanitizedOrder.pickup_time}</p>` : ''}
                </div>

                <h3 style="color: #0f172a; margin-bottom: 12px;">Customer information</h3>
                <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Name:</strong> ${sanitizedOrder.customer_name || 'Customer'}</p>
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Phone:</strong> ${sanitizedOrder.customer_phone || 'Not provided'}</p>
                  ${sanitizedOrder.customer_email ? `<p style="margin: 0; color: #475569;"><strong>Email:</strong> ${sanitizedOrder.customer_email}</p>` : ''}
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
                    ${orderItemsTableHtml}
                  </tbody>
                </table>

                <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; margin-top: 20px;">
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Subtotal:</strong> $${Number(order.subtotal || 0).toFixed(2)}</p>
                  <p style="margin: 0 0 6px 0; color: #475569;"><strong>Tax:</strong> $${Number(order.tax || 0).toFixed(2)}</p>
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;"><strong>Total:</strong> $${Number(order.total || 0).toFixed(2)}</p>
                </div>

                ${sanitizedOrder.special_requests ? `
                  <div style="margin-top: 20px; padding: 16px 20px; background: #eef2ff; border-radius: 12px; border: 1px solid #c7d2fe;">
                    <h4 style="margin: 0 0 10px 0; color: #3730a3;">Notes / Special requests</h4>
                    <p style="margin: 0; color: #0f172a; white-space: pre-wrap;">${sanitizedOrder.special_requests}</p>
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
          subject: subject || `New quote request - ${sanitizedQuote.reference_code || sanitizedQuote.customer_name || 'Customer'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #60a5fa, #2563eb); padding: 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">New custom cake request</h1>
                <p style="margin: 8px 0 0 0;">Submitted from the cake designer</p>
              </div>
              <div style="padding: 28px 24px; background: #ffffff;">
                <div style="background: #dbeafe; border-radius: 12px; padding: 18px; border: 1px solid #bfdbfe;">
                  <p style="margin: 0; font-size: 18px; color: #1d4ed8; font-weight: bold;">Reference: ${sanitizedQuote.reference_code || 'N/A'}</p>
                  <p style="margin: 6px 0 0 0; color: #1e40af;">Customer: ${sanitizedQuote.customer_name || 'Customer'}</p>
                  ${sanitizedQuote.customer_phone ? `<p style="margin: 6px 0 0 0; color: #1e40af;">Phone: ${sanitizedQuote.customer_phone}</p>` : ''}
                  ${sanitizedQuote.customer_email ? `<p style="margin: 6px 0 0 0; color: #1e40af;">Email: ${sanitizedQuote.customer_email}</p>` : ''}
                </div>

                ${sanitizedQuote.pickup_time ? `
                  <div style="margin-top: 20px;">
                    <p style="margin: 0; font-weight: bold; color: #1d4ed8;">Preferred pickup time:</p>
                    <p style="margin: 4px 0 0 0; color: #1e3a8a;">${sanitizedQuote.pickup_time}</p>
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

                ${sanitizedQuote.special_requests ? `
                  <div style="margin-top: 24px; background: #fef9c3; border-radius: 10px; padding: 16px; border: 1px solid #fde047;">
                    <h4 style="margin: 0 0 8px 0; color: #92400e;">Special notes</h4>
                    <p style="margin: 0; color: #92400e; white-space: pre-line;">${sanitizedQuote.special_requests}</p>
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
                <p style="font-size: 16px; color: #111827;">Hi ${sanitizedQuote.customer_name || 'Ranger Bakery friend'},</p>
                <p style="color: #4b5563; line-height: 1.6;">
                  Our team will review your request and send the final quote within the next 24 hours.
                </p>

                <div style="background: #ede9fe; border-radius: 12px; padding: 18px; border: 1px solid #ddd6fe;">
                  <p style="margin: 0; color: #4338ca; font-weight: bold;">Your reference code</p>
                  <p style="margin: 4px 0 0 0; color: #312e81; font-size: 20px; letter-spacing: 1px; font-weight: bold;">${sanitizedQuote.reference_code || 'Pending'}</p>
                  ${sanitizedQuote.pickup_time ? `<p style="margin: 8px 0 0 0; color: #4338ca;">Preferred pickup time: ${sanitizedQuote.pickup_time}</p>` : ''}
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

                ${sanitizedQuote.special_requests ? `
                  <div style="margin-top: 24px; background: #fff7ed; border-radius: 10px; padding: 16px; border: 1px solid #fde68a;">
                    <h4 style="margin: 0 0 8px 0; color: #b45309;">Your notes</h4>
                    <p style="margin: 0; color: #b45309; white-space: pre-line;">${sanitizedQuote.special_requests}</p>
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
        },
        customer_order_payment_ready: {
          subject: `Your order ${sanitizedOrder.id ? `#${sanitizedOrder.id} ` : ''}is ready to pay 💳`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 26px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 26px;">Your order is ready!</h1>
                <p style="margin: 10px 0 0 0;">Complete the payment so we can start baking.</p>
              </div>
              <div style="padding: 28px 24px; background: #ffffff;">
                <p style="font-size: 16px; color: #1f2937;">Hi ${sanitizedOrder.customer_name || 'Ranger friend'},</p>
                <p style="color: #4b5563; line-height: 1.6;">
                  We've reviewed your order and confirmed the final price. Please pay online to lock in your spot on our schedule.
                </p>

                <div style="background: #eef2ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                  <p style="margin: 0; color: #6366f1;">Amount due</p>
                  <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #312e81;">$${Number(order.total || 0).toFixed(2)}</p>
                  <p style="margin: 8px 0 0 0; color: #6366f1;">Subtotal: $${Number(order.subtotal || 0).toFixed(2)} ${Number(order.tax || 0) > 0 ? `| Tax: $${Number(order.tax || 0).toFixed(2)}` : ''}</p>
                </div>

                ${sanitizedOrder.payment_url ? `
                  <div style="text-align: center; margin-bottom: 28px;">
                    <a href="${sanitizedOrder.payment_url}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-size: 16px; font-weight: bold;">Pay now</a>
                  </div>
                ` : ''}

                ${sanitizedOrder.pickup_time ? `
                  <p style="color: #4b5563; line-height: 1.6; text-align: center;">
                    Estimated pickup time: <strong>${sanitizedOrder.pickup_time}</strong>
                  </p>
                ` : ''}

                ${sanitizedOrder.tracking_url ? `
                  <p style="color: #6b7280; text-align: center;">
                    Track your order anytime: <a href="${sanitizedOrder.tracking_url}" style="color: #6366f1; font-weight: 600;">View my order</a>
                  </p>
                ` : ''}
              </div>
              <div style="background: #f3f4f6; padding: 18px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">Thank you for choosing Ranger's Bakery 🍰</p>
                <p style="margin: 6px 0 0 0;">Questions? Text or call us at (862) 233-7204</p>
              </div>
            </div>
          `
        },
        customer_order_ready_for_pickup: {
          subject: `Your order ${sanitizedOrder.id ? `#${sanitizedOrder.id} ` : ''}is ready for pickup 🎉`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #22c55e, #0ea5e9); padding: 26px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 26px;">Ready for pickup!</h1>
                <p style="margin: 10px 0 0 0;">Your treats are fresh and waiting for you.</p>
              </div>
              <div style="padding: 28px 24px; background: #ffffff;">
                <p style="font-size: 16px; color: #1f2937;">Hi ${sanitizedOrder.customer_name || 'Ranger friend'},</p>
                <p style="color: #4b5563; line-height: 1.6;">
                  Great news! Your order is finished and ready for pickup at the bakery. We hope you love it!
                </p>

                ${sanitizedOrder.pickup_time ? `
                  <div style="background: #ecfeff; border: 1px solid #bae6fd; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; color: #0f172a;">Suggested pickup time</p>
                    <p style="margin: 6px 0 0 0; font-size: 18px; font-weight: bold; color: #0f172a;">${sanitizedOrder.pickup_time}</p>
                  </div>
                ` : ''}

                ${sanitizedOrder.tracking_url ? `
                  <p style="color: #6b7280; text-align: center;">
                    Check details anytime: <a href="${sanitizedOrder.tracking_url}" style="color: #0ea5e9; font-weight: 600;">Track my order</a>
                  </p>
                ` : ''}

                ${sanitizedOrder.payment_url ? `
                  <p style="color: #f97316; text-align: center; font-weight: 600;">
                    Need to pay first? <a href="${sanitizedOrder.payment_url}" style="color: #fb7185;">Pay online now</a>
                  </p>
                ` : ''}

                <p style="color: #4b5563; line-height: 1.6;">
                  Pickup location: <strong>Ranger's Bakery, 371 Bloomfield Ave, Caldwell, NJ</strong>.<br />
                  Call or text us if you need to adjust the pickup time.
                </p>
              </div>
              <div style="background: #f3f4f6; padding: 18px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">Thank you for supporting a local bakery! 💖</p>
                <p style="margin: 6px 0 0 0;">Ranger's Bakery - (862) 233-7204</p>
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
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
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
        from: 'Ranger\'s Bakery <rangerbakery@gmail.com>',
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
          headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const whatsapp = await dispatchWhatsAppNotifications(type, language, order, quote)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        id: result.id,
        whatsapp,
      }),
      { headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' } }
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
        headers: { ...responseCorsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
