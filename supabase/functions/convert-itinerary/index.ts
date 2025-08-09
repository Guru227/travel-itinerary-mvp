const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeeklyItineraryData {
  tripTitle?: string;
  summary?: string;
  destination?: string;
  duration?: string;
  numberOfTravelers?: number;
  schedule?: any[];
  checklist?: any[];
  mapPins?: any[];
}

interface FinalItineraryData {
  tripTitle: string;
  summary: string;
  destination: string;
  duration: string;
  numberOfTravelers: number;
  schedule: any[];
  checklist: any[];
  mapPins: any[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Convert Itinerary Function Started (Chunking Workflow) ===')
    console.log('Request method:', req.method)

    // Parse the incoming request body
    let requestBody
    try {
      requestBody = await req.json()
      console.log('Parsed request body keys:', Object.keys(requestBody))
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
    console.log('Itinerary text preview (first 300 chars):', itineraryText.substring(0, 300))

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

    // Step 1: Analyze input to determine trip duration in weeks
    console.log('=== Step 1: Analyzing trip duration ===')
    const durationAnalysisPrompt = `Analyze the following travel itinerary and determine how many weeks this trip spans. Return ONLY a single number representing the number of weeks (round up to the nearest whole week if needed).

For example:
- A 5-day trip = 1 week
- A 10-day trip = 2 weeks  
- A 3-week trip = 3 weeks

Travel Itinerary:
${itineraryText}

Number of weeks:`

    let totalWeeks: number
    try {
      const durationResponse = await callGeminiAPI(geminiApiKey, durationAnalysisPrompt)
      const weeksText = durationResponse.trim()
      totalWeeks = parseInt(weeksText)
      
      if (isNaN(totalWeeks) || totalWeeks < 1 || totalWeeks > 12) {
        throw new Error(`Invalid weeks count: ${weeksText}`)
      }
      
      console.log('Detected trip duration:', totalWeeks, 'weeks')
    } catch (error) {
      console.error('Failed to analyze trip duration:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to analyze trip duration',
          details: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Step 2: Initialize final result object
    console.log('=== Step 2: Initializing final result object ===')
    const finalResult: FinalItineraryData = {
      tripTitle: '',
      summary: '',
      destination: '',
      duration: '',
      numberOfTravelers: 1,
      schedule: [],
      checklist: [],
      mapPins: []
    }

    // Step 3: Process each week iteratively
    console.log('=== Step 3: Processing weeks iteratively ===')
    for (let week = 1; week <= totalWeeks; week++) {
      console.log(`--- Processing Week ${week} of ${totalWeeks} ---`)
      
      try {
        // Construct targeted prompt for this specific week
        const weeklyPrompt = constructWeeklyPrompt(itineraryText, week, totalWeeks)
        console.log(`Week ${week} prompt length:`, weeklyPrompt.length)
        
        // Make API call for this week
        const weeklyResponse = await callGeminiAPI(geminiApiKey, weeklyPrompt)
        console.log(`Week ${week} response length:`, weeklyResponse.length)
        console.log(`Week ${week} response preview:`, weeklyResponse.substring(0, 200))
        
        // Parse and validate weekly JSON
        const weeklyData = parseWeeklyJSON(weeklyResponse, week)
        console.log(`Week ${week} parsed data keys:`, Object.keys(weeklyData))
        
        // Merge weekly data into final result
        mergeWeeklyData(finalResult, weeklyData, week)
        console.log(`Week ${week} merged successfully`)
        
      } catch (error) {
        console.error(`Failed to process Week ${week}:`, error)
        return new Response(
          JSON.stringify({ 
            error: `Failed to process Week ${week}`,
            details: error.message,
            completedWeeks: week - 1,
            totalWeeks: totalWeeks
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    // Step 4: Final validation and response
    console.log('=== Step 4: Final validation ===')
    console.log('Final result summary:')
    console.log('- Title:', finalResult.tripTitle)
    console.log('- Schedule items:', finalResult.schedule.length)
    console.log('- Checklist categories:', finalResult.checklist.length)
    console.log('- Map pins:', finalResult.mapPins.length)

    console.log('=== Convert Itinerary Function Completed Successfully ===')

    return new Response(
      JSON.stringify({ itinerary: finalResult }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
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

/**
 * Makes a call to the Gemini API with the given prompt
 */
async function callGeminiAPI(apiKey: string, prompt: string): Promise<string> {
  const geminiRequestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2000,
    }
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  
  let geminiResponse
  try {
    geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequestBody),
    })
  } catch (fetchError) {
    throw new Error(`Network error calling Gemini API: ${fetchError.message}`)
  }

  if (!geminiResponse.ok) {
    let errorDetails
    try {
      errorDetails = await geminiResponse.json()
    } catch {
      try {
        errorDetails = await geminiResponse.text()
      } catch {
        errorDetails = 'Unable to read error response from Gemini API'
      }
    }
    throw new Error(`Gemini API returned status ${geminiResponse.status}: ${JSON.stringify(errorDetails)}`)
  }

  let geminiData
  try {
    geminiData = await geminiResponse.json()
  } catch (parseError) {
    throw new Error('Gemini API returned invalid JSON response')
  }

  const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
  if (!aiResponse) {
    throw new Error('No text content received from Gemini API')
  }

  return aiResponse
}

/**
 * Constructs a targeted prompt for a specific week
 */
function constructWeeklyPrompt(fullItinerary: string, weekNumber: number, totalWeeks: number): string {
  const basePrompt = `You are an expert travel data parser. Based on the following complete travel itinerary, generate structured JSON data for WEEK ${weekNumber} ONLY (out of ${totalWeeks} total weeks).

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON, no additional text, explanations, or markdown formatting
- Focus ONLY on Week ${weekNumber} activities, locations, and details
- For the first week, include all metadata (tripTitle, summary, destination, duration, numberOfTravelers)
- For subsequent weeks, you may omit metadata or use placeholder values
- Ensure day numbers continue sequentially (Week 2 should start with day 8 if Week 1 had 7 days, etc.)

Required JSON Structure:
{
  "tripTitle": "Trip title (required for Week 1, optional for others)",
  "summary": "Trip summary (required for Week 1, optional for others)", 
  "destination": "Primary destination (required for Week 1, optional for others)",
  "duration": "Total trip duration (required for Week 1, optional for others)",
  "numberOfTravelers": 2,
  "schedule": [
    {
      "day": 1,
      "date": "2024-03-15",
      "morning": [
        {
          "time": "09:00",
          "activity": "Morning activity name",
          "description": "Detailed morning activity description",
          "location": "Specific location name",
          "coordinates": { "lat": 35.6762, "lng": 139.6503 },
          "estimatedCost": "$30 per person"
        }
      ],
      "afternoon": [
        {
          "time": "14:00",
          "activity": "Afternoon activity name",
          "description": "Detailed afternoon activity description",
          "location": "Specific location name",
          "coordinates": { "lat": 35.6762, "lng": 139.6503 },
          "estimatedCost": "$40 per person"
        }
      ],
      "evening": [
        {
          "time": "19:00",
          "activity": "Evening activity name",
          "description": "Detailed evening activity description",
          "location": "Specific location name",
          "coordinates": { "lat": 35.6762, "lng": 139.6503 },
          "estimatedCost": "$60 per person"
        }
      ]
    }
  ],
  "checklist": [
    {
      "category": "Week ${weekNumber} Preparations",
      "items": [
        {
          "task": "Specific task for this week",
          "completed": false,
          "priority": "high"
        }
      ]
    }
  ],
  "mapPins": [
    {
      "id": "week${weekNumber}_pin_1",
      "name": "Location name",
      "address": "Full address",
      "lat": 35.6812,
      "lng": 139.7671,
      "type": "attraction",
      "day": 1,
      "description": "Location description"
    }
  ]
}

Complete Travel Itinerary:
${fullItinerary}

Generate JSON for WEEK ${weekNumber} ONLY:`

  return basePrompt
}

/**
 * Parses and validates JSON response for a specific week
 */
function parseWeeklyJSON(response: string, weekNumber: number): WeeklyItineraryData {
  try {
    // Extract JSON from response
    let jsonString = response.match(/\{[\s\S]*\}/)?.[0]
    
    if (!jsonString) {
      throw new Error(`No JSON object found in Week ${weekNumber} response`)
    }
    
    // Clean up common AI generation issues
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1')
    jsonString = jsonString.replace(/```json\s*|\s*```/g, '')
    jsonString = jsonString.trim()
    
    // Parse the cleaned JSON
    const weeklyData = JSON.parse(jsonString)
    
    // Validate structure
    if (!weeklyData || typeof weeklyData !== 'object') {
      throw new Error(`Week ${weekNumber} data is not a valid object`)
    }
    
    // Ensure arrays exist
    if (!Array.isArray(weeklyData.schedule)) weeklyData.schedule = []
    if (!Array.isArray(weeklyData.checklist)) weeklyData.checklist = []
    if (!Array.isArray(weeklyData.mapPins)) weeklyData.mapPins = []
    
    return weeklyData
    
  } catch (parseError) {
    throw new Error(`Failed to parse Week ${weekNumber} JSON: ${parseError.message}`)
  }
}

/**
 * Merges weekly data into the final result object
 */
function mergeWeeklyData(finalResult: FinalItineraryData, weeklyData: WeeklyItineraryData, weekNumber: number): void {
  // For the first week, capture metadata
  if (weekNumber === 1) {
    if (weeklyData.tripTitle) finalResult.tripTitle = weeklyData.tripTitle
    if (weeklyData.summary) finalResult.summary = weeklyData.summary
    if (weeklyData.destination) finalResult.destination = weeklyData.destination
    if (weeklyData.duration) finalResult.duration = weeklyData.duration
    if (weeklyData.numberOfTravelers) finalResult.numberOfTravelers = weeklyData.numberOfTravelers
  }
  
  // Merge arrays (append weekly data to final arrays)
  if (weeklyData.schedule && Array.isArray(weeklyData.schedule)) {
    finalResult.schedule.push(...weeklyData.schedule)
  }
  
  if (weeklyData.checklist && Array.isArray(weeklyData.checklist)) {
    finalResult.checklist.push(...weeklyData.checklist)
  }
  
  if (weeklyData.mapPins && Array.isArray(weeklyData.mapPins)) {
    finalResult.mapPins.push(...weeklyData.mapPins)
  }
}