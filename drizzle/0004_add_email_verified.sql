-- Add email_verified column to users
ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS email_verified timestamp;

-- Optionally set existing rows to null (default behavior) or a specific timestamp
-- UPDATE users SET email_verified = NULL WHERE email_verified IS NULL;
