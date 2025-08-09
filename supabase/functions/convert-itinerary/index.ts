const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { itineraryText } = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Gemini API key not configured',
          details: 'Missing GEMINI_API_KEY environment variable'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const conversionPrompt = `Convert the following travel itinerary text into a structured JSON format. Extract all relevant information and organize it properly.

The JSON should have this exact structure:
{
  "title": "Trip title",
  "summary": "Brief 2-3 sentence summary of the trip",
  "destination": "Main destination",
  "duration": "Trip duration (e.g., '7 days', '2 weeks')",
  "number_of_travelers": 2,
  "daily_schedule": [
    {
      "day": 1,
      "date": "2024-03-15",
      "activities": [
        {
          "time": "09:00",
          "title": "Activity name",
          "description": "Activity description",
          "location": "Location name",
          "cost": "$50 per person"
        }
      ]
    }
  ],
  "checklist": [
    {
      "category": "Documents",
      "items": ["Passport", "Travel insurance", "Flight tickets"]
    },
    {
      "category": "Packing",
      "items": ["Comfortable shoes", "Weather-appropriate clothing"]
    }
  ],
  "map_locations": [
    {
      "name": "Location name",
      "address": "Full address",
      "lat": 40.7128,
      "lng": -74.0060,
      "type": "accommodation"
    }
  ]
}

For map_locations, use these types: "accommodation", "restaurant", "attraction", "transport"

Here's the itinerary text to convert:
${itineraryText}

Return ONLY the JSON object, no additional text or formatting.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: conversionPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2000,
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiResponse) {
      throw new Error('No response from Gemini')
    }

    // Parse the JSON response
    let itineraryData
    try {
      // Clean the response to extract JSON
      let jsonString = aiResponse.match(/\{[\s\S]*\}/)?.[0]
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      // Clean up common AI generation issues
      if (jsonString) {
        // Remove trailing commas before closing brackets/braces
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1')
        // Remove any markdown code block markers
        jsonString = jsonString.replace(/```json\s*|\s*```/g, '')
        // Trim whitespace
        jsonString = jsonString.trim()
      }
      
      if (!jsonString) {
        throw new Error('No valid JSON found in response')
      }
      
      itineraryData = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Raw AI response:', aiResponse)
      throw new Error('Failed to parse itinerary data')
    }

    return new Response(
      JSON.stringify({ itinerary: itineraryData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Convert itinerary function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to convert itinerary',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})