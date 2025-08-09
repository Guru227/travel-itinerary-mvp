import React, { useState } from 'react';
import { Calendar, CheckSquare, Map } from 'lucide-react';
import { ItineraryData, ItineraryItem } from '../types';
import ScheduleView from './ScheduleView';
import ChecklistView from './ChecklistView';
import MapView from './MapView';
import ConversationStrip from './ConversationStrip';
import PreferenceTags from './PreferenceTags';

interface LivingItineraryCanvasProps {
  itineraryData: ItineraryData | null;
  lastAiMessage?: string;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const LivingItineraryCanvas: React.FC<LivingItineraryCanvasProps> = ({
  itineraryData,
  lastAiMessage,
  onSendMessage,
  isLoading
}) => {
  // Handle null itineraryData
  if (!itineraryData) {
    return (
      <div className="flex flex-col h-full">
        <ConversationStrip
          lastAiMessage={lastAiMessage}
          onSendMessage={onSendMessage}
          isLoading={isLoading}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Waiting for itinerary data...</p>
          </div>
        </div>
      </div>
    );
  }

  const [activeView, setActiveView] = useState<'schedule' | 'checklist' | 'map'>('schedule');

  // Transform itineraryData into ItineraryItem[] format
  const transformToItems = (): ItineraryItem[] => {
    const items: ItineraryItem[] = [];

    // Transform daily_schedule
    if (itineraryData.daily_schedule) {
      itineraryData.daily_schedule.forEach((day, dayIndex) => {
        const dayNumber = day.day || dayIndex + 1;
        
        if (day.activities) {
          day.activities.forEach((activity, activityIndex) => {
            items.push({
              id: `day-${dayNumber}-activity-${activityIndex}`,
              type: 'activity',
              day: dayNumber,
              time: activity.time || '',
              status: 'confirmed',
              data: {
                title: activity.title || 'Activity',
                description: activity.description,
                location: activity.location,
                cost: activity.cost,
                date: day.date
              }
            });
          });
        }
      });
    }

    // Transform checklist items
    if (itineraryData.checklist) {
      itineraryData.checklist.forEach((item, index) => {
        items.push({
          id: `checklist-${index}`,
          type: 'checklist',
          status: item.completed ? 'completed' : 'pending',
          data: {
            title: item.task || 'Checklist Item',
            description: item.description,
            category: item.category
          }
        });
      });
    }

    return items;
  };

  const items = transformToItems();
  const scheduleItems = items.filter(item => item.type === 'activity');
  const checklistItems = items.filter(item => item.type === 'checklist');

  const handleItemClick = (item: ItineraryItem) => {
    // Handle item click - could open a modal or send a message
    console.log('Item clicked:', item);
  };

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar, count: scheduleItems.length },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, count: checklistItems.length },
    { id: 'map', label: 'Map', icon: Map }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Conversation Strip */}
      <ConversationStrip
        lastAiMessage={lastAiMessage}
        onSendMessage={onSendMessage}
        isLoading={isLoading}
      />

      {/* Preference Tags */}
      <div className="px-6 py-4 border-b border-gray-200">
        <PreferenceTags
          preferences={itineraryData.preferences || []}
          onPreferenceClick={(preference) => {
            onSendMessage(`Tell me more about ${preference}`);
          }}
        />
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as 'schedule' | 'checklist' | 'map')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-poppins">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-auto">
        {activeView === 'schedule' && (
          <ScheduleView
            items={scheduleItems}
            onItemClick={handleItemClick}
          />
        )}
        
        {activeView === 'checklist' && (
          <ChecklistView
            items={checklistItems}
            onItemClick={handleItemClick}
          />
        )}
        
        {activeView === 'map' && (
          <MapView
            items={scheduleItems}
            onItemClick={handleItemClick}
          />
        )}
      </div>
    </div>
  );
};

export default LivingItineraryCanvas;