import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string;
          title: string | null;
          created_at: string | null;
          updated_at: string | null;
          is_saved: boolean | null;
        };
        Insert: {
          id?: string;
          title?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_saved?: boolean | null;
        };
        Update: {
          id?: string;
          title?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_saved?: boolean | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          content: string;
          sender: string;
          nickname: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          content: string;
          sender: string;
          nickname?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          content?: string;
          sender?: string;
          nickname?: string | null;
          created_at?: string | null;
        };
      };
      itineraries: {
        Row: {
          id: string;
          title: string;
          content: any;
          created_at: string | null;
          session_id: string | null;
          user_id: string | null;
          is_public: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          content: any;
          created_at?: string | null;
          session_id?: string | null;
          user_id?: string | null;
          is_public?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          content?: any;
          created_at?: string | null;
          session_id?: string | null;
          user_id?: string | null;
          is_public?: boolean;
        };
      };
    };
  };
};