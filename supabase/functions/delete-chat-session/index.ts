const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteSessionRequest {
  sessionId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId }: DeleteSessionRequest = await req.json()

    if (!sessionId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing sessionId',
          details: 'sessionId is required to delete a chat session'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Get Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing Supabase configuration'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Import Supabase client
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Perform cascading delete in the correct order
    // 1. Delete chat messages (child records)
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)

    if (messagesError) {
      console.error('Error deleting chat messages:', messagesError)
      throw new Error(`Failed to delete chat messages: ${messagesError.message}`)
    }

    // 2. Delete itineraries (child records)
    const { error: itinerariesError } = await supabase
      .from('itineraries')
      .delete()
      .eq('session_id', sessionId)

    if (itinerariesError) {
      console.error('Error deleting itineraries:', itinerariesError)
      throw new Error(`Failed to delete itineraries: ${itinerariesError.message}`)
    }

    // 3. Delete the chat session (parent record)
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)

    if (sessionError) {
      console.error('Error deleting chat session:', sessionError)
      throw new Error(`Failed to delete chat session: ${sessionError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Chat session and all associated data deleted successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Delete chat session function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete chat session',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})