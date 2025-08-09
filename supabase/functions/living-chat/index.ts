const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIResponse {
  action: 'ADD_ITEM' | 'UPDATE_ITEM' | 'REMOVE_ITEM' | 'ADD_PREFERENCE' | 'REMOVE_PREFERENCE' | 'REQUEST_CLARIFICATION' | 'UPDATE_METADATA' | 'GENERATE_ITINERARY';
  target_view: 'schedule' | 'checklist' | 'map' | 'preferences';
  item_data?: any;
  itinerary_data?: any; // ADDED: For full itinerary generation
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
    // FIXED: Added console.log for debugging and receive conversationHistory
    const requestBody = await req.json()
    console.log('=== Incoming Request Body ===')
    console.log('Request keys:', Object.keys(requestBody))
    console.log('Conversation history length:', requestBody.conversationHistory?.length || 0)
    console.log('Current message:', requestBody.message)
    
    const { message, sessionId, currentItinerary, conversationHistory = [] } = requestBody

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

    // SIMPLIFIED: Always use itinerary building mode
    let conversationText = `You are Nomad's Compass, an expert AI travel planning assistant. You help users create and modify travel itineraries through direct manipulation of their itinerary interface.

YOUR ROLE:
- During initial conversations, ask ONE focused question at a time to gather travel requirements
- Create new itineraries only after gathering sufficient information through sequential questioning
- Modify, add, remove, or update elements in existing itineraries
- Provide specific, actionable changes to travel plans
- Respond with structured JSON actions that directly manipulate the itinerary interface
- Be helpful, enthusiastic, and focused on creating amazing travel experiences

CRITICAL REQUIREMENT GATHERING RULES:
- If no itinerary exists yet, you are in REQUIREMENT GATHERING mode
- Ask ONLY ONE specific, focused question per response during this phase
- Wait for the user's answer before asking your next question
- Do NOT ask multiple questions in a single response
- Focus on gathering: destination, dates, duration, travelers, budget, interests, accommodation preferences
- Only generate a complete itinerary after you have sufficient information from this sequential questioning process

CRITICAL INSTRUCTIONS:
- You MUST respond with a structured JSON object that specifies exactly what action to take
- Your response will directly manipulate the visual itinerary interface
- When users describe a new trip but you need more details, use REQUEST_CLARIFICATION to ask ONE question
- Only use GENERATE_ITINERARY action when you have gathered comprehensive trip details through sequential questions
- When users want to modify existing plans, use specific actions like ADD_ITEM, UPDATE_ITEM, etc.
- Keep conversational responses friendly but focused on the travel planning task

REQUIREMENT GATHERING EXAMPLES:

User: "I want to plan a trip to Europe"
Response:
{
  "action": "REQUEST_CLARIFICATION",
  "target_view": "schedule",
  "conversational_text": "Europe sounds amazing! Which specific countries or cities in Europe are you most interested in visiting?"
}

User: "I'm thinking Paris and Rome"
Response:
{
  "action": "REQUEST_CLARIFICATION", 
  "target_view": "schedule",
  "conversational_text": "Perfect choices! How many days are you planning for this Paris and Rome adventure?"
}

User: "About 10 days total"
Response:
{
  "action": "REQUEST_CLARIFICATION",
  "target_view": "schedule", 
  "conversational_text": "Excellent! How many people will be traveling on this 10-day European trip?"
}

RESPONSE FORMAT - You must respond with valid JSON in this exact structure:
{
  "action": "REQUEST_CLARIFICATION" | "GENERATE_ITINERARY" | "ADD_ITEM" | "UPDATE_ITEM" | "REMOVE_ITEM" | "UPDATE_METADATA",
  "target_view": "schedule" | "checklist" | "map" | "preferences",
  "itinerary_data": {
    // Complete itinerary object for GENERATE_ITINERARY action
    "title": "Trip Title",
    "summary": "Brief trip description",
    "destination": "Primary destination",
    "duration": "X days",
    "number_of_travelers": 2,
    "daily_schedule": [
      {
        "day": 1,
        "date": "2024-03-15",
        "activities": [
          {
            "time": "09:00",
            "title": "Activity name",
            "description": "Detailed activity description",
            "location": "Specific location",
            "cost": "$50 per person"
          }
        ]
      }
    ],
    "checklist": [
      {
        "category": "Before Travel",
        "items": [
          {
            "task": "Book flights",
            "completed": false,
            "priority": "high"
          }
        ]
      }
    ],
    "map_locations": [
      {
        "name": "Location name",
        "address": "Full address",
        "lat": 35.6812,
        "lng": 139.7671,
        "type": "attraction",
        "day": 1
      }
    ]
  },
  "item_data": {
    // Specific data for individual item actions (ADD_ITEM, UPDATE_ITEM, etc.)
  },
  "conversational_text": "Your friendly response explaining what you've done"
}

ACTION TYPES:
- REQUEST_CLARIFICATION: Ask ONE specific question to gather more trip details (use during initial requirement gathering)
- GENERATE_ITINERARY: Create a complete new itinerary (use when user describes a new trip)
- ADD_ITEM: Add a single activity, accommodation, meal, or checklist item
- UPDATE_ITEM: Modify an existing item in the itinerary
- REMOVE_ITEM: Remove an item from the itinerary
- UPDATE_METADATA: Update trip title, destination, duration, etc.

EXAMPLES:

User: "Plan a 5-day trip to Tokyo for 2 people in March"
Response:
{
  "action": "GENERATE_ITINERARY",
  "target_view": "schedule",
  "itinerary_data": {
    "title": "5-Day Tokyo Adventure",
    "summary": "Explore the vibrant culture, cuisine, and attractions of Japan's capital city",
    "destination": "Tokyo, Japan",
    "duration": "5 days",
    "number_of_travelers": 2,
    "daily_schedule": [
      {
        "day": 1,
        "date": "2024-03-15",
        "activities": [
          {
            "time": "10:00",
            "title": "Arrival at Haneda Airport",
            "description": "Land in Tokyo and take the train to your hotel in Shibuya",
            "location": "Haneda Airport",
            "cost": "¥500 train fare per person"
          },
          {
            "time": "14:00",
            "title": "Explore Shibuya Crossing",
            "description": "Experience the world's busiest pedestrian crossing and visit Shibuya Sky observation deck",
            "location": "Shibuya Crossing, Tokyo",
            "cost": "¥2000 per person for Sky deck"
          }
        ]
      }
    ],
    "checklist": [
      {
        "category": "Before Travel",
        "items": [
          {
            "task": "Check passport validity (6+ months)",
            "completed": false,
            "priority": "high"
          },
          {
            "task": "Book flights to Tokyo",
            "completed": false,
            "priority": "high"
          }
        ]
      }
    ],
    "map_locations": [
      {
        "name": "Shibuya Crossing",
        "address": "Shibuya City, Tokyo, Japan",
        "lat": 35.6598,
        "lng": 139.7006,
        "type": "attraction",
        "day": 1
      }
    ]
  },
  "conversational_text": "Perfect! I've created a fantastic 5-day Tokyo itinerary for you and your travel companion. Your adventure includes iconic spots like Shibuya Crossing, cultural experiences, and amazing food. I've also added a pre-travel checklist to help you prepare. What would you like to adjust or add to your trip?"
}

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
    "cost": "€17 per person"
  },
  "conversational_text": "Great choice! I've added the Louvre Museum to your afternoon on day 2. You'll have plenty of time to explore the world's most famous artworks, including the Mona Lisa!"
}

Current Itinerary Context:
${currentItinerary ? JSON.stringify(currentItinerary, null, 2) : 'No existing itinerary - ready to create a new one!'}

User Request: ${message}

Respond with the structured JSON action:`;

    // Call Gemini API
    console.log('=== Sending to Gemini API ===')
    console.log('Conversation context length:', conversationText.length)
    
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
          maxOutputTokens: 2000, // INCREASED: Allow for full itinerary generation
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