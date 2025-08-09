import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Calendar, CheckSquare, Map, Users, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Itinerary } from '../types';
import { AuthService } from '../lib/auth';

const SharedItineraryPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'checklist' | 'map'>('schedule');
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSharedItinerary(sessionId);
    }
  }, [sessionId]);

  const loadSharedItinerary = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('itineraries')
        .select(`
          *,
          chat_sessions!inner (
            title,
            summary,
            number_of_travelers,
            users!inner (
              nickname,
              email
            )
          )
        `)
        .eq('session_id', sessionId)
        .eq('is_public', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('This itinerary is not publicly shared or does not exist.');
        } else {
          throw error;
        }
        return;
      }

      setItinerary(data);
    } catch (error) {
      console.error('Error loading shared itinerary:', error);
      setError('Failed to load the shared itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClone = async () => {
    const userId = AuthService.getCurrentUserId();
    if (!userId) {
      alert('Please sign in to clone this itinerary');
      return;
    }

    if (!itinerary?.content) return;

    setIsCloning(true);
    try {
      // Create new chat session
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: userId,
          title: `${itinerary.content.title} (Cloned)`,
          summary: itinerary.content.summary,
          number_of_travelers: itinerary.content.number_of_travelers
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create initial message with the itinerary context
      const contextMessage = `I'd like to use this itinerary as a starting point: ${itinerary.content.title}\n\nDestination: ${itinerary.content.destination}\nDuration: ${itinerary.content.duration}\nTravelers: ${itinerary.content.number_of_travelers}\n\nPlease help me customize this plan or make any changes I need.`;

      await supabase
        .from('chat_messages')
        .insert([{
          session_id: newSession.id,
          content: contextMessage,
          sender: 'user'
        }]);

      // Redirect to chat with the new session
      navigate(`/chat?session=${newSession.id}`);
    } catch (error) {
      console.error('Error cloning itinerary:', error);
      alert('Failed to clone itinerary. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'map', label: 'Map', icon: Map },
  ];

  const renderSchedule = () => {
    if (!itinerary?.content?.daily_schedule) return null;

    return (
      <div className="space-y-6">
        {itinerary.content.daily_schedule.map((day) => (
          <div key={day.day} className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-poppins font-bold text-lg text-secondary mb-4">
              Day {day.day} - {day.date}
            </h3>
            
            {/* Morning Activities */}
            {day.morning && day.morning.length > 0 && (
              <div className="mb-4">
                <h4 className="font-poppins font-semibold text-md text-secondary mb-2 flex items-center gap-2">
                  🌅 Morning
                </h4>
                <div className="space-y-2 ml-4">
                  {day.morning.map((activity, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <div className="text-yellow-600 font-lato font-semibold text-sm min-w-[60px]">
                        {activity.time}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-lato font-semibold text-secondary">
                          {activity.title}
                        </h5>
                        <p className="text-gray-600 font-lato text-sm mt-1">
                          {activity.description}
                        </p>
                        {activity.location && (
                          <p className="text-gray-500 font-lato text-xs mt-1">
                            📍 {activity.location}
                          </p>
                        )}
                        {activity.cost && (
                          <p className="text-yellow-600 font-lato text-xs mt-1">
                            💰 {activity.cost}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Afternoon Activities */}
            {day.afternoon && day.afternoon.length > 0 && (
              <div className="mb-4">
                <h4 className="font-poppins font-semibold text-md text-secondary mb-2 flex items-center gap-2">
                  ☀️ Afternoon
                </h4>
                <div className="space-y-2 ml-4">
                  {day.afternoon.map((activity, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <div className="text-orange-600 font-lato font-semibold text-sm min-w-[60px]">
                        {activity.time}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-lato font-semibold text-secondary">
                          {activity.title}
                        </h5>
                        <p className="text-gray-600 font-lato text-sm mt-1">
                          {activity.description}
                        </p>
                        {activity.location && (
                          <p className="text-gray-500 font-lato text-xs mt-1">
                            📍 {activity.location}
                          </p>
                        )}
                        {activity.cost && (
                          <p className="text-orange-600 font-lato text-xs mt-1">
                            💰 {activity.cost}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evening Activities */}
            {day.evening && day.evening.length > 0 && (
              <div className="mb-4">
                <h4 className="font-poppins font-semibold text-md text-secondary mb-2 flex items-center gap-2">
                  🌙 Evening
                </h4>
                <div className="space-y-2 ml-4">
                  {day.evening.map((activity, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
                      <div className="text-indigo-600 font-lato font-semibold text-sm min-w-[60px]">
                        {activity.time}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-lato font-semibold text-secondary">
                          {activity.title}
                        </h5>
                        <p className="text-gray-600 font-lato text-sm mt-1">
                          {activity.description}
                        </p>
                        {activity.location && (
                          <p className="text-gray-500 font-lato text-xs mt-1">
                            📍 {activity.location}
                          </p>
                        )}
                        {activity.cost && (
                          <p className="text-indigo-600 font-lato text-xs mt-1">
                            💰 {activity.cost}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderChecklist = () => {
    if (!itinerary?.content?.checklist) return null;

    return (
      <div className="space-y-6">
        {itinerary.content.checklist.map((category, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-poppins font-bold text-lg text-secondary mb-3">
              {category.category}
            </h3>
            <div className="space-y-2">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-3">
                  <div className="w-4 h-4 border border-gray-300 rounded"></div>
                  <span className="font-lato text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMap = () => {
    if (!itinerary?.content?.map_locations) return null;

    return (
      <div className="space-y-4">
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Map className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="font-lato text-gray-600">
            Interactive map view coming soon
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-poppins font-bold text-lg text-secondary mb-3">
            Key Locations
          </h3>
          <div className="space-y-2">
            {itinerary.content.map_locations.map((location, index) => (
              <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div>
                  <p className="font-lato font-semibold text-secondary">{location.name}</p>
                  <p className="font-lato text-sm text-gray-600">{location.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getAuthorName = () => {
    if (itinerary?.chat_sessions?.users?.nickname) {
      return itinerary.chat_sessions.users.nickname;
    }
    if (itinerary?.chat_sessions?.users?.email) {
      return itinerary.chat_sessions.users.email.split('@')[0];
    }
    return 'Anonymous';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-poppins font-bold text-sm">N</span>
          </div>
          <p className="font-lato text-gray-600">Loading shared itinerary...</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h1 className="font-poppins font-bold text-xl text-secondary mb-2">
            Itinerary Not Found
          </h1>
          <p className="font-lato text-gray-600 mb-6">
            {error || 'The shared itinerary you\'re looking for doesn\'t exist or is no longer available.'}
          </p>
          <Link
            to="/community"
            className="bg-primary hover:bg-primary/90 text-white font-poppins font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Browse Community Itineraries
          </Link>
        </div>
      </div>
    );
  }

  const data = itinerary.content;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/community" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-secondary" />
            </Link>
            <div className="flex-1">
              <h1 className="font-poppins font-bold text-2xl text-secondary">
                {data.title}
              </h1>
              <p className="font-lato text-gray-600 mt-1">
                Shared by {getAuthorName()}
              </p>
            </div>
            <button
              onClick={handleClone}
              disabled={isCloning}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white font-poppins font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              {isCloning ? 'Cloning...' : 'Clone & Customize'}
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="font-lato text-gray-700 mb-3">{data.summary}</p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="font-lato">{data.destination}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="font-lato">{data.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="font-lato">{data.number_of_travelers} travelers</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 font-lato font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-secondary'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'schedule' && renderSchedule()}
        {activeTab === 'checklist' && renderChecklist()}
        {activeTab === 'map' && renderMap()}
      </div>
    </div>
  );
};

export default SharedItineraryPage;