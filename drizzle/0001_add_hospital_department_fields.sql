-- Add department fields to hospital_profiles table
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "zip_code" text;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "phone_number" text;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "website" text;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "accreditation" text;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "transplant_department_head" text;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "department_phone" text;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "department_email" text;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "number_of_transplant_surgeons" integer;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "transplant_capacity" integer;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "specializations" text[];
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "license_doc_url" text;
ALTER TABLE "hospital_profiles" ADD COLUMN IF NOT EXISTS "accreditation_doc_url" text;
