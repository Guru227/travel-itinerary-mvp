import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import ChatSidebar from '../components/ChatSidebar';
import ItineraryPanel from '../components/ItineraryPanel';
import AuthModal from '../components/AuthModal';
import { supabase } from '../lib/supabase';
import { AuthService } from '../lib/auth';
import { User as UserType, ChatSession, Message, ItineraryData } from '../types';
import { useItineraryProcessor } from '../hooks/useItineraryProcessor';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionParam = searchParams.get('session');

  const [user, setUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionParam);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);

  // Use the itinerary processor hook
  const {
    isProcessing: isConverting,
    error: processingError,
    processItinerary,
    clearError: clearProcessingError
  } = useItineraryProcessor(
    // onScheduleUpdate
    (schedule) => {
      console.log('Schedule updated:', schedule);
    },
    // onChecklistUpdate  
    (checklist) => {
      console.log('Checklist updated:', checklist);
    },
    // onMapUpdate
    (mapPins) => {
      console.log('Map pins updated:', mapPins);
    },
    // onMetadataUpdate
    (metadata) => {
      console.log('Metadata updated:', metadata);
    }
  );

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  useEffect(() => {
    if (currentSessionId && user) {
      loadMessages(currentSessionId);
      loadExistingItinerary(currentSessionId);
    }
  }, [currentSessionId, user]);

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

  const loadSessions = async () => {
    if (!user) return;

    try {
      const { data: sessionsData, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (sessionsData.length === 0) {
        await createNewSession();
      } else {
        setSessions(sessionsData);
        if (!currentSessionId || !sessionsData.find(s => s.id === currentSessionId)) {
          setCurrentSessionId(sessionsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
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

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setItineraryData(null);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentSessionId || !user) return;

    try {
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

      const formattedUserMessage: Message = {
        id: userMessage.id,
        session_id: userMessage.session_id,
        content: userMessage.content,
        sender: 'user',
        created_at: userMessage.created_at
      };
      setMessages(prev => [...prev, formattedUserMessage]);
      setIsLoading(true);

      try {
        const conversationHistory = messages;
        
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
          if (data.error === 'quota_exceeded') {
            const quotaErrorMessage: Message = {
              id: Date.now().toString(),
              session_id: currentSessionId,
              content: "I apologize, but I'm currently experiencing high demand and have reached my usage limits. This is a temporary issue that should resolve soon. Please try again in a few minutes!",
              sender: 'ai',
              created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, quotaErrorMessage]);
            return;
          }
          throw new Error(data.message || data.error);
        }

        const aiContent = data.response;
        
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
          session_id: aiMessage.session_id,
          content: aiMessage.content,
          sender: 'ai',
          created_at: aiMessage.created_at
        };
        setMessages(prev => [...prev, formattedAiMessage]);
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          session_id: currentSessionId,
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment!",
          sender: 'ai',
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const convertItinerary = async () => {
    if (!currentSessionId || messages.length === 0) {
      alert('No conversation available to convert');
      return;
    }

    // Get the latest AI message that contains itinerary information
    const aiMessages = messages.filter(m => m.sender === 'ai');
    const latestItinerary = aiMessages[aiMessages.length - 1]?.content || '';

    if (!latestItinerary.trim()) {
      alert('No itinerary content found to convert');
      return;
    }

    // Clear any previous processing errors
    clearProcessingError();

    // Process the itinerary using the new processor
    const result = await processItinerary(latestItinerary);
    
    if (result) {
      // Convert the structured data to the format expected by ItineraryPanel
      const convertedData: ItineraryData = {
        title: result.tripTitle,
        summary: result.summary,
        destination: result.destination,
        duration: result.duration,
        number_of_travelers: result.numberOfTravelers,
        daily_schedule: result.schedule.map(item => {
          // Combine all time periods into a single activities array for backward compatibility
          const allActivities = [
            ...item.morning.map(activity => ({ ...activity, period: 'Morning' })),
            ...item.afternoon.map(activity => ({ ...activity, period: 'Afternoon' })),
            ...item.evening.map(activity => ({ ...activity, period: 'Evening' }))
          ];

          return {
            day: item.day,
            date: item.date,
            morning: item.morning.map(activity => ({
              time: activity.time,
              title: activity.activity,
              description: activity.description,
              location: activity.location,
              cost: activity.estimatedCost
            })),
            afternoon: item.afternoon.map(activity => ({
              time: activity.time,
              title: activity.activity,
              description: activity.description,
              location: activity.location,
              cost: activity.estimatedCost
            })),
            evening: item.evening.map(activity => ({
              time: activity.time,
              title: activity.activity,
              description: activity.description,
              location: activity.location,
              cost: activity.estimatedCost
            }))
          };
        }),
        checklist: result.checklist.map(category => ({
          category: category.category,
          items: category.items.map(item => item.task)
        })),
        map_locations: result.mapPins.map(pin => ({
          name: pin.name,
          address: pin.address,
          lat: pin.lat,
          lng: pin.lng,
          type: pin.type as 'accommodation' | 'restaurant' | 'attraction' | 'transport'
        }))
      };

      setItineraryData(convertedData);
    } else if (processingError) {
      alert(`Failed to convert itinerary: ${processingError}`);
    }
  };

  const regenerateSchedule = async () => {
    if (!currentSessionId || messages.length === 0) {
      alert('No conversation available to regenerate');
      return;
    }

    // Get the latest AI message that contains itinerary information
    const aiMessages = messages.filter(m => m.sender === 'ai');
    const latestItinerary = aiMessages[aiMessages.length - 1]?.content || '';

    if (!latestItinerary.trim()) {
      alert('No itinerary content found to regenerate');
      return;
    }

    // Clear existing itinerary data before regenerating
    setItineraryData(null);

    // Clear any previous processing errors
    clearProcessingError();

    // Process the itinerary again using the same processor as convert
    const result = await processItinerary(latestItinerary);
    
    if (result) {
      // Convert the structured data to the format expected by ItineraryPanel (same as convertItinerary)
      const convertedData: ItineraryData = {
        title: result.tripTitle,
        summary: result.summary,
        destination: result.destination,
        duration: result.duration,
        number_of_travelers: result.numberOfTravelers,
        daily_schedule: result.schedule.map(item => {
          return {
            day: item.day,
            date: item.date,
            morning: item.morning.map(activity => ({
              time: activity.time,
              title: activity.activity,
              description: activity.description,
              location: activity.location,
              cost: activity.estimatedCost
            })),
            afternoon: item.afternoon.map(activity => ({
              time: activity.time,
              title: activity.activity,
              description: activity.description,
              location: activity.location,
              cost: activity.estimatedCost
            })),
            evening: item.evening.map(activity => ({
              time: activity.time,
              title: activity.activity,
              description: activity.description,
              location: activity.location,
              cost: activity.estimatedCost
            }))
          };
        }),
        checklist: result.checklist.map(category => ({
          category: category.category,
          items: category.items.map(item => item.task)
        })),
        map_locations: result.mapPins.map(pin => ({
          name: pin.name,
          address: pin.address,
          lat: pin.lat,
          lng: pin.lng,
          type: pin.type as 'accommodation' | 'restaurant' | 'attraction' | 'transport'
        }))
      };

      setItineraryData(convertedData);
      
      // Save the regenerated itinerary to the database
      try {
        // Delete existing itinerary for this session first
        await supabase
          .from('itineraries')
          .delete()
          .eq('session_id', currentSessionId);

        // Insert the new regenerated itinerary
        await supabase
          .from('itineraries')
          .insert([{
            title: convertedData.title,
            session_id: currentSessionId,
            is_public: false,
            content: convertedData
          }]);
      } catch (error) {
        console.error('Error saving regenerated itinerary:', error);
      }
    } else if (processingError) {
      alert(`Failed to regenerate schedule: ${processingError}`);
    }
  };

  const renameSession = async (sessionId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title: newTitle })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle }
          : session
      ));
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      // Delete the chat session (messages and itineraries will be cascade deleted)
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // Remove from local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));

      // If we deleted the current session, switch to another one or create new
      if (sessionId === currentSessionId) {
        const remainingSessions = sessions.filter(session => session.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          // No sessions left, create a new one
          await createNewSession();
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete chat session. Please try again.');
    }
  };

  // Updated "Save Itinerary" functionality - Now saves AND shares simultaneously
  const saveAndShareItinerary = async () => {
    if (!currentSessionId || !itineraryData) return;

    try {
      // Save the itinerary with is_public set to true (no user_id needed - determined by session)
      const { error } = await supabase
        .from('itineraries')
        .upsert([{
          title: itineraryData.title,
          session_id: currentSessionId,
          is_public: true, // Automatically make public when saving
          content: itineraryData
        }]);

      if (error) throw error;
      alert('Itinerary saved and shared to community successfully!');
    } catch (error) {
      console.error('Error saving and sharing itinerary:', error);
      alert('Failed to save and share itinerary. Please try again.');
    }
  };

  // Remove separate share function since save now does both

  const mailItinerary = async () => {
    if (!itineraryData || !user) return;
    
    // This would integrate with an email service
    alert(`Itinerary would be sent to ${user.email} (Email service integration needed)`);
  };

  const signOut = () => {
    AuthService.signOut();
    navigate('/');
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
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 mt-16">
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Sidebar */}
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={setCurrentSessionId}
          onNewSession={createNewSession}
          onRenameSession={renameSession}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          <ChatWindow 
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
          />
        </div>

        {/* Itinerary Panel */}
        <div className="w-96 border-l border-gray-200">
          <ItineraryPanel
            itineraryData={itineraryData}
            isConverting={isConverting}
            onConvert={convertItinerary}
            onRegenerate={regenerateSchedule}
            onSave={saveAndShareItinerary}
            onShare={saveAndShareItinerary} // Both buttons now do the same action
            onMail={mailItinerary}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;