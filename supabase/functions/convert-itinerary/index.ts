const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log the incoming request for debugging
    console.log('=== Convert Itinerary Function Started ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    // Parse the incoming request body
    let requestBody
    try {
      requestBody = await req.json()
      console.log('Parsed request body:', requestBody)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: 'Request body must be valid JSON'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { itineraryText } = requestBody

    // Validate that itineraryText exists
    if (!itineraryText) {
      console.error('Missing itineraryText in request body')
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field',
          details: 'itineraryText is required in request body'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log('Itinerary text length:', itineraryText.length)
    console.log('Itinerary text preview (first 200 chars):', itineraryText.substring(0, 200))

    // Check for Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable not found')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Gemini API key not configured'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log('Gemini API key found, length:', geminiApiKey.length)

    // Construct the Gemini API request payload
    const geminiRequestBody = {
      contents: [{
        parts: [{
          text: itineraryText
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2000,
      }
    }

    console.log('Gemini request payload:', JSON.stringify(geminiRequestBody, null, 2))

    // Make the API call to Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`
    console.log('Making request to Gemini API...')

    let geminiResponse
    try {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequestBody),
      })

      console.log('Gemini API response status:', geminiResponse.status)
      console.log('Gemini API response headers:', Object.fromEntries(geminiResponse.headers.entries()))

    } catch (fetchError) {
      console.error('Network error calling Gemini API:', fetchError)
      return new Response(
        JSON.stringify({ 
          error: 'Network error',
          details: `Failed to connect to Gemini API: ${fetchError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Handle non-2xx responses from Gemini API
    if (!geminiResponse.ok) {
      console.error('Gemini API returned non-2xx status:', geminiResponse.status)
      
      let errorDetails
      try {
        // Try to get JSON error response
        errorDetails = await geminiResponse.json()
        console.error('Gemini API error response (JSON):', errorDetails)
      } catch (jsonError) {
        // If JSON parsing fails, get text response
        try {
          errorDetails = await geminiResponse.text()
          console.error('Gemini API error response (text):', errorDetails)
        } catch (textError) {
          errorDetails = 'Unable to read error response from Gemini API'
          console.error('Failed to read error response:', textError)
        }
      }

      return new Response(
        JSON.stringify({ 
          error: 'Gemini API error',
          details: `Gemini API returned status ${geminiResponse.status}: ${JSON.stringify(errorDetails)}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Parse the successful response from Gemini
    let geminiData
    try {
      geminiData = await geminiResponse.json()
      console.log('Gemini API response data:', JSON.stringify(geminiData, null, 2))
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format',
          details: 'Gemini API returned invalid JSON response'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Extract the AI response text
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiResponse) {
      console.error('No text content found in Gemini response')
      console.error('Gemini response structure:', JSON.stringify(geminiData, null, 2))
      return new Response(
        JSON.stringify({ 
          error: 'Empty response',
          details: 'No text content received from Gemini API'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log('AI response length:', aiResponse.length)
    console.log('AI response preview (first 500 chars):', aiResponse.substring(0, 500))

    // Parse the JSON response from the AI
    let itineraryData
    try {
      // Clean the response to extract JSON
      let jsonString = aiResponse.match(/\{[\s\S]*\}/)?.[0]
      
      if (!jsonString) {
        console.error('No JSON object found in AI response')
        console.error('Full AI response:', aiResponse)
        throw new Error('No JSON found in response')
      }
      
      console.log('Extracted JSON string length:', jsonString.length)
      console.log('Extracted JSON string preview:', jsonString.substring(0, 300))
      
      // Clean up common AI generation issues
      if (jsonString) {
        // Remove trailing commas before closing brackets/braces
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1')
        // Remove any markdown code block markers
        jsonString = jsonString.replace(/```json\s*|\s*```/g, '')
        // Trim whitespace
        jsonString = jsonString.trim()
      }
      
      console.log('Cleaned JSON string preview:', jsonString.substring(0, 300))
      
      // Parse the cleaned JSON
      itineraryData = JSON.parse(jsonString)
      console.log('Successfully parsed itinerary data:', JSON.stringify(itineraryData, null, 2))
      
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Failed to parse JSON from AI response')
      console.error('Raw AI response:', aiResponse)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse itinerary data',
          details: `JSON parsing failed: ${parseError.message}. AI response: ${aiResponse.substring(0, 500)}...`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Validate that we have the expected structure
    if (!itineraryData || typeof itineraryData !== 'object') {
      console.error('Invalid itinerary data structure:', itineraryData)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid data structure',
          details: 'Parsed data is not a valid object'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log('=== Convert Itinerary Function Completed Successfully ===')

    // Return the successful response
    return new Response(
      JSON.stringify({ itinerary: itineraryData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    // Catch any unexpected errors
    console.error('=== Unexpected Error in Convert Itinerary Function ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected server error',
        details: `An unexpected error occurred: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})