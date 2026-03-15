-- Add phone and password columns to users
ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS password text;
