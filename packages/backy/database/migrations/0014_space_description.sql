-- Add description column to spaces
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

-- Update existing spaces to have empty description
UPDATE spaces SET description = '' WHERE description IS NULL;