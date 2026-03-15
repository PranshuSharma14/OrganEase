DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_group') THEN
		CREATE TYPE "public"."blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
	END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donor_availability') THEN
		CREATE TYPE "public"."donor_availability" AS ENUM('active', 'paused', 'unavailable');
	END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organ_type') THEN
		CREATE TYPE "public"."organ_type" AS ENUM('kidney', 'partial_liver', 'bone_marrow', 'blood_whole', 'blood_plasma', 'blood_platelets', 'partial_lung', 'partial_pancreas', 'skin', 'blood_vessels');
	END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority') THEN
		CREATE TYPE "public"."priority" AS ENUM('normal', 'high', 'emergency');
	END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
		CREATE TYPE "public"."request_status" AS ENUM('pending', 'under_review', 'verified', 'matched', 'approved', 'rejected', 'completed', 'cancelled');
	END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
		CREATE TYPE "public"."user_role" AS ENUM('donor', 'recipient', 'hospital', 'admin');
	END IF;
END$$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_email" text NOT NULL,
	"user_role" "user_role" NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"previous_state" jsonb,
	"new_state" jsonb,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" "user_role" NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "donor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"age" integer NOT NULL,
	"blood_group" "blood_group" NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"organs" jsonb NOT NULL,
	"availability" "donor_availability" DEFAULT 'active' NOT NULL,
	"emergency_available" boolean DEFAULT false,
	"aadhaar_url" text,
	"medical_certificate_url" text,
	"documents_verified" boolean DEFAULT false,
	"verified_by_hospital_id" uuid,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "donor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hospital_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hospital_name" text NOT NULL,
	"registration_number" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"contact_number" text NOT NULL,
	"coordinator_name" text NOT NULL,
	"coordinator_email" text NOT NULL,
	"verified" boolean DEFAULT false,
	"verification_doc_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hospital_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "hospital_profiles_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donor_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"organ_type" "organ_type" NOT NULL,
	"match_score" integer,
	"status" "request_status" DEFAULT 'matched',
	"hospital_id" uuid,
	"approved_by_hospital" boolean DEFAULT false,
	"approved_at" timestamp,
	"hospital_notes" text,
	"donor_accepted" boolean DEFAULT false,
	"recipient_accepted" boolean DEFAULT false,
	"donor_accepted_at" timestamp,
	"recipient_accepted_at" timestamp,
	"consent_pdf_url" text,
	"consent_generated_at" timestamp,
	"test_scheduled_date" timestamp,
	"procedure_scheduled_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"read" boolean DEFAULT false,
	"action_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipient_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"patient_name" text NOT NULL,
	"age" integer NOT NULL,
	"blood_group" "blood_group" NOT NULL,
	"required_organ" "organ_type" NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"hospital_letter_url" text,
	"medical_report_url" text,
	"priority" "priority" DEFAULT 'normal',
	"request_status" "request_status" DEFAULT 'pending',
	"documents_verified" boolean DEFAULT false,
	"verified_by_hospital_id" uuid,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipient_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'donor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_users_id_fk') THEN
		ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_match_id_matches_id_fk') THEN
		ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_sender_id_users_id_fk') THEN
		ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'donor_profiles_user_id_users_id_fk') THEN
		ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'donor_profiles_verified_by_hospital_id_hospital_profiles_id_fk') THEN
		ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_verified_by_hospital_id_hospital_profiles_id_fk" FOREIGN KEY ("verified_by_hospital_id") REFERENCES "public"."hospital_profiles"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hospital_profiles_user_id_users_id_fk') THEN
		ALTER TABLE "hospital_profiles" ADD CONSTRAINT "hospital_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_donor_id_donor_profiles_id_fk') THEN
		ALTER TABLE "matches" ADD CONSTRAINT "matches_donor_id_donor_profiles_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donor_profiles"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_recipient_id_recipient_profiles_id_fk') THEN
		ALTER TABLE "matches" ADD CONSTRAINT "matches_recipient_id_recipient_profiles_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipient_profiles"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_hospital_id_hospital_profiles_id_fk') THEN
		ALTER TABLE "matches" ADD CONSTRAINT "matches_hospital_id_hospital_profiles_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospital_profiles"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_users_id_fk') THEN
		ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipient_profiles_user_id_users_id_fk') THEN
		ALTER TABLE "recipient_profiles" ADD CONSTRAINT "recipient_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipient_profiles_verified_by_hospital_id_hospital_profiles_id_fk') THEN
		ALTER TABLE "recipient_profiles" ADD CONSTRAINT "recipient_profiles_verified_by_hospital_id_hospital_profiles_id_fk" FOREIGN KEY ("verified_by_hospital_id") REFERENCES "public"."hospital_profiles"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END$$;