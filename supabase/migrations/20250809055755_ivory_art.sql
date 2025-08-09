/*
  # Add is_public column to itineraries table

  1. Changes
    - Add `is_public` column to `itineraries` table with boolean type
    - Set default value to false for existing records
    - Update RLS policies to handle public itineraries

  2. Security
    - Maintain existing RLS policies
    - Add policy for public itinerary access
*/

-- Add is_public column to itineraries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itineraries' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE itineraries ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END $$;

-- Update existing records to have is_public = false if not already set
UPDATE itineraries SET is_public = false WHERE is_public IS NULL;

-- Make the column NOT NULL now that all records have a value
ALTER TABLE itineraries ALTER COLUMN is_public SET NOT NULL;

-- Create index for better performance on public itinerary queries
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itineraries_title ON itineraries USING gin (to_tsvector('english', title));

-- Add RLS policy for public itinerary access (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itineraries' AND policyname = 'Anyone can read public itineraries'
  ) THEN
    CREATE POLICY "Anyone can read public itineraries"
      ON itineraries
      FOR SELECT
      TO anon
      USING (is_public = true);
  END IF;
END $$;

-- Add RLS policy for general itinerary access (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itineraries' AND policyname = 'Anyone can read itineraries'
  ) THEN
    CREATE POLICY "Anyone can read itineraries"
      ON itineraries
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Add RLS policy for inserting itineraries (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itineraries' AND policyname = 'Anyone can insert itineraries'
  ) THEN
    CREATE POLICY "Anyone can insert itineraries"
      ON itineraries
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;