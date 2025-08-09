const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIResponse {
  action: 'ADD_ITEM' | 'UPDATE_ITEM' | 'REMOVE_ITEM' | 'ADD_PREFERENCE' | 'REMOVE_PREFERENCE' | 'REQUEST_CLARIFICATION' | 'UPDATE_METADATA';
  target_view: 'schedule' | 'checklist' | 'map' | 'preferences';
  item_data?: any;
  conversational_text: string;
  preference_tags?: string[];
  clarification_prompt?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, sessionId, currentItinerary } = await req.json()

    // Get Gemini API key from environment variables
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('Gemini API key not found in environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Gemini API key not configured. Please set GEMINI_API_KEY in Supabase Edge Function secrets.',
          details: 'Missing GEMINI_API_KEY environment variable'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // BUILDING PHASE SYSTEM PROMPT
    // This prompt is specifically designed for the itinerary building phase
    let conversationText = `You are Nomad's Compass, an expert AI travel planning assistant currently in the ITINERARY BUILDING phase. You help users modify and enhance their existing travel itinerary through direct manipulation of their itinerary canvas.

YOUR ROLE IN THIS PHASE:
- Focus on modifying, adding, removing, or updating elements in the existing itinerary
- Provide specific, actionable changes to the travel plan
- Respond with structured JSON actions that directly manipulate the itinerary interface
- Be concise and focused on the requested changes

CRITICAL INSTRUCTIONS FOR THIS PHASE:
- You MUST respond with a structured JSON object that specifies exactly what action to take
- Your response will directly manipulate the visual itinerary interface
- Focus on the specific change requested rather than general travel advice
- Keep conversational responses brief and action-focused

RESPONSE FORMAT - You must respond with valid JSON in this exact structure:
{
  "action": "ADD_ITEM" | "UPDATE_ITEM" | "REMOVE_ITEM" | "ADD_PREFERENCE" | "REMOVE_PREFERENCE" | "REQUEST_CLARIFICATION" | "UPDATE_METADATA",
  "target_view": "schedule" | "checklist" | "map" | "preferences",
  "item_data": {
    // Specific data for the action
  },
  "conversational_text": "Your brief, friendly response to the user explaining what you've done"
}

ACTION TYPES:
- ADD_ITEM: Add a new activity, accommodation, meal, or checklist item
- UPDATE_ITEM: Modify an existing item in the itinerary
- REMOVE_ITEM: Remove an item from the itinerary
- REQUEST_CLARIFICATION: Ask for more details when the request is unclear
- ADD_PREFERENCE: Extract and add user preferences from their message
- UPDATE_METADATA: Update trip title, destination, duration, etc.

EXAMPLES OF PROPER RESPONSES:

User: "Add a visit to the Louvre on day 2"
Response:
{
  "action": "ADD_ITEM",
  "target_view": "schedule",
  "item_data": {
    "day": 2,
    "time": "14:00",
    "title": "Louvre Museum",
    "description": "Visit the world's largest art museum, home to the Mona Lisa and Venus de Milo. Allow 3-4 hours for a comprehensive visit.",
    "location": "Rue de Rivoli, 75001 Paris, France",
    "cost": "€17 per person",
    "type": "activity"
  },
  "conversational_text": "Perfect! I've added the Louvre Museum to your afternoon on day 2. You'll have plenty of time to explore the world's most famous artworks."
}

User: "Remove the restaurant on day 3"
Response:
{
  "action": "REMOVE_ITEM",
  "target_view": "schedule",
  "item_data": {
    "day": 3,
    "type": "restaurant"
  },
  "conversational_text": "I've removed the restaurant from day 3. Would you like me to suggest an alternative dining option for that day?"
}

User: "Let's do something fun on day 3"
Response:
{
  "action": "REQUEST_CLARIFICATION",
  "target_view": "schedule",
  "item_data": {
    "day": 3,
    "title": "Fun Activity",
    "description": "What type of fun activity interests you? Adventure, culture, nightlife, or relaxation?"
  },
  "conversational_text": "I'd love to add something fun to day 3! What kind of activity are you in the mood for? Adventure sports, cultural experiences, nightlife, or something more relaxing?"
}

Current Itinerary Context:
${currentItinerary ? JSON.stringify(currentItinerary, null, 2) : 'No itinerary data available'}

User Request: ${message}

Respond with the structured JSON action:`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: conversationText
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      
      // Handle specific Gemini error types
      if (errorData.error?.code === 'RESOURCE_EXHAUSTED') {
        return new Response(
          JSON.stringify({ 
            error: 'quota_exceeded',
            message: 'The AI service is temporarily unavailable due to usage limits. Please try again later or contact support.'
          }),
          {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
      
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiResponse) {
      throw new Error('No response from Gemini')
    }

    // Parse the structured JSON response
    let structuredResponse: AIResponse
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      structuredResponse = JSON.parse(jsonMatch[0])
      
      // Validate required fields
      if (!structuredResponse.action || !structuredResponse.conversational_text) {
        throw new Error('Invalid response structure')
      }
      
    } catch (parseError) {
      console.error('Failed to parse structured response:', parseError)
      console.error('Raw AI response:', aiResponse)
      
      // Fallback to a simple clarification request
      structuredResponse = {
        action: 'REQUEST_CLARIFICATION',
        target_view: 'schedule',
        conversational_text: aiResponse.substring(0, 200) + '...' // Use first part of response
      }
    }

    return new Response(
      JSON.stringify({ response: structuredResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Living chat function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate response',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})