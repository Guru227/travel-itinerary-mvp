/*
  # Add user_id column to itineraries table

  1. Changes
    - Add `user_id` column to `itineraries` table
    - Set up foreign key constraint to `auth.users(id)`
    - Update existing records to have null user_id (will be populated by app logic)

  2. Security
    - Maintains existing RLS policies
    - Foreign key ensures data integrity
*/

-- Add user_id column to itineraries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itineraries' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE itineraries ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;