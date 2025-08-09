import React, { useState } from 'react';
import { X, Copy, Calendar, CheckSquare, Map } from 'lucide-react';
import { Itinerary } from '../types';
import { AuthService } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface ItineraryPreviewModalProps {
  itinerary: Itinerary;
  onClose: () => void;
}

const ItineraryPreviewModal: React.FC<ItineraryPreviewModalProps> = ({ itinerary, onClose }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'checklist' | 'map'>('schedule');
  const [isCloning, setIsCloning] = useState(false);

  const data = itinerary.content;

  const handleClone = async () => {
    const userId = AuthService.getCurrentUserId();
    if (!userId) {
      alert('Please sign in to clone this itinerary');
      return;
    }

    setIsCloning(true);
    try {
      // Create new chat session
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: userId,
          title: `${data.title} (Cloned)`,
          summary: data.summary,
          number_of_travelers: data.number_of_travelers
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create initial message with the itinerary context
      const contextMessage = `I'd like to use this itinerary as a starting point: ${data.title}\n\nDestination: ${data.destination}\nDuration: ${data.duration}\nTravelers: ${data.number_of_travelers}\n\nPlease help me customize this plan or make any changes I need.`;

      await supabase
        .from('chat_messages')
        .insert([{
          session_id: newSession.id,
          content: contextMessage,
          sender: 'user'
        }]);

      // Redirect to chat with the new session
      window.location.href = `/chat?session=${newSession.id}`;
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

  const renderSchedule = () => (
    <div className="space-y-4">
      {data.daily_schedule?.map((day) => (
        <div key={day.day} className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-poppins font-bold text-secondary mb-2">
            Day {day.day} - {day.date}
          </h4>
          
          {/* Morning Activities */}
          {day.morning && day.morning.length > 0 && (
            <div className="mb-3">
              <h5 className="font-lato font-semibold text-sm text-gray-700 mb-1">🌅 Morning</h5>
              <div className="space-y-1 ml-4">
                {day.morning.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-yellow-600 font-lato font-semibold text-sm min-w-[60px]">
                      {activity.time}
                    </span>
                    <div>
                      <p className="font-lato font-semibold text-secondary">{activity.title}</p>
                      <p className="font-lato text-sm text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Afternoon Activities */}
          {day.afternoon && day.afternoon.length > 0 && (
            <div className="mb-3">
              <h5 className="font-lato font-semibold text-sm text-gray-700 mb-1">☀️ Afternoon</h5>
              <div className="space-y-1 ml-4">
                {day.afternoon.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-orange-600 font-lato font-semibold text-sm min-w-[60px]">
                      {activity.time}
                    </span>
                    <div>
                      <p className="font-lato font-semibold text-secondary">{activity.title}</p>
                      <p className="font-lato text-sm text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evening Activities */}
          {day.evening && day.evening.length > 0 && (
            <div className="mb-3">
              <h5 className="font-lato font-semibold text-sm text-gray-700 mb-1">🌙 Evening</h5>
              <div className="space-y-1 ml-4">
                {day.evening.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-indigo-600 font-lato font-semibold text-sm min-w-[60px]">
                      {activity.time}
                    </span>
                    <div>
                      <p className="font-lato font-semibold text-secondary">{activity.title}</p>
                      <p className="font-lato text-sm text-gray-600">{activity.description}</p>
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

  const renderChecklist = () => (
    <div className="space-y-4">
      {data.checklist?.map((category, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-poppins font-bold text-secondary mb-2">{category.category}</h4>
          <div className="space-y-1">
            {category.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-center gap-2">
                <div className="w-4 h-4 border border-gray-300 rounded"></div>
                <span className="font-lato text-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMap = () => (
    <div className="bg-gray-50 rounded-lg p-8 text-center">
      <Map className="w-12 h-12 text-gray-400 mx-auto mb-2" />
      <p className="font-lato text-gray-600">Map view not available in preview</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-poppins font-bold text-2xl text-secondary mb-2">
                {data.title}
              </h2>
              <p className="font-lato text-gray-600 mb-4">{data.summary}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>📍 {data.destination}</span>
                <span>📅 {data.duration}</span>
                <span>👥 {data.number_of_travelers} travelers</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClone}
                disabled={isCloning}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white font-poppins font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                {isCloning ? 'Cloning...' : 'Clone Itinerary'}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'schedule' && renderSchedule()}
          {activeTab === 'checklist' && renderChecklist()}
          {activeTab === 'map' && renderMap()}
        </div>
      </div>
    </div>
  );
};

export default ItineraryPreviewModal;