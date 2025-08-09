/*
  # Add foreign key relationship between itineraries and users

  1. Foreign Key Constraint
    - Add foreign key constraint linking itineraries.user_id to users.id
    - Enable CASCADE delete to maintain referential integrity
  
  2. Index Creation
    - Add index on user_id column for better query performance
*/

-- Add foreign key constraint linking itineraries.user_id to users.id
ALTER TABLE public.itineraries
ADD CONSTRAINT IF NOT EXISTS itineraries_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE CASCADE;

-- Add index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);