import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatHistoryPanel from '../components/ChatHistoryPanel';
import ChatInput from '../components/ChatInput';
import LivingItineraryCanvas from '../components/LivingItineraryCanvas';
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
  }, [user, sessionParam, isLoadingSessions]);

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
        // FIXED: Ensure state update triggers re-render
        setItineraryData(existingItinerary.content);
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
        // SIMPLIFIED: Start directly with itinerary building prompt
        const welcomeMessage = {
          session_id: sessionId,
          content: "Hello! I'm Nomad's Compass, your AI travel planning assistant. I'm ready to help you build your perfect itinerary. Tell me about your travel plans - where would you like to go, when, and what kind of experience are you looking for?",
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
        content: "Hello! I'm Nomad's Compass, your AI travel planning assistant. I'm ready to help you build your perfect itinerary. Tell me about your travel plans - where would you like to go, when, and what kind of experience are you looking for?",
        sender: 'ai' as const,
        created_at: new Date().toISOString(),
      };
      setMessages([fallbackMessage]);
      setLatestAiMessage(fallbackMessage.content);
    }
  };

  const createNewSession = async () => {
    if (!user) return;

    if (isLoadingSessions) return; // Prevent duplicate calls
    
    setIsLoadingSessions(true);
    
    try {
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: user.id,
          title: 'New Travel Plan',
          phase: 'building',
          is_saved: false
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(newSession.id);
      setItineraryData(null);
      setMessages([]);
      setLatestAiMessage('');
      
      // Load initial welcome message
      await loadMessages(newSession.id);
    } catch (error) {
      console.error('Error creating new session:', error);
      // Don't leave the user in a broken state
      setIsLoadingSessions(false);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    if (sessionId === currentSessionId) return; // Don't reload same session
    
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
        // SIMPLIFIED: Always use living-chat function for structured responses
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/living-chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: content, 
            sessionId: currentSessionId, 
            currentItinerary: itineraryData 
          }),
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

        // Handle structured response
        const structuredResponse = data.response as AIResponse;
        const aiResponseText = structuredResponse.conversational_text;
        
        // FIXED: Handle itinerary updates with immutable state updates
        if (structuredResponse.action === 'GENERATE_ITINERARY' && structuredResponse.itinerary_data) {
          console.log('Updating itinerary data:', structuredResponse.itinerary_data);
          // Create a new object to ensure React detects the state change
          setItineraryData({ ...structuredResponse.itinerary_data });
          
          // Save the itinerary to the database
          await supabase
            .from('itineraries')
            .upsert([{
              session_id: currentSessionId,
              title: structuredResponse.itinerary_data.title || 'Travel Itinerary',
              content: structuredResponse.itinerary_data,
              is_public: false
            }], {
              onConflict: 'session_id'
            });

        
        // FIXED: Handle other itinerary modification actions with immutable updates
        if (structuredResponse.action === 'ADD_ITEM' || 
            structuredResponse.action === 'UPDATE_ITEM' || 
            structuredResponse.action === 'REMOVE_ITEM') {
          if (structuredResponse.itinerary_data) {
            console.log('Updating itinerary with modification:', structuredResponse.action);
            // Create a new object to ensure React detects the state change
            setItineraryData(prevData => ({
              ...prevData,
              ...structuredResponse.itinerary_data
            }));
            
            // Save the updated itinerary to the database
            await supabase
              .from('itineraries')
              .upsert([{
                session_id: currentSessionId,
                title: structuredResponse.itinerary_data.title || itineraryData?.title || 'Travel Itinerary',
                content: { ...itineraryData, ...structuredResponse.itinerary_data },
                is_public: false
              }], {
                onConflict: 'session_id'
              });
          }
        }
          // Update the session with metadata
          await supabase
            .from('chat_sessions')
            .update({
              title: structuredResponse.itinerary_data.title || 'Travel Itinerary',
              summary: structuredResponse.itinerary_data.summary,
              number_of_travelers: structuredResponse.itinerary_data.number_of_travelers
            })
            .eq('id', currentSessionId);
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

  // SIMPLIFIED: Always render the living itinerary layout
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
          {/* Living Itinerary Canvas - FIXED: Pass correct props */}
          <div className="flex-1 overflow-hidden">
            <LivingItineraryCanvas
              itineraryData={itineraryData}
              latestAiMessage={latestAiMessage}
              onSendMessage={sendMessage}
              isLoading={isLoading}
            />
          </div>
          
          {/* FIXED: Single persistent chat input at bottom */}
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