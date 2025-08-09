/*
  # Create automatic user profile creation

  1. Database Function
    - `handle_new_user()` function to create public profile when auth user is created
    - Extracts email from auth metadata and creates corresponding public.users record

  2. Database Trigger
    - `on_auth_user_created` trigger that fires after INSERT on auth.users
    - Automatically calls handle_new_user() function

  3. Security Policies
    - RLS policies for users to select and update their own profiles
    - Allows authenticated users to read and modify their own data
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.raw_user_meta_data ->> 'email');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create public profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own profile
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);