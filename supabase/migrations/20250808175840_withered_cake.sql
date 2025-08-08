/*
  # Create itineraries table for AI travel planner

  1. New Tables
    - `itineraries`
      - `id` (uuid, primary key)
      - `title` (text) - User-provided name for the itinerary
      - `content` (jsonb) - Complete chat conversation history
      - `created_at` (timestamptz) - When the itinerary was saved

  2. Security
    - Enable RLS on `itineraries` table
    - Add policy for public read access (anonymous app)
    - Add policy for public insert access (anonymous app)

  3. Notes
    - This is an anonymous application, so we allow public access
    - The content field stores the entire chat conversation as JSON
    - Created timestamp is automatically set on insert
*/

CREATE TABLE IF NOT EXISTS itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- Allow public read access since this is an anonymous app
CREATE POLICY "Anyone can read itineraries"
  ON itineraries
  FOR SELECT
  TO anon
  USING (true);

-- Allow public insert access for saving itineraries
CREATE POLICY "Anyone can insert itineraries"
  ON itineraries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create an index on created_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON itineraries(created_at DESC);

-- Create an index on title for potential search functionality
CREATE INDEX IF NOT EXISTS idx_itineraries_title ON itineraries USING gin(to_tsvector('english', title));