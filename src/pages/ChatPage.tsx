import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatHistoryPanel from '../components/ChatHistoryPanel';
import ChatInput from '../components/ChatInput';
import LivingItineraryCanvas from '../components/LivingItineraryCanvas';
import ConversationStrip from '../components/ConversationStrip';
import AuthModal from '../components/AuthModal';
import { supabase } from '../lib/supabase';
import { AuthService } from '../lib/auth';
import { User as UserType, ChatSession, Message, ItineraryData, AIResponse } from '../types';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionParam = searchParams.get('session');

  const [user, setUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionParam);
  const [currentPhase, setCurrentPhase] = useState<'gathering' | 'building'>('gathering');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestAiMessage, setLatestAiMessage] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      initializeSession();
    }
  }, [user, sessionParam]);

  useEffect(() => {
    if (currentSessionId && currentSessionId !== sessionParam) {
      setSearchParams({ session: currentSessionId });
    }
  }, [currentSessionId, sessionParam, setSearchParams]);

  const checkAuth = async () => {
    const currentUser = await AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuth = (authenticatedUser: UserType) => {
    setUser(authenticatedUser);
    setShowAuthModal(false);
  };

  const initializeSession = async () => {
    if (!user) return;

    try {
      if (currentSessionId) {
        // Load existing session
        await loadExistingSession(currentSessionId);
      } else {
        // Create new session
        await createNewSession();
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      await createNewSession();
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadExistingSession = async (sessionId: string) => {
    try {
      // Load session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Set phase from session data
      setCurrentPhase(sessionData.phase || 'gathering');

      // Load existing itinerary
      const { data: itinerariesData, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (itineraryError && itineraryError.code !== 'PGRST116') {
        console.error('Error loading existing itinerary:', itineraryError);
      }

      if (itinerariesData && itinerariesData.length > 0 && itinerariesData[0].content) {
        const existingItinerary = itinerariesData[0];
        console.log('Found existing itinerary for session:', sessionId);
        setItineraryData(existingItinerary.content);
        // If we have an itinerary, we should be in building phase
        if (currentPhase === 'gathering') {
          setCurrentPhase('building');
          await updateSessionPhase(sessionId, 'building');
        }
      }

      // Load messages
      await loadMessages(sessionId);
    } catch (error) {
      console.error('Error loading existing session:', error);
      throw error;
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (messagesData.length === 0) {
        const welcomeMessage = {
          session_id: sessionId,
          content: "Hello! I'm Nomad's Compass, your AI travel planning assistant. I'm here to help you create the perfect adventure. Let's start by getting to know your travel preferences. Where would you like to explore, and what kind of experience are you looking for?",
          sender: 'ai'
        };

        const { data: newMessage, error: insertError } = await supabase
          .from('chat_messages')
          .insert([welcomeMessage])
          .select()
          .single();

        if (insertError) throw insertError;

        const message = {
          id: newMessage.id,
          session_id: newMessage.session_id,
          content: newMessage.content,
          sender: newMessage.sender as 'user' | 'ai',
          created_at: newMessage.created_at
        };

        setMessages([message]);
        setLatestAiMessage(message.content);
      } else {
        setMessages(messagesData);
        // Set the latest AI message
        const lastAiMessage = messagesData.filter(m => m.sender === 'ai').pop();
        if (lastAiMessage) {
          setLatestAiMessage(lastAiMessage.content);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      const fallbackMessage = {
        id: '1',
        session_id: sessionId,
        content: "Hello! I'm Nomad's Compass, your AI travel planning assistant. I'm here to help you create the perfect adventure. Let's start by getting to know your travel preferences. Where would you like to explore, and what kind of experience are you looking for?",
        sender: 'ai' as const,
        created_at: new Date().toISOString(),
      };
      setMessages([fallbackMessage]);
      setLatestAiMessage(fallbackMessage.content);
    }
  };

  const createNewSession = async () => {
    if (!user) return;

    try {
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: user.id,
          title: 'New Travel Plan',
          phase: 'gathering'
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(newSession.id);
      setCurrentPhase('gathering');
      setItineraryData(null);
      setMessages([]);
      setLatestAiMessage('');
      
      // Load initial welcome message
      await loadMessages(newSession.id);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const updateSessionPhase = async (sessionId: string, phase: 'gathering' | 'building') => {
    try {
      await supabase
        .from('chat_sessions')
        .update({ phase })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating session phase:', error);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setItineraryData(null);
    setMessages([]);
    setLatestAiMessage('');
    loadExistingSession(sessionId);
  };

  const sendMessage = async (content: string): Promise<void> => {
    if (!currentSessionId || !user) {
      throw new Error('No active session');
    }

    try {
      // Save user message to database
      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: currentSessionId,
          content,
          sender: 'user'
        }])
        .select()
        .single();

      if (userError) throw userError;

      // Add user message to local state
      const newUserMessage: Message = {
        id: userMessage.id,
        session_id: userMessage.session_id,
        content: userMessage.content,
        sender: 'user',
        created_at: userMessage.created_at
      };
      setMessages(prev => [...prev, newUserMessage]);

      setIsLoading(true);

      try {
        // Get conversation history for context
        const conversationHistory = messages.map(msg => ({
          sender: msg.sender,
          content: msg.content
        }));

        // Call the appropriate chat edge function based on phase
        const functionName = currentPhase === 'gathering' ? 'chat' : 'living-chat';
        const requestBody = currentPhase === 'gathering' 
          ? { message: content, conversationHistory }
          : { message: content, sessionId: currentSessionId, currentItinerary: itineraryData };

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          if (data.error === 'quota_exceeded') {
            throw new Error("I apologize, but I'm currently experiencing high demand and have reached my usage limits. This is a temporary issue that should resolve soon. Please try again in a few minutes!");
          }
          throw new Error(data.message || data.error);
        }

        let aiResponseText: string;

        if (currentPhase === 'gathering') {
          aiResponseText = data.response;
          
          // Check if the response contains itinerary data and try to convert it
          if (aiResponseText.length > 200 && (
            aiResponseText.toLowerCase().includes('itinerary') ||
            aiResponseText.toLowerCase().includes('day 1') ||
            aiResponseText.toLowerCase().includes('schedule') ||
            aiResponseText.toLowerCase().includes('trip')
          )) {
            const itinerary = await tryConvertToItinerary(aiResponseText);
            if (itinerary) {
              // Transition to building phase
              setCurrentPhase('building');
              await updateSessionPhase(currentSessionId, 'building');
              setItineraryData(itinerary);
            }
          }
        } else {
          // Building phase - handle structured response
          const structuredResponse = data.response as AIResponse;
          aiResponseText = structuredResponse.conversational_text;
          
          // Handle the structured action (this would be implemented based on your action system)
          // For now, we'll just use the conversational text
        }
        
        // Save AI response to database
        const { data: aiMessage, error: aiError } = await supabase
          .from('chat_messages')
          .insert([{
            session_id: currentSessionId,
            content: aiResponseText,
            sender: 'ai'
          }])
          .select()
          .single();

        if (aiError) throw aiError;

        // Add AI message to local state
        const newAiMessage: Message = {
          id: aiMessage.id,
          session_id: aiMessage.session_id,
          content: aiMessage.content,
          sender: 'ai',
          created_at: aiMessage.created_at
        };
        setMessages(prev => [...prev, newAiMessage]);
        setLatestAiMessage(aiResponseText);
        
      } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Add error message to chat
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          session_id: currentSessionId,
          content: error instanceof Error ? error.message : "I apologize, but I'm having trouble connecting right now. Please try again in a moment!",
          sender: 'ai',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
        setLatestAiMessage(errorMessage.content);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const tryConvertToItinerary = async (itineraryText: string): Promise<ItineraryData | null> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/convert-itinerary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itineraryText
        }),
      });

      if (!response.ok) {
        console.error('Failed to convert itinerary:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('Error converting itinerary:', data.error);
        return null;
      }

      const convertedItinerary = data.itinerary;
      console.log('Successfully converted itinerary:', convertedItinerary);
      
      // Save the itinerary to the database
      const { data: savedItinerary, error: saveError } = await supabase
        .from('itineraries')
        .insert([{
          session_id: currentSessionId,
          title: convertedItinerary.tripTitle || 'Travel Itinerary',
          content: convertedItinerary,
          is_public: false
        }])
        .select()
        .single();

      if (saveError) {
        console.error('Error saving itinerary:', saveError);
        return null;
      }

      // Update the session with metadata
      await supabase
        .from('chat_sessions')
        .update({
          title: convertedItinerary.tripTitle || 'Travel Itinerary',
          summary: convertedItinerary.summary,
          number_of_travelers: convertedItinerary.numberOfTravelers
        })
        .eq('id', currentSessionId);

      return convertedItinerary;
      
    } catch (error) {
      console.error('Error in tryConvertToItinerary:', error);
      return null;
    }
  };

  if (showAuthModal) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => navigate('/')}
        onAuth={handleAuth}
      />
    );
  }

  if (isLoadingSessions) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-poppins font-bold text-sm">N</span>
          </div>
          <p className="font-lato text-gray-600">Loading your travel plans...</p>
        </div>
      </div>
    );
  }

  // Render different layouts based on phase
  if (currentPhase === 'gathering') {
    // Phase 1: Full-screen chat layout
    return (
      <div className="h-screen bg-surface flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0 mt-16">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-secondary" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20">
                <img 
                  src="/images/nomad.png" 
                  alt="Nomad's Compass Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-secondary">Nomad's Compass</h1>
                <p className="text-sm text-gray-500 font-lato">Let's plan your perfect trip</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Two Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Chat History */}
          <ChatHistoryPanel
            isCollapsed={isHistoryCollapsed}
            onToggleCollapse={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            currentSessionId={currentSessionId}
            onSessionSelect={handleSessionSelect}
            onNewSession={createNewSession}
            userId={user?.id || ''}
          />

          {/* Right Panel - Full Chat View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20">
                        <img 
                          src="/images/nomad.png" 
                          alt="Nomad's Compass Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <h2 className="font-poppins font-bold text-2xl text-secondary mb-4">
                      Ready to Plan Your Adventure?
                    </h2>
                    <p className="font-lato text-gray-600 mb-6">
                      Tell me about your dream trip and I'll help you create the perfect itinerary. 
                      Try something like "Plan a 5-day trip to Tokyo for 2 people" or "I want to visit Paris on a budget".
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.sender === 'ai' && (
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                          <img 
                            src="/images/nomad.png" 
                            alt="Nomad's Compass Avatar" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div
                        className={`max-w-3xl px-4 py-3 rounded-lg font-lato leading-relaxed ${
                          message.sender === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-white border border-gray-200 text-secondary'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className={`text-xs mt-2 ${
                          message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {message.sender === 'user' && (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-poppins font-bold text-sm">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                        <img 
                          src="/images/nomad.png" 
                          alt="Nomad's Compass Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <ChatInput
              onSendMessage={sendMessage}
              isLoading={isLoading}
              placeholder="Tell me about your dream trip..."
              disabled={!currentSessionId}
            />
          </div>
        </div>
      </div>
    );
  }

  // Phase 2: Living itinerary layout
  return (
    <div className="h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0 mt-16">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20">
              <img 
                src="/images/nomad.png" 
                alt="Nomad's Compass Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-poppins font-bold text-secondary">Nomad's Compass</h1>
              <p className="text-sm text-gray-500 font-lato">Building your itinerary</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Two Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat History */}
        <ChatHistoryPanel
          isCollapsed={isHistoryCollapsed}
          onToggleCollapse={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={createNewSession}
          userId={user?.id || ''}
        />

        {/* Right Panel - Living Itinerary Layout */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Conversation Strip */}
          <ConversationStrip
            latestAiMessage={latestAiMessage}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            placeholder="Tell me what you'd like to add or change..."
            disabled={!currentSessionId}
          />
          
          {/* Living Itinerary Canvas */}
          <div className="flex-1 overflow-hidden">
            <LivingItineraryCanvas
              itineraryData={itineraryData}
              onSendMessage={sendMessage}
              isLoading={isLoading}
            />
          </div>
          
          {/* Persistent Chat Input */}
          <ChatInput
            onSendMessage={sendMessage}
            isLoading={isLoading}
            placeholder="Add, remove, or modify your itinerary..."
            disabled={!currentSessionId}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;