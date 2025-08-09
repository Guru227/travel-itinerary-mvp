export interface User {
  id: string;
  email: string;
  nickname?: string | null;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  summary?: string;
  number_of_travelers?: number;
  created_at: string;
  updated_at: string;
  phase?: 'building'; // SIMPLIFIED: Only building phase now
}

export interface Itinerary {
  id: string;
  session_id: string;
  is_public: boolean;
  content: ItineraryData | null;
  created_at: string;
  chat_sessions?: {
    title: string;
    summary?: string;
    number_of_travelers?: number;
    users?: {
      nickname?: string | null;
      email: string;
    };
  };
}

export interface ItineraryData {
  title: string;
  summary: string;
  destination: string;
  duration: string;
  number_of_travelers: number;
  daily_schedule: DaySchedule[];
  checklist: ChecklistItem[];
  map_locations: MapLocation[];
}

export interface DaySchedule {
  day: number;
  date: string;
  activities: Activity[];
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  location?: string;
  cost?: string;
}

export interface ChecklistItem {
  category: string;
  items: {
    task: string;
    completed: boolean;
    priority?: 'low' | 'medium' | 'high';
  }[];
}

export interface MapLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'accommodation' | 'restaurant' | 'attraction' | 'transport';
}

export interface Message {
  id: string;
  session_id: string;
  content: string;
  sender: 'user' | 'ai';
  created_at: string;
}

// New types for the living itinerary system
export interface AIResponse {
  action: 'ADD_ITEM' | 'UPDATE_ITEM' | 'REMOVE_ITEM' | 'ADD_PREFERENCE' | 'REMOVE_PREFERENCE' | 'REQUEST_CLARIFICATION' | 'UPDATE_METADATA';
  target_view: 'schedule' | 'checklist' | 'map' | 'preferences';
  item_data?: any;
  conversational_text: string;
  preference_tags?: string[];
  clarification_prompt?: string;
}

export interface PreferenceTag {
  id: string;
  label: string;
  category: 'budget' | 'cuisine' | 'pace' | 'interests' | 'accommodation' | 'transport';
  removable: boolean;
}

export interface ItineraryItem {
  id: string;
  type: 'activity' | 'accommodation' | 'transport' | 'meal' | 'checklist_item';
  status: 'confirmed' | 'suggested' | 'placeholder';
  data: any;
  day?: number;
  time?: string;
  created_at: string;
}

export interface ContextualBubble {
  id: string;
  text: string;
  position: { x: number; y: number };
  targetItemId: string;
  visible: boolean;
  created_at: string;
}