import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import LivingItineraryCanvas from '../components/LivingItineraryCanvas';
import AuthModal from '../components/AuthModal';
import { supabase } from '../lib/supabase';
import { AuthService } from '../lib/auth';
import { User as UserType, ChatSession, Message, ItineraryData, AIResponse } from '../types';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionParam = searchParams.get('session');

  const [user, setUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionParam);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      initializeSession();
    }
  }, [user]);

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
        await loadExistingItinerary(currentSessionId);
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

  const loadExistingItinerary = async (sessionId: string) => {
    try {
      const { data: itinerariesData, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading existing itinerary:', error);
        return;
      }

      if (itinerariesData && itinerariesData.length > 0 && itinerariesData[0].content) {
        const existingItinerary = itinerariesData[0];
        console.log('Found existing itinerary for session:', sessionId);
        setItineraryData(existingItinerary.content);
      }
    } catch (error) {
      console.error('Error loading existing itinerary:', error);
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
          content: "Hello! I'm Nomad's Compass, your AI travel planning assistant. I'm here to help you create the perfect adventure. Where would you like to explore?",
          sender: 'ai'
        };

        const { data: newMessage, error: insertError } = await supabase
          .from('chat_messages')
          .insert([welcomeMessage])
          .select()
          .single();

        if (insertError) throw insertError;

        setMessages([{
          id: newMessage.id,
          session_id: newMessage.session_id,
          content: newMessage.content,
          sender: newMessage.sender as 'user' | 'ai',
          created_at: newMessage.created_at
        }]);
      } else {
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([{
        id: '1',
        session_id: sessionId,
        content: "Hello! I'm Nomad's Compass, your AI travel planning assistant. I'm here to help you create the perfect adventure. Where would you like to explore?",
        sender: 'ai',
        created_at: new Date().toISOString(),
      }]);
    }
  };

  const createNewSession = async () => {
    if (!user) return;

    try {
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: user.id,
          title: 'New Travel Plan'
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(newSession.id);
      setItineraryData(null);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const sendMessage = async (content: string): Promise<AIResponse> => {
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
        .select();

      if (userError) throw userError;

      setIsLoading(true);

      try {
        // Call the new living-chat edge function
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
            return {
              action: 'REQUEST_CLARIFICATION',
              target_view: 'schedule',
              conversational_text: "I apologize, but I'm currently experiencing high demand and have reached my usage limits. This is a temporary issue that should resolve soon. Please try again in a few minutes!"
            };
          }
          throw new Error(data.message || data.error);
        }

        const aiResponse: AIResponse = data.response;
        
        // Save AI response to database
        const { data: aiMessage, error: aiError } = await supabase
          .from('chat_messages')
          .insert([{
            session_id: currentSessionId,
            content: aiResponse.conversational_text,
            sender: 'ai'
          }])
          .select();

        if (aiError) throw aiError;

        return aiResponse;
        
      } catch (error) {
        console.error('Error getting AI response:', error);
        return {
          action: 'REQUEST_CLARIFICATION',
          target_view: 'schedule',
          conversational_text: "I apologize, but I'm having trouble connecting right now. Please try again in a moment!"
        };
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
              <p className="text-sm text-gray-500 font-lato">AI Travel Assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Living Itinerary Canvas */}
      <div className="flex-1 overflow-hidden">
        <LivingItineraryCanvas
          itineraryData={itineraryData}
          sessionId={currentSessionId || ''}
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatPage;