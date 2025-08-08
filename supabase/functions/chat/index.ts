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

    // Prepare the conversation context for Gemini
    let conversationText = `You are Nomad's Compass, an expert AI travel planning assistant. You help users create personalized travel itineraries, suggest destinations, recommend accommodations, activities, restaurants, and provide cultural insights. You are knowledgeable about destinations worldwide, budget optimization, and creating detailed day-by-day schedules. Always be helpful, enthusiastic, and provide practical, actionable travel advice. Keep responses conversational and engaging while being informative.\n\n`;
    
    // Add conversation history
    conversationHistory.forEach((msg: any) => {
      const role = msg.sender === 'user' ? 'User' : 'Assistant';
      conversationText += `${role}: ${msg.content}\n`;
    });
    
    // Add current user message
    conversationText += `User: ${message}\nAssistant:`;

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
          temperature: 0.7,
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