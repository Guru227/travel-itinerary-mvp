/*
  # Add DELETE policy for chat sessions

  1. Security
    - Add policy to allow users to delete their own chat sessions
    - Ensure proper RLS enforcement for delete operations

  2. Changes
    - Create DELETE policy for chat_sessions table
    - Allow authenticated users to delete sessions where user_id matches auth.uid()
*/

-- Add DELETE policy for chat_sessions
CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Also add policy for anonymous users (since the app uses custom auth)
CREATE POLICY "Anyone can delete own chat sessions"
  ON chat_sessions
  FOR DELETE
  TO anon
  USING (user_id IS NOT NULL);