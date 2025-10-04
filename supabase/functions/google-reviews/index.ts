import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  getAllowedOrigins,
  getCorsConfigError,
  getCorsHeaders,
  isOriginAllowed,
} from '../_shared/cors.ts'

const corsConfigurationError = getCorsConfigError()

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (corsConfigurationError) {
    return new Response(
      JSON.stringify({ error: corsConfigurationError }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (origin && !isOriginAllowed(origin)) {
    console.warn(`Blocked request from origin: ${origin || 'unknown'}. Allowed origins: ${getAllowedOrigins().join(', ')}`)
    return new Response(
      JSON.stringify({ error: 'Forbidden origin' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    const placeId = Deno.env.get('GOOGLE_PLACES_PLACE_ID')
    const businessName = Deno.env.get('GOOGLE_BUSINESS_NAME') || 'Rangers Bakery'

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
      businessAddress: '3657 John F. Kennedy Blvd, Jersey City, NJ 07307'
    }

    if (!apiKey || !placeId) {
      return new Response(JSON.stringify(setupInstructions), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error fetching reviews from Google Places API.',
          status: response.status,
          statusText: response.statusText
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    const reviews = Array.isArray(data.reviews)
      ? data.reviews.map((review: Record<string, unknown>, index: number) => {
          const name = typeof review.name === 'string' ? review.name : ''
          const publishTime = typeof review.publishTime === 'string' ? review.publishTime : undefined
          const computedTime = publishTime ? Math.floor(new Date(publishTime).getTime() / 1000) : undefined
          const time = typeof computedTime === 'number' && Number.isFinite(computedTime) ? computedTime : undefined
          const authorAttribution = (review.authorAttribution ?? {}) as Record<string, unknown>
          const authorName = typeof authorAttribution.displayName === 'string' && authorAttribution.displayName.trim().length > 0
            ? authorAttribution.displayName.trim()
            : 'Guest'
          const text = review.text && typeof (review.text as Record<string, unknown>).text === 'string'
            ? ((review.text as Record<string, unknown>).text as string)
            : review.originalText && typeof (review.originalText as Record<string, unknown>).text === 'string'
            ? ((review.originalText as Record<string, unknown>).text as string)
            : ''
          const rating = typeof review.rating === 'number' ? review.rating : 0
          const relativeTime = typeof review.relativePublishTimeDescription === 'string'
            ? review.relativePublishTimeDescription
            : undefined
          const profilePhoto = typeof authorAttribution.photoUri === 'string'
            ? authorAttribution.photoUri
            : undefined

          const generatedId = name
            ? name.split('/').pop() || name
            : `${authorName.replace(/\s+/g, '-').toLowerCase()}-${index}`

          return {
            id: generatedId,
            author_name: authorName,
            rating,
            text,
            time,
            profile_photo_url: profilePhoto,
            relative_time_description: relativeTime,
          }
        })
      : []

    return new Response(
      JSON.stringify({
        success: true,
        averageRating: typeof data.rating === 'number' ? data.rating : 0,
        totalReviews: typeof data.userRatingCount === 'number' ? data.userRatingCount : 0,
        reviews,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=1800',
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        message: 'Error connecting to Google Reviews API'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
