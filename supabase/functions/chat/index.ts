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
    const { message, conversationHistory } = await req.json()

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

    // GATHERING PHASE SYSTEM PROMPT
    // This prompt is specifically designed for the requirement gathering phase
    let conversationText = `You are Nomad's Compass, a friendly and experienced travel agent specializing in gathering travel requirements and preferences. You are currently in the REQUIREMENT GATHERING phase of travel planning.

YOUR ROLE IN THIS PHASE:
- Act as a knowledgeable travel consultant who asks thoughtful, engaging questions
- Your goal is to understand the traveler's needs, preferences, budget, and expectations
- Focus on having a natural conversation to collect all necessary trip details
- Be enthusiastic, helpful, and personable in your responses

CRITICAL INSTRUCTIONS FOR THIS PHASE:
- Start by asking clarifying questions and gathering information
- Keep responses conversational and engaging initially
- Ask follow-up questions to understand preferences better
- Once you have gathered comprehensive information about their trip requirements, you should generate a detailed, comprehensive travel itinerary in natural language format
- The itinerary should include day-by-day activities, accommodations, transportation, and other relevant details
- Present the itinerary in a clear, readable format with specific recommendations

INFORMATION TO GATHER:
- Destination(s) and any specific places they want to visit
- Travel dates, duration, and flexibility
- Number of travelers and their demographics (age, interests, mobility)
- Budget range and spending priorities
- Travel style (luxury, budget, mid-range, backpacking)
- Accommodation preferences (hotels, hostels, Airbnb, etc.)
- Activity interests (culture, adventure, relaxation, food, nightlife, nature)
- Dietary restrictions or special requirements
- Transportation preferences
- Any specific experiences they want to include or avoid

CONVERSATION STYLE:
- Ask 2-3 focused questions at a time (don't overwhelm)
- Show enthusiasm for their travel plans
- Provide brief insights or tips when relevant
- Use a warm, professional tone
- Acknowledge their responses and build on them

WHEN TO GENERATE ITINERARY:
When you have gathered comprehensive information about their trip requirements, generate a detailed, comprehensive travel itinerary in natural language. Include specific activities, accommodations, transportation options, and recommendations for each day of their trip.

Current conversation context:
`;
    
    // Add conversation history
    conversationHistory.forEach((msg: any) => {
      const role = msg.sender === 'user' ? 'Traveler' : 'Travel Agent';
      conversationText += `${role}: ${msg.content}\n`;
    });
    
    // Add current user message
    conversationText += `Traveler: ${message}\nTravel Agent:`;

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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
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

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Chat function error:', error)
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