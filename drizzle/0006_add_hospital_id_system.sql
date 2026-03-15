-- Add hospital_code to hospital_profiles (unique short code shared with recipients)
ALTER TABLE IF EXISTS hospital_profiles
ADD COLUMN IF NOT EXISTS hospital_code text UNIQUE;

-- Add registered_hospital_id to recipient_profiles (set at signup via hospitalCode)
ALTER TABLE IF EXISTS recipient_profiles
ADD COLUMN IF NOT EXISTS registered_hospital_id uuid REFERENCES hospital_profiles(id);
