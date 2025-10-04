import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  getAllowedOrigins,
  getCorsConfigError,
  getCorsHeaders,
  isOriginAllowed,
} from '../_shared/cors.ts'

type UnknownRecord = Record<string, unknown>

interface GoogleReviewText {
  text?: string
}

interface GoogleReviewAuthorAttribution {
  displayName?: string
  photoUri?: string
}

interface GoogleReviewResponseItem {
  name?: string
  publishTime?: string
  rating?: number
  authorAttribution?: GoogleReviewAuthorAttribution | null
  relativePublishTimeDescription?: string
  text?: GoogleReviewText | null
  originalText?: GoogleReviewText | null
}

interface GooglePlaceResponse {
  rating?: number
  userRatingCount?: number
  reviews?: GoogleReviewResponseItem[]
}

interface NormalizedReview {
  id: string
  author_name: string
  rating: number
  text: string
  time?: number
  profile_photo_url?: string
  relative_time_description?: string
}

const BUSINESS_NAME_FALLBACK = 'Rangers Bakery'
const BUSINESS_ADDRESS_FALLBACK = '3657 John F. Kennedy Blvd, Jersey City, NJ 07307'

const ALLOWED_METHODS = new Set(['GET', 'OPTIONS'])

const jsonResponse = (
  body: UnknownRecord,
  init: ResponseInit = {},
  corsHeaders: Record<string, string>,
) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: (() => {
      const headers = new Headers(init.headers ?? {})
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value)
      })
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      return headers
    })(),
  })

const parseReview = (review: GoogleReviewResponseItem, index: number): NormalizedReview => {
  const name = typeof review.name === 'string' ? review.name : ''
  const publishTime = typeof review.publishTime === 'string' ? review.publishTime : undefined
  const computedTime = publishTime ? Math.floor(new Date(publishTime).getTime() / 1000) : undefined
  const time = typeof computedTime === 'number' && Number.isFinite(computedTime) ? computedTime : undefined

  const authorAttribution = review.authorAttribution ?? undefined
  const displayName =
    authorAttribution?.displayName && authorAttribution.displayName.trim().length > 0
      ? authorAttribution.displayName.trim()
      : undefined

  const textSources = [review.text, review.originalText]
  const text = textSources.reduce((acc: string, textSource) => {
    if (acc) return acc
    const textValue = textSource?.text
    return typeof textValue === 'string' ? textValue : ''
  }, '')

  const rating = typeof review.rating === 'number' && Number.isFinite(review.rating) ? review.rating : 0

  const relativeTime =
    typeof review.relativePublishTimeDescription === 'string'
      ? review.relativePublishTimeDescription
      : undefined

  const profilePhoto =
    typeof authorAttribution?.photoUri === 'string' && authorAttribution.photoUri.trim().length > 0
      ? authorAttribution.photoUri
      : undefined

  const generatedId =
    name && name.includes('/')
      ? name.split('/').pop() || name
      : displayName
      ? `${displayName.replace(/\s+/g, '-').toLowerCase()}-${index}`
      : `review-${index}`

  return {
    id: generatedId,
    author_name: displayName ?? 'Guest',
    rating,
    text,
    time,
    profile_photo_url: profilePhoto,
    relative_time_description: relativeTime,
  }
}

const normalizeReviews = (reviews: GoogleReviewResponseItem[] | undefined | null): NormalizedReview[] => {
  if (!Array.isArray(reviews)) {
    return []
  }

  return reviews.map((review, index) => parseReview(review, index))
}

const corsConfigurationError = getCorsConfigError()

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (corsConfigurationError) {
    return jsonResponse({ error: corsConfigurationError }, { status: 500 }, corsHeaders)
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!ALLOWED_METHODS.has(req.method)) {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 }, corsHeaders)
  }

  if (origin && !isOriginAllowed(origin)) {
    console.warn(`Blocked request from origin: ${origin || 'unknown'}. Allowed origins: ${getAllowedOrigins().join(', ')}`)
    return jsonResponse({ error: 'Forbidden origin' }, { status: 403 }, corsHeaders)
  }

  try {
    const apiKey = (Deno.env.get('GOOGLE_PLACES_API_KEY') || '').trim()
    const placeId = (Deno.env.get('GOOGLE_PLACES_PLACE_ID') || '').trim()
    const businessName = Deno.env.get('GOOGLE_BUSINESS_NAME') || BUSINESS_NAME_FALLBACK

    const setupInstructions = {
      success: false,
      setupRequired: true,
      message: 'Google Reviews integration is not configured yet.',
      docsPath: 'docs/google-reviews-setup.md',
      requirements: [
        'Configura GOOGLE_PLACES_API_KEY en las variables de entorno del Edge Function',
        'Configura GOOGLE_PLACES_PLACE_ID en las variables de entorno del Edge Function',
        'Habilita Places API en Google Cloud Console'
      ],
      businessName,
      businessAddress: Deno.env.get('GOOGLE_BUSINESS_ADDRESS') || BUSINESS_ADDRESS_FALLBACK
    }

    if (!apiKey || !placeId) {
      console.warn('Google Reviews missing configuration', {
        hasApiKey: Boolean(apiKey),
        hasPlaceId: Boolean(placeId),
        environment: Deno.env.get('SUPABASE_ENVIRONMENT') || 'unknown',
      })
      return jsonResponse(setupInstructions, { status: 400 }, corsHeaders)
    }

    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews'
      }
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`Google Places API error: ${response.status} ${response.statusText} - ${text}`)
      return jsonResponse(
        {
          success: false,
          message: 'Error fetching reviews from Google Places API.',
          status: response.status,
          statusText: response.statusText,
        },
        { status: 502 },
        corsHeaders,
      )
    }

    const data = (await response.json()) as GooglePlaceResponse
    const reviews = normalizeReviews(data.reviews)

    return jsonResponse(
      {
        success: true,
        averageRating: typeof data.rating === 'number' ? data.rating : 0,
        totalReviews: typeof data.userRatingCount === 'number' ? data.userRatingCount : 0,
        reviews,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=1800',
        },
      },
      corsHeaders,
    )
  } catch (error) {
    console.error('Unexpected error while fetching Google Reviews', error)
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : String(error),
        message: 'Error connecting to Google Reviews API',
      },
      { status: 500 },
      corsHeaders,
    )
  }
})
