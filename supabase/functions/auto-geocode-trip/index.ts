import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { trip_id } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch trip data
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('trips')
      .select('id, nume, destinatie, oras, tara')
      .eq('id', trip_id)
      .single()

    if (tripError) throw tripError

    console.log('[AutoGeocode] Processing trip:', trip.nume)

    // 2. Extract cities from text
    const text = `${trip.destinatie} ${trip.oras || ''} ${trip.tara}`
    const cityNames = extractCities(text)

    console.log('[AutoGeocode] Detected cities:', cityNames)

    // 3. Geocode each city (with rate limiting)
    const locations = []
    for (const cityName of cityNames) {
      try {
        const location = await geocodeCity(cityName)
        if (location) {
          locations.push(location)
          console.log('[AutoGeocode] Geocoded:', cityName, location)
        }
        // Rate limit: 1 request/second for Nominatim
        await new Promise(resolve => setTimeout(resolve, 1100))
      } catch (error) {
        console.error(`[AutoGeocode] Failed to geocode ${cityName}:`, error)
      }
    }

    if (locations.length === 0) {
      throw new Error('No locations could be geocoded')
    }

    console.log('[AutoGeocode] Total geocoded locations:', locations.length)

    // 4. Calculate bounds
    const bounds = calculateBounds(locations)

    // 5. Estimate storage
    const zoomMin = 5
    const zoomMax = 10
    const tileCount = estimateTileCount(bounds, zoomMin, zoomMax)
    const estimatedSizeMB = (tileCount * 25) / 1024 // ~25KB per tile average

    console.log('[AutoGeocode] Estimated tiles:', tileCount, 'Size:', estimatedSizeMB.toFixed(2), 'MB')

    // 6. Save or update config
    const { data: config, error: configError } = await supabaseAdmin
      .from('offline_map_configs')
      .upsert(
        {
          trip_id: trip_id,
          bounds_north: bounds.north,
          bounds_south: bounds.south,
          bounds_east: bounds.east,
          bounds_west: bounds.west,
          zoom_min: zoomMin,
          zoom_max: zoomMax,
          locations: locations,
          tile_count: tileCount,
          estimated_size_mb: parseFloat(estimatedSizeMB.toFixed(2)),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'trip_id' }
      )
      .select()
      .single()

    if (configError) throw configError

    console.log('[AutoGeocode] Config saved successfully')

    return new Response(
      JSON.stringify({
        success: true,
        config: config,
        locations: locations,
        message: `Successfully configured map for ${locations.length} locations`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[AutoGeocode] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper functions
function extractCities(text: string): string[] {
  // Split by common separators
  const parts = text.split(/[,;•\-\n→]/)
  
  // Clean and filter
  const cities = parts
    .map(p => p.trim())
    .filter(p => p.length > 2)
    .filter(p => !p.match(/^\d+$/)) // Remove pure numbers
    .filter(p => !p.match(/^(ziua|day|ora|hour|km|h|min)/i)) // Remove common words
    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
  
  return cities.slice(0, 20) // Max 20 cities
}

async function geocodeCity(cityName: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(cityName)}&format=json&limit=1`,
    {
      headers: {
        'User-Agent': 'JinfoApp-TravelApp/1.0'
      }
    }
  )
  
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`)
  }
  
  const data = await response.json()
  
  if (data.length > 0) {
    return {
      name: cityName,
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display_name: data[0].display_name
    }
  }
  
  return null
}

function calculateBounds(locations: any[]) {
  const lats = locations.map(l => l.lat)
  const lngs = locations.map(l => l.lng)
  
  // Add 10% padding
  const latPadding = (Math.max(...lats) - Math.min(...lats)) * 0.1
  const lngPadding = (Math.max(...lngs) - Math.min(...lngs)) * 0.1
  
  return {
    north: Math.max(...lats) + latPadding,
    south: Math.min(...lats) - latPadding,
    east: Math.max(...lngs) + lngPadding,
    west: Math.min(...lngs) - lngPadding
  }
}

function estimateTileCount(bounds: any, zoomMin: number, zoomMax: number): number {
  let total = 0
  
  for (let zoom = zoomMin; zoom <= zoomMax; zoom++) {
    const n = Math.pow(2, zoom)
    const latTiles = Math.ceil((bounds.north - bounds.south) / 180 * n)
    const lngTiles = Math.ceil((bounds.east - bounds.west) / 360 * n)
    total += latTiles * lngTiles
  }
  
  return total
}