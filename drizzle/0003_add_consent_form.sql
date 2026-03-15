-- Add missing consent_form column to donor_profiles
-- Safe to run repeatedly thanks to IF NOT EXISTS
ALTER TABLE IF EXISTS donor_profiles
ADD COLUMN IF NOT EXISTS consent_form text;

-- Optionally set a default for existing rows:
-- UPDATE donor_profiles SET consent_form = '' WHERE consent_form IS NULL;
