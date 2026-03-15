-- Add missing blood_group_report column to donor_profiles
-- This migration is safe to run repeatedly thanks to IF NOT EXISTS
ALTER TABLE IF EXISTS donor_profiles
ADD COLUMN IF NOT EXISTS blood_group_report text;

-- Optionally: if you want to set a default value for existing rows, uncomment and adjust:
-- UPDATE donor_profiles SET blood_group_report = '' WHERE blood_group_report IS NULL;
