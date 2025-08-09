import React, { useState, useEffect, useRef } from 'react';
import { Calendar, CheckSquare, Map, Send, X, Plus } from 'lucide-react';
import { ItineraryData, PreferenceTag, ItineraryItem, ContextualBubble, AIResponse } from '../types';
import ScheduleView from './ScheduleView';
import ChecklistView from './ChecklistView';
import MapView from './MapView';
import PreferenceTags from './PreferenceTags';
import ContextualBubbles from './ContextualBubbles';

interface LivingItineraryCanvasProps {
  itineraryData: ItineraryData | null;
  sessionId: string;
  onSendMessage: (message: string) => Promise<AIResponse>;
  isLoading: boolean;
}

const LivingItineraryCanvas: React.FC<LivingItineraryCanvasProps> = ({
  itineraryData,
  sessionId,
  onSendMessage,
  isLoading
}) => {
  const [activeView, setActiveView] = useState<'schedule' | 'checklist' | 'map'>('schedule');
  const [inputValue, setInputValue] = useState('');
  const [preferences, setPreferences] = useState<PreferenceTag[]>([]);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [contextualBubbles, setContextualBubbles] = useState<ContextualBubble[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize itinerary items from data
  useEffect(() => {
    if (itineraryData) {
      console.log('Processing itinerary data:', itineraryData);
      const items: ItineraryItem[] = [];
      
      // Convert schedule items
      itineraryData.daily_schedule?.forEach((day) => {
        console.log('Processing day:', day);
        day.activities.forEach((activity, index) => {
          console.log('Processing activity:', activity);
          items.push({
            id: `schedule_${day.day}_${index}`,
            type: 'activity',
            status: 'confirmed',
            data: {
              title: activity.title,
              description: activity.description,
              location: activity.location,
              cost: activity.cost,
              day: day.day,
              date: day.date
            },
            day: day.day,
            time: activity.time,
            created_at: new Date().toISOString()
          });
        });
      });

      // Convert checklist items
      itineraryData.checklist?.forEach((category, catIndex) => {
        category.items.forEach((checklistItem, itemIndex) => {
          items.push({
            id: `checklist_${catIndex}_${itemIndex}`,
            type: 'checklist_item',
            status: 'confirmed',
            data: {
              task: checklistItem.task,
              category: category.category,
              completed: checklistItem.completed,
              priority: checklistItem.priority
            },
            created_at: new Date().toISOString()
          });
        });
      });

      console.log('Final processed items:', items);
      setItineraryItems(items);
    }
  }, [itineraryData]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || isProcessing) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await onSendMessage(message);
      await processAIResponse(response);
    } catch (error) {
      console.error('Error processing message:', error);
      // Show error bubble
      addContextualBubble(
        "I'm having trouble processing that request. Please try again.",
        { x: 50, y: 50 },
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const processAIResponse = async (response: AIResponse) => {
    const { action, target_view, item_data, conversational_text, preference_tags } = response;

    // Handle preference tags
    if (preference_tags) {
      const newTags: PreferenceTag[] = preference_tags.map((tag, index) => ({
        id: `pref_${Date.now()}_${index}`,
        label: tag,
        category: 'interests', // Default category
        removable: true
      }));
      setPreferences(prev => [...prev, ...newTags]);
    }

    // Handle different actions
    switch (action) {
      case 'ADD_ITEM':
        await handleAddItem(item_data, target_view, conversational_text);
        break;
      case 'UPDATE_ITEM':
        await handleUpdateItem(item_data, conversational_text);
        break;
      case 'REMOVE_ITEM':
        await handleRemoveItem(item_data, conversational_text);
        break;
      case 'REQUEST_CLARIFICATION':
        await handleClarificationRequest(item_data, conversational_text);
        break;
      default:
        // Show general response bubble
        addContextualBubble(conversational_text, { x: 50, y: 50 }, 'general');
    }

    // Switch to target view if specified
    if (target_view && target_view !== activeView) {
      setActiveView(target_view);
    }
  };

  const handleAddItem = async (itemData: any, targetView: string, text: string) => {
    const newItem: ItineraryItem = {
      id: `item_${Date.now()}`,
      type: targetView === 'schedule' ? 'activity' : 'checklist_item',
      status: 'suggested',
      data: itemData,
      day: itemData.day,
      time: itemData.time,
      created_at: new Date().toISOString()
    };

    // Add item with animation
    setItineraryItems(prev => [...prev, newItem]);

    // Add contextual bubble near the new item
    setTimeout(() => {
      const itemElement = document.getElementById(`item-${newItem.id}`);
      if (itemElement) {
        const rect = itemElement.getBoundingClientRect();
        addContextualBubble(text, { x: rect.right + 10, y: rect.top }, newItem.id);
      } else {
        addContextualBubble(text, { x: 50, y: 50 }, newItem.id);
      }
    }, 300); // Wait for animation to start

    // Auto-confirm after a delay
    setTimeout(() => {
      setItineraryItems(prev => 
        prev.map(item => 
          item.id === newItem.id 
            ? { ...item, status: 'confirmed' }
            : item
        )
      );
    }, 2000);
  };

  const handleUpdateItem = async (itemData: any, text: string) => {
    const { id, ...updates } = itemData;
    
    setItineraryItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, data: { ...item.data, ...updates }, status: 'suggested' }
          : item
      )
    );

    addContextualBubble(text, { x: 50, y: 50 }, id);

    // Auto-confirm after delay
    setTimeout(() => {
      setItineraryItems(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, status: 'confirmed' }
            : item
        )
      );
    }, 2000);
  };

  const handleRemoveItem = async (itemData: any, text: string) => {
    const { id } = itemData;
    
    // Mark for removal with animation
    setItineraryItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, status: 'placeholder' }
          : item
      )
    );

    addContextualBubble(text, { x: 50, y: 50 }, id);

    // Actually remove after animation
    setTimeout(() => {
      setItineraryItems(prev => prev.filter(item => item.id !== id));
    }, 500);
  };

  const handleClarificationRequest = async (itemData: any, text: string) => {
    // Add placeholder item
    const placeholderItem: ItineraryItem = {
      id: `placeholder_${Date.now()}`,
      type: 'activity',
      status: 'placeholder',
      data: {
        title: 'Something fun...',
        description: 'What kind of activity would you like?',
        ...itemData
      },
      day: itemData.day,
      created_at: new Date().toISOString()
    };

    setItineraryItems(prev => [...prev, placeholderItem]);
    addContextualBubble(text, { x: 50, y: 50 }, placeholderItem.id);
  };

  const addContextualBubble = (text: string, position: { x: number; y: number }, targetId: string) => {
    const bubble: ContextualBubble = {
      id: `bubble_${Date.now()}`,
      text,
      position,
      targetItemId: targetId,
      visible: true,
      created_at: new Date().toISOString()
    };

    setContextualBubbles(prev => [...prev, bubble]);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setContextualBubbles(prev => 
        prev.map(b => 
          b.id === bubble.id 
            ? { ...b, visible: false }
            : b
        )
      );
    }, 5000);

    // Remove after fade animation
    setTimeout(() => {
      setContextualBubbles(prev => prev.filter(b => b.id !== bubble.id));
    }, 6000);
  };

  const handleRemovePreference = (preferenceId: string) => {
    const preference = preferences.find(p => p.id === preferenceId);
    if (!preference) return;

    setPreferences(prev => prev.filter(p => p.id !== preferenceId));
    
    // Send message to AI about removed preference
    const message = `I want to remove the "${preference.label}" preference from my trip planning.`;
    handleSubmit({ preventDefault: () => {}, target: { value: message } } as any);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'map', label: 'Map', icon: Map },
  ];

  const isEmpty = itineraryItems.length === 0;

  return (
    <div className="h-screen bg-surface flex flex-col relative" ref={canvasRef}>
      {/* Preference Tags */}
      <PreferenceTags 
        preferences={preferences}
        onRemovePreference={handleRemovePreference}
      />

      {/* View Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-lato font-semibold transition-all duration-200 ${
                  activeView === tab.id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-secondary hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto relative">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Plus className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-poppins font-bold text-2xl text-secondary mb-4">
                Ready to Plan Your Adventure?
              </h2>
              <p className="font-lato text-gray-600 mb-6">
                Tell me about your dream trip and I'll start building your personalized itinerary right here. 
                Try something like "Plan a 5-day trip to Tokyo for 2 people" or "Add a romantic dinner to day 3".
              </p>
              <div className="bg-beige/50 rounded-lg p-4 border-2 border-dashed border-primary/30">
                <p className="font-lato text-sm text-gray-500 italic">
                  Your itinerary will appear here as we chat...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeView === 'schedule' && (
              <ScheduleView 
                items={itineraryItems.filter(item => item.type === 'activity')}
                onItemClick={(item) => console.log('Item clicked:', item)}
              />
            )}
            {activeView === 'checklist' && (
              <ChecklistView 
                items={itineraryItems.filter(item => item.type === 'checklist_item')}
                onItemToggle={(itemId, completed) => {
                  setItineraryItems(prev => 
                    prev.map(item => 
                      item.id === itemId 
                        ? { ...item, data: { ...item.data, completed } }
                        : item
                    )
                  );
                }}
              />
            )}
            {activeView === 'map' && (
              <MapView 
                items={itineraryItems}
                itineraryData={itineraryData}
              />
            )}
          </>
        )}
      </div>

      {/* Contextual Bubbles */}
      <ContextualBubbles bubbles={contextualBubbles} />

    </div>
  );
};

export default LivingItineraryCanvas;