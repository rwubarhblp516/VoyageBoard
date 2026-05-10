-- Add avatar_url column to trip_members
ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS avatar_url text;
