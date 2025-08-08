/*
  # Add chat sessions support

  1. New Tables
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `title` (text) - Session title (auto-generated or user-provided)
      - `created_at` (timestamptz) - When the session was created
      - `updated_at` (timestamptz) - Last activity timestamp
      - `is_saved` (boolean) - Whether the session has been explicitly saved
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to chat_sessions)
      - `content` (text) - Message content
      - `sender` (text) - 'user' or 'ai'
      - `created_at` (timestamptz) - Message timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous public access
    - Add indexes for performance

  3. Changes
    - Keep existing itineraries table for backward compatibility
    - Add relationship between sessions and saved itineraries
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT 'New Travel Plan',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_saved boolean DEFAULT false
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'ai')),
  created_at timestamptz DEFAULT now()
);

-- Add session_id to existing itineraries table for linking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itineraries' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE itineraries ADD COLUMN session_id uuid REFERENCES chat_sessions(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_sessions
CREATE POLICY "Anyone can read chat sessions"
  ON chat_sessions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert chat sessions"
  ON chat_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO anon
  USING (true);

-- Policies for chat_messages
CREATE POLICY "Anyone can read chat messages"
  ON chat_messages
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert chat messages"
  ON chat_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (session_id, created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions 
  SET updated_at = now() 
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update session timestamp when messages are added
DROP TRIGGER IF EXISTS trigger_update_session_timestamp ON chat_messages;
CREATE TRIGGER trigger_update_session_timestamp
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_timestamp();