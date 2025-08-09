/*
  # Add metadata columns to chat_sessions table

  1. New Columns
    - `summary` (text, nullable) - Brief description of the travel plan
    - `number_of_travelers` (integer, nullable) - Number of people on the trip

  2. Purpose
    - Support community itinerary display with proper metadata
    - Allow filtering and searching by trip characteristics
*/

ALTER TABLE chat_sessions 
ADD COLUMN summary TEXT,
ADD COLUMN number_of_travelers INTEGER;