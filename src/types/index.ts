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
}

export interface Itinerary {
  id: string;
  session_id: string;
  user_id: string | null;
  is_public: boolean;
  content: ItineraryData | null;
  created_at: string;
  users?: {
    nickname?: string | null;
    email: string;
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
  items: string[];
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