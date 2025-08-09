/*
  # Add phase column to chat_sessions table

  1. Changes
    - Add `phase` column to `chat_sessions` table
    - Set default value to 'gathering' for new sessions
    - Update existing sessions to have 'gathering' phase by default

  2. Security
    - No RLS changes needed as existing policies will cover the new column
*/

-- Add phase column to chat_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'phase'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN phase text DEFAULT 'gathering';
  END IF;
END $$;

-- Update existing sessions to have gathering phase
UPDATE chat_sessions 
SET phase = 'gathering' 
WHERE phase IS NULL;