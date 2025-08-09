/*
  # Remove redundant user_id column from itineraries table

  1. Schema Changes
    - Remove user_id column from itineraries table
    - User ownership is now determined through session_id -> chat_sessions -> users relationship
  
  2. Foreign Key Constraints
    - Ensure proper foreign key from itineraries.session_id to chat_sessions.id
    - Ensure proper foreign key from chat_sessions.user_id to users.id
*/

-- Remove the redundant user_id column from itineraries table
ALTER TABLE itineraries 
DROP COLUMN IF EXISTS user_id;

-- Ensure proper foreign key constraint exists for session_id
DO $$
BEGIN
  -- Check if foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'itineraries_session_id_fkey' 
    AND table_name = 'itineraries'
  ) THEN
    ALTER TABLE itineraries 
    ADD CONSTRAINT itineraries_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure proper foreign key constraint exists for chat_sessions.user_id
DO $$
BEGIN
  -- Check if foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chat_sessions_user_id_fkey' 
    AND table_name = 'chat_sessions'
  ) THEN
    ALTER TABLE chat_sessions 
    ADD CONSTRAINT chat_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;