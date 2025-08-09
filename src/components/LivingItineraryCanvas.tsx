import React, { useState } from 'react';
import { Calendar, CheckSquare, Map } from 'lucide-react';
import { ItineraryData, ItineraryItem, PreferenceTag } from '../types';
import ScheduleView from './ScheduleView';
import ChecklistView from './ChecklistView';
import MapView from './MapView';
import ConversationStrip from './ConversationStrip';
import PreferenceTags from './PreferenceTags';

interface LivingItineraryCanvasProps {
  itineraryData: ItineraryData | null;
  latestAiMessage?: string;
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

const LivingItineraryCanvas: React.FC<LivingItineraryCanvasProps> = ({
  itineraryData,
  latestAiMessage,
  onSendMessage,
  isLoading
}) => {
  const [activeView, setActiveView] = useState<'schedule' | 'checklist' | 'map'>('schedule');

  // ADDED: Check if we're in the pre-generation state (no itinerary data yet)
  const isPreGeneration = !itineraryData;

  // FIXED: Proper null safety and data transformation
  const transformToItems = (): ItineraryItem[] => {
    if (!itineraryData) return [];
    
    const items: ItineraryItem[] = [];

    // Transform daily_schedule with proper null checks
    if (itineraryData.daily_schedule && Array.isArray(itineraryData.daily_schedule)) {
      itineraryData.daily_schedule.forEach((day, dayIndex) => {
        if (!day) return; // Skip null/undefined days
        
        const dayNumber = day.day || dayIndex + 1;
        
        if (day.activities && Array.isArray(day.activities)) {
          day.activities.forEach((activity, activityIndex) => {
            if (!activity) return; // Skip null/undefined activities
            
            items.push({
              id: `day-${dayNumber}-activity-${activityIndex}`,
              type: 'activity',
              day: dayNumber,
              time: activity.time || '',
              status: 'confirmed',
              data: {
                title: activity.title || 'Activity',
                description: activity.description || '',
                location: activity.location || '',
                cost: activity.cost || '',
                date: day.date || ''
              },
              created_at: new Date().toISOString()
            });
          });
        }
      });
    }

    // Transform checklist items with proper null checks
    if (itineraryData.checklist && Array.isArray(itineraryData.checklist)) {
      itineraryData.checklist.forEach((category, categoryIndex) => {
        if (!category) return; // Skip null/undefined categories
        
        if (category.items && Array.isArray(category.items)) {
          category.items.forEach((item, itemIndex) => {
            if (!item) return; // Skip null/undefined items
            
            items.push({
              id: `checklist-${categoryIndex}-${itemIndex}`,
              type: 'checklist_item',
              status: (typeof item === 'object' && item.completed) ? 'confirmed' : 'suggested',
              data: {
                task: typeof item === 'string' ? item : item.task || 'Checklist Item',
                completed: typeof item === 'object' ? item.completed || false : false,
                category: category.category || 'General',
                priority: typeof item === 'object' ? item.priority : undefined
              },
              created_at: new Date().toISOString()
            });
          });
        }
      });
    }

    return items;
  };

  const items = transformToItems();
  const scheduleItems = items.filter(item => item.type === 'activity');
  const checklistItems = items.filter(item => item.type === 'checklist_item');

  const handleItemClick = (item: ItineraryItem) => {
    console.log('Item clicked:', item);
  };

  const handleItemToggle = (itemId: string, completed: boolean) => {
    // Handle checklist item toggle
    console.log('Item toggled:', itemId, completed);
  };

  // FIXED: Mock preferences for now
  const mockPreferences: PreferenceTag[] = [];

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar, count: scheduleItems.length },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, count: checklistItems.length },
    { id: 'map', label: 'Map', icon: Map }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* FIXED: Only include ConversationStrip, no duplicate input */}
      <ConversationStrip
        latestAiMessage={latestAiMessage || ''}
      />

      {/* Preference Tags - Only show if we have preferences */}
      {mockPreferences.length > 0 && (
        <PreferenceTags
          preferences={mockPreferences}
          onRemovePreference={(preferenceId) => {
            console.log('Remove preference:', preferenceId);
          }}
        />
      )}

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

      {/* View Content - FIXED: Proper data flow */}
      <div className="flex-1 overflow-auto">
        {/* ADDED: Conditional rendering - show placeholder during pre-generation phase */}
        {isPreGeneration ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-poppins font-bold text-xl text-secondary mb-3">
                Getting Ready to Plan
              </h3>
              <p className="font-lato text-gray-600 leading-relaxed">
                Your itinerary will be generated here once the initial details are gathered.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* EXISTING: Render actual itinerary views when data is available */}
            {activeView === 'schedule' && (
              <ScheduleView
                items={scheduleItems}
                onItemClick={handleItemClick}
              />
            )}
            
            {activeView === 'checklist' && (
              <ChecklistView
                items={checklistItems}
                onItemToggle={handleItemToggle}
              />
            )}
            
            {activeView === 'map' && (
              <MapView
                items={scheduleItems}
                itineraryData={itineraryData}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LivingItineraryCanvas;