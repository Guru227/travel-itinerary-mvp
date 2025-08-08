import React, { useState } from 'react';
import { useEffect } from 'react';
import { ArrowLeft, Bookmark, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import SaveModal from '../components/SaveModal';
import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  is_saved: boolean;
}

const ChatPage: React.FC = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([
  ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Load sessions and messages on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  // Load all chat sessions from database
  const loadSessions = async () => {
    try {
      const { data: sessionsData, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedSessions: ChatSession[] = sessionsData.map(session => ({
        id: session.id,
        title: session.title || 'New Travel Plan',
        created_at: new Date(session.created_at || ''),
        updated_at: new Date(session.updated_at || ''),
        is_saved: session.is_saved || false
      }));

      if (formattedSessions.length === 0) {
        // Create initial session if none exist
        await createNewSession();
      } else {
        setSessions(formattedSessions);
        setCurrentSessionId(formattedSessions[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      // Fallback to creating a new session
      await createNewSession();
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Load messages for a specific session
  const loadMessages = async (sessionId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = messagesData.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender as 'user' | 'ai',
        timestamp: new Date(msg.created_at || '')
      }));

      // If no messages exist, add the welcome message
      if (formattedMessages.length === 0) {
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
          content: newMessage.content,
          sender: newMessage.sender as 'user' | 'ai',
          timestamp: new Date(newMessage.created_at || '')
        }]);
      } else {
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to welcome message
      setMessages([{
        id: '1',
        content: "Hello! I'm Nomad's Compass, your AI travel planning assistant. I'm here to help you create the perfect adventure. Where would you like to explore?",
        sender: 'ai',
        timestamp: new Date(),
      }]);
    }
  };

  // Create a new chat session
  const createNewSession = async () => {
    try {
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert([{
          title: 'New Travel Plan',
          is_saved: false
        }])
        .select()
        .single();

      if (error) throw error;

      const formattedSession: ChatSession = {
        id: newSession.id,
        title: newSession.title || 'New Travel Plan',
        created_at: new Date(newSession.created_at || ''),
        updated_at: new Date(newSession.updated_at || ''),
        is_saved: newSession.is_saved || false
      };

      setSessions(prev => [formattedSession, ...prev]);
      setCurrentSessionId(formattedSession.id);
      setMessages([]); // Clear messages, they will be loaded by useEffect
    } catch (error) {
      console.error('Error creating new session:', error);
      // Fallback to local state
      const fallbackSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Travel Plan',
        created_at: new Date(),
        updated_at: new Date(),
        is_saved: false
      };
      setSessions(prev => [fallbackSession, ...prev]);
      setCurrentSessionId(fallbackSession.id);
    }
  };

  // Send a message and get AI response
  const sendMessage = async (content: string) => {
    try {
      // Insert user message
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

      // Add user message to UI immediately
      const formattedUserMessage: Message = {
        id: userMessage.id,
        content: userMessage.content,
        sender: 'user',
        timestamp: new Date(userMessage.created_at || '')
      };
      setMessages(prev => [...prev, formattedUserMessage]);
      setIsLoading(true);

      // Get AI response from edge function
      try {
        // Prepare conversation history for context
        const conversationHistory = messages.filter(msg => msg.sender !== 'user' || msg.id !== userMessage.id);
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            conversationHistory: conversationHistory
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          // Handle specific error types
          if (data.error === 'quota_exceeded') {
            const quotaErrorMessage: Message = {
              id: Date.now().toString(),
              content: "I apologize, but I'm currently experiencing high demand and have reached my usage limits. This is a temporary issue that should resolve soon. Please try again in a few minutes, or feel free to continue planning your trip and I'll assist you once service is restored!",
              sender: 'ai',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, quotaErrorMessage]);
            return;
          }
          throw new Error(data.message || data.error);
        }

        const aiContent = data.response;
        
        // Save AI response to database
        const { data: aiMessage, error: aiError } = await supabase
          .from('chat_messages')
          .insert([{
            session_id: currentSessionId,
            content: aiContent,
            sender: 'ai'
          }])
          .select()
          .single();

        if (aiError) throw aiError;

        const formattedAiMessage: Message = {
          id: aiMessage.id,
          content: aiMessage.content,
          sender: 'ai',
          timestamp: new Date(aiMessage.created_at || '')
        };
        setMessages(prev => [...prev, formattedAiMessage]);
      } catch (error) {
        console.error('Error getting AI response:', error);
        // Fallback to error message
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment. In the meantime, I'd be happy to help you plan your travel adventure once the connection is restored!",
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      // Fallback to local state
      const fallbackUserMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackUserMessage]);
    }
  };

  // Save itinerary to database
  const saveItinerary = async (title: string) => {
    try {
      // Update session as saved
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .update({ 
          title, 
          is_saved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);

      if (sessionError) throw sessionError;

      // Save complete itinerary
      const { error: itineraryError } = await supabase
        .from('itineraries')
        .insert([{
          title,
          content: messages,
          session_id: currentSessionId
        }]);

      if (itineraryError) throw itineraryError;

      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, title, is_saved: true }
          : session
      ));
      
      setShowSaveModal(false);
      console.log('Itinerary saved successfully!');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      // Still close modal and update local state as fallback
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, title, is_saved: true }
          : session
      ));
      setShowSaveModal(false);
    }
  };

  // Switch to a different session
  const switchToSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

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
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-poppins font-bold text-sm">N</span>
            </div>
            <div>
              <h1 className="font-poppins font-bold text-secondary">Nomad's Compass</h1>
              <p className="text-sm text-gray-500 font-lato">AI Travel Assistant</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={createNewSession}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-secondary" />
            <span className="hidden sm:inline font-lato text-sm text-secondary">New Chat</span>
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={messages.length <= 1}
          >
            <Bookmark className="w-5 h-5 text-secondary" />
          </button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden lg:block w-80 bg-white border-r border-gray-200 p-6">
          <div className="space-y-6">
            {/* Current Session Info */}
            <div>
              <h2 className="font-poppins font-bold text-secondary text-lg mb-4">
                Travel Planning
              </h2>
              <div className="space-y-2">
                <div className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                  <h3 className="font-poppins font-semibold text-secondary">
                    {sessions.find(s => s.id === currentSessionId)?.title || 'Current Session'}
                  </h3>
                  <p className="text-sm text-gray-600 font-lato">
                    {sessions.find(s => s.id === currentSessionId)?.is_saved ? 'Saved itinerary' : 'Planning your adventure'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Recent Sessions */}
            {sessions.length > 1 && (
              <div>
                <h3 className="font-poppins font-semibold text-secondary mb-3">Recent Sessions</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sessions.slice(1, 6).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => switchToSession(session.id)}
                      className={`w-full p-2 text-left rounded-lg transition-colors ${
                        session.id === currentSessionId 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-lato text-sm text-secondary truncate">
                          {session.title}
                        </span>
                        {session.is_saved && (
                          <Bookmark className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-lato">
                        {session.updated_at.toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick Prompts */}
            <div className="space-y-3">
              <h3 className="font-poppins font-semibold text-secondary">Quick Prompts</h3>
              <div className="space-y-2">
                {[
                  "Plan a 7-day trip to Japan",
                  "Budget backpacking in Europe",
                  "Family vacation ideas",
                  "Romantic getaway destinations"
                ].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(prompt)}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-lato text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1">
          <ChatWindow 
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
          />
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <SaveModal
          onSave={saveItinerary}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;