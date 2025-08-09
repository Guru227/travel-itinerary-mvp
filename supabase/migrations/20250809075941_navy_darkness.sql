/*
  # Add nickname column to users table

  1. Schema Changes
    - Add `nickname` column to `users` table
    - Column type: TEXT (nullable)
    - Allows users to set a display name for community features

  2. Notes
    - Column is nullable to allow existing users without nicknames
    - New users can optionally set a nickname during profile setup
*/

-- Add nickname column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;