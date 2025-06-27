-- Add points_to_win column to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS points_to_win INTEGER DEFAULT 11 CHECK (points_to_win IN (11, 21));

-- Add winner column to track match results
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner INTEGER CHECK (winner IN (1, 2));
