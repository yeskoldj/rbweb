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

  if (!isOriginAllowed(origin)) {
    console.warn(`Blocked request from origin: ${origin || 'unknown'}. Allowed origins: ${getAllowedOrigins().join(', ')}`)
    return new Response(
      JSON.stringify({ error: 'Forbidden origin' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}`
    )

    if (!response.ok) {
      console.error(`Google Places API error: ${response.status} ${response.statusText}`)
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

    if (data.status === 'OK' && data.result) {
      return new Response(
        JSON.stringify({
          success: true,
          averageRating: data.result.rating || 0,
          totalReviews: data.result.user_ratings_total || 0,
          reviews: data.result.reviews || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.warn('Unexpected response from Google Places API', data)
    return new Response(
      JSON.stringify({
        success: false,
        message: data.error_message || 'Unexpected response from Google Places API.',
        status: data.status,
        averageRating: 0,
        totalReviews: 0,
        reviews: []
      }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Error connecting to Google Reviews API'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
