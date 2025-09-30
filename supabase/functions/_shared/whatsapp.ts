const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN')
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
const GRAPH_VERSION = Deno.env.get('WHATSAPP_GRAPH_VERSION') || 'v18.0'
const DEFAULT_LANGUAGE = Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') || 'es'

export interface WhatsAppSendResult {
  to: string
  success: boolean
  status?: number
  error?: string
  skipped?: boolean
  payloadType: 'text' | 'template'
}

export interface WhatsAppTextMessageOptions {
  to: string
  body: string
  previewUrl?: boolean
}

export interface WhatsAppTemplateComponentParameter {
  type: 'text' | 'currency' | 'date_time'
  text?: string
  currency?: {
    fallback_value: string
    code: string
    amount_1000: number
  }
  date_time?: {
    fallback_value: string
  }
}

export interface WhatsAppTemplateComponent {
  type: 'body' | 'button'
  sub_type?: 'url' | 'quick_reply'
  index?: string
  parameters: WhatsAppTemplateComponentParameter[]
}

export interface WhatsAppTemplateMessageOptions {
  to: string
  templateName: string
  languageCode?: string
  components?: WhatsAppTemplateComponent[]
}

function buildApiUrl() {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`
}

export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  const trimmed = phone.trim()
  if (!trimmed) return ''
  const digits = trimmed.replace(/[^\d+]/g, '')
  if (!digits) return ''

  if (digits.startsWith('+')) {
    return digits
  }

  const numeric = digits.replace(/[^\d]/g, '')

  if (!numeric) return ''

  if (numeric.length === 11 && numeric.startsWith('1')) {
    return `+${numeric}`
  }

  if (numeric.length === 10) {
    return `+1${numeric}`
  }

  if (trimmed.startsWith('+')) {
    return `+${numeric}`
  }

  return numeric.startsWith('+') ? numeric : `+${numeric}`
}

export function getWhatsAppBusinessRecipients(): string[] {
  const raw = Deno.env.get('WHATSAPP_BUSINESS_RECIPIENTS') || ''
  return raw
    .split(/[,\n]/)
    .map((value) => normalizePhoneNumber(value))
    .filter(Boolean)
}

async function sendWhatsAppPayload(
  to: string,
  payload: Record<string, unknown>,
  payloadType: 'text' | 'template'
): Promise<WhatsAppSendResult> {
  const normalizedTo = normalizePhoneNumber(to)
  if (!normalizedTo) {
    return {
      to,
      success: false,
      error: 'Invalid WhatsApp recipient number',
      skipped: true,
      payloadType,
    }
  }

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp credentials missing, skipping send')
    return {
      to: normalizedTo,
      success: false,
      error: 'WhatsApp credentials not configured',
      skipped: true,
      payloadType,
    }
  }

  try {
    const response = await fetch(buildApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedTo,
        ...payload,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WhatsApp API error:', response.status, errorText)
      return {
        to: normalizedTo,
        success: false,
        status: response.status,
        error: errorText,
        payloadType,
      }
    }

    return {
      to: normalizedTo,
      success: true,
      status: response.status,
      payloadType,
    }
  } catch (error) {
    console.error('WhatsApp API request failed:', error)
    return {
      to: normalizedTo,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown WhatsApp error',
      payloadType,
    }
  }
}

export async function sendWhatsAppTextMessage(options: WhatsAppTextMessageOptions) {
  return sendWhatsAppPayload(
    options.to,
    {
      type: 'text',
      text: {
        body: options.body,
        preview_url: options.previewUrl ?? false,
      },
    },
    'text',
  )
}

export async function sendWhatsAppTemplateMessage(options: WhatsAppTemplateMessageOptions) {
  return sendWhatsAppPayload(
    options.to,
    {
      type: 'template',
      template: {
        name: options.templateName,
        language: {
          code: options.languageCode || DEFAULT_LANGUAGE,
        },
        components: options.components && options.components.length > 0 ? options.components : undefined,
      },
    },
    'template',
  )
}
