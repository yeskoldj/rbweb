import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This Edge Function is ready for when you get Google Places API access
    // For now, it returns a structure showing what's needed
    
    const { placeId, apiKey } = await req.json()
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Google Places API Key required',
          message: 'Para conectar con Google Reviews necesitas:',
          requirements: [
            '1. Google Places API Key de Google Cloud Console',
            '2. Place ID de Rangers Bakery (podemos ayudarte a encontrarlo)',
            '3. Habilitar Places API en Google Cloud Console'
          ],
          businessAddress: '3657 John F. Kennedy Blvd, Jersey City, NJ 07307',
          nextSteps: 'Una vez tengas la API Key, envíala y configuramos la integración'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // When you have the API key, this is how we'll fetch real reviews:
    /*
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK') {
      return new Response(
        JSON.stringify({
          success: true,
          averageRating: data.result.rating,
          totalReviews: data.result.user_ratings_total,
          reviews: data.result.reviews || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    */

    // For now, return empty state
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Google Reviews integration pending',
        averageRating: 0,
        totalReviews: 0,
        reviews: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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