-- Make userId optional in notifications table
-- This allows notifications to be created for email sends (OTP, verification) even when userId is not available

ALTER TABLE notifications
ALTER COLUMN user_id DROP NOT NULL;
