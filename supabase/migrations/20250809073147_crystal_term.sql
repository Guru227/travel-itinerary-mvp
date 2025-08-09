/*
  # Fix foreign key relationship to auth.users

  1. Foreign Key Constraint
    - Add foreign key constraint linking `itineraries.user_id` to `auth.users(id)`
    - Use CASCADE delete to maintain referential integrity
  
  2. Performance
    - Add index on user_id column for better query performance
  
  3. Safety
    - Use IF NOT EXISTS to prevent errors if constraint already exists
*/

-- Add foreign key constraint to auth.users table (not public.users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'itineraries_user_id_auth_fkey'
    AND table_name = 'itineraries'
  ) THEN
    ALTER TABLE public.itineraries 
    ADD CONSTRAINT itineraries_user_id_auth_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);