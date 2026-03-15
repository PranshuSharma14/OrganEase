import { 
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  boolean, 
  integer,
  pgEnum,
  jsonb
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const userRoleEnum = pgEnum("user_role", ["donor", "recipient", "hospital"]);
export const bloodGroupEnum = pgEnum("blood_group", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
export const organTypeEnum = pgEnum("organ_type", [
  "kidney",
  "partial_liver",
  "bone_marrow",
  "blood_whole",
  "blood_plasma",
  "blood_platelets",
  "partial_lung",
  "partial_pancreas",
  "skin",
  "blood_vessels"
]);
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "under_review",
  "verified",
  "matched",
  "approved",
  "rejected",
  "completed",
  "cancelled"
]);
export const donorAvailabilityEnum = pgEnum("donor_availability", ["active", "paused", "unavailable"]);
export const priorityEnum = pgEnum("priority", ["normal", "high", "emergency"]);

// ============================================
// USERS TABLE (Core authentication)
// ============================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  name: text("name").notNull(),
  image: text("image"),
  phone: text("phone"),
  password: text("password"), // For credential-based auth
  role: userRoleEnum("role").notNull().default("donor"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// NextAuth adapter tables
export const accounts = pgTable("account", {
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_token", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ============================================
// DONOR PROFILE
// ============================================

export const donorProfiles = pgTable("donor_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  
  // Personal Info
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  bloodGroup: bloodGroupEnum("blood_group").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  
  // Donation Info
  organs: jsonb("organs").notNull(), // Array of organ types
  availability: donorAvailabilityEnum("availability").notNull().default("active"),
  emergencyAvailable: boolean("emergency_available").default(false),
  
  // Documents
  aadhaarUrl: text("aadhaar_url"),
  medicalCertificateUrl: text("medical_certificate_url"),
  bloodGroupReport: text("blood_group_report"),
  consentForm: text("consent_form"),
  documentsVerified: boolean("documents_verified").default(false),
  
  // Verification
  verifiedByHospitalId: uuid("verified_by_hospital_id").references(() => hospitalProfiles.id),
  verifiedAt: timestamp("verified_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// RECIPIENT PROFILE
// ============================================

export const recipientProfiles = pgTable("recipient_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  
  // Patient Info
  patientName: text("patient_name").notNull(),
  age: integer("age").notNull(),
  bloodGroup: bloodGroupEnum("blood_group").notNull(),
  requiredOrgan: organTypeEnum("required_organ").notNull(),
  
  // Location
  city: text("city").notNull(),
  state: text("state").notNull(),
  
  // Medical Details
  hospitalLetterUrl: text("hospital_letter_url"),
  medicalReportUrl: text("medical_report_url"),
  insuranceCardUrl: text("insurance_card_url"),
  governmentIdUrl: text("government_id_url"),
  priority: priorityEnum("priority").default("normal"),
  
  // Status
  requestStatus: requestStatusEnum("request_status").default("pending"),
  documentsVerified: boolean("documents_verified").default(false),
  
  // Hospital Assignment — set at signup via hospitalCode
  registeredHospitalId: uuid("registered_hospital_id").references(() => hospitalProfiles.id),
  
  // Verification
  verifiedByHospitalId: uuid("verified_by_hospital_id").references(() => hospitalProfiles.id),
  verifiedAt: timestamp("verified_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// HOSPITAL PROFILE
// ============================================

export const hospitalProfiles = pgTable("hospital_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  
  // Hospital Info
  hospitalName: text("hospital_name").notNull(),
  registrationNumber: text("registration_number").notNull().unique(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  website: text("website"),
  accreditation: text("accreditation"),
  contactNumber: text("contact_number").notNull(),
  
  // Coordinator Info
  coordinatorName: text("coordinator_name").notNull(),
  coordinatorEmail: text("coordinator_email").notNull(),
  
  // Transplant Department Details
  transplantDepartmentHead: text("transplant_department_head"),
  departmentPhone: text("department_phone"),
  departmentEmail: text("department_email"),
  numberOfTransplantSurgeons: integer("number_of_transplant_surgeons"),
  transplantCapacity: integer("transplant_capacity"),
  specializations: text("specializations").array(),
  
  // Unique code shared with recipients during their signup
  hospitalCode: text("hospital_code").unique(),
  
  // Verification
  verified: boolean("verified").default(false),
  verificationDocUrl: text("verification_doc_url"),
  licenseDocUrl: text("license_doc_url"),
  accreditationDocUrl: text("accreditation_doc_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// MATCHES (Donor-Recipient Pairing)
// ============================================

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  donorId: uuid("donor_id").references(() => donorProfiles.id, { onDelete: "cascade" }).notNull(),
  recipientId: uuid("recipient_id").references(() => recipientProfiles.id, { onDelete: "cascade" }).notNull(),
  
  // Match Details
  organType: organTypeEnum("organ_type").notNull(),
  matchScore: integer("match_score"), // Compatibility score
  
  // Status
  status: requestStatusEnum("status").default("matched"),
  
  // Hospital Approval
  hospitalId: uuid("hospital_id").references(() => hospitalProfiles.id),
  approvedByHospital: boolean("approved_by_hospital").default(false),
  approvedAt: timestamp("approved_at"),
  hospitalNotes: text("hospital_notes"),
  
  // Donor & Recipient Consent
  donorAccepted: boolean("donor_accepted").default(false),
  recipientAccepted: boolean("recipient_accepted").default(false),
  donorAcceptedAt: timestamp("donor_accepted_at"),
  recipientAcceptedAt: timestamp("recipient_accepted_at"),
  
  // Consent PDF
  consentPdfUrl: text("consent_pdf_url"),
  consentGeneratedAt: timestamp("consent_generated_at"),
  
  // Scheduled Procedures
  testScheduledDate: timestamp("test_scheduled_date"),
  procedureScheduledDate: timestamp("procedure_scheduled_date"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// SECURE CHAT
// ============================================

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").references(() => matches.id, { onDelete: "cascade" }).notNull(),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  senderRole: userRoleEnum("sender_role").notNull(),
  
  message: text("message").notNull(),
  read: boolean("read").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// AUDIT LOGS (Immutable)
// ============================================

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Who
  userId: uuid("user_id").references(() => users.id),
  userEmail: text("user_email").notNull(),
  userRole: userRoleEnum("user_role").notNull(),
  
  // What
  action: text("action").notNull(), // e.g., "donor_verified", "match_approved"
  entity: text("entity").notNull(), // e.g., "donor", "match"
  entityId: uuid("entity_id").notNull(),
  
  // Details
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  metadata: jsonb("metadata"),
  
  // When
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  // Where
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "info", "success", "warning", "error"
  
  read: boolean("read").default(false),
  actionUrl: text("action_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  donorProfile: one(donorProfiles, {
    fields: [users.id],
    references: [donorProfiles.userId],
  }),
  recipientProfile: one(recipientProfiles, {
    fields: [users.id],
    references: [recipientProfiles.userId],
  }),
  hospitalProfile: one(hospitalProfiles, {
    fields: [users.id],
    references: [hospitalProfiles.userId],
  }),
  notifications: many(notifications),
}));

export const donorProfilesRelations = relations(donorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [donorProfiles.userId],
    references: [users.id],
  }),
  matches: many(matches),
  verifiedBy: one(hospitalProfiles, {
    fields: [donorProfiles.verifiedByHospitalId],
    references: [hospitalProfiles.id],
  }),
}));

export const recipientProfilesRelations = relations(recipientProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [recipientProfiles.userId],
    references: [users.id],
  }),
  matches: many(matches),
  registeredHospital: one(hospitalProfiles, {
    fields: [recipientProfiles.registeredHospitalId],
    references: [hospitalProfiles.id],
  }),
  verifiedBy: one(hospitalProfiles, {
    fields: [recipientProfiles.verifiedByHospitalId],
    references: [hospitalProfiles.id],
  }),
}));

export const hospitalProfilesRelations = relations(hospitalProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [hospitalProfiles.userId],
    references: [users.id],
  }),
  verifiedDonors: many(donorProfiles),
  verifiedRecipients: many(recipientProfiles),
  approvedMatches: many(matches),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  donor: one(donorProfiles, {
    fields: [matches.donorId],
    references: [donorProfiles.id],
  }),
  recipient: one(recipientProfiles, {
    fields: [matches.recipientId],
    references: [recipientProfiles.id],
  }),
  hospital: one(hospitalProfiles, {
    fields: [matches.hospitalId],
    references: [hospitalProfiles.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  match: one(matches, {
    fields: [chatMessages.matchId],
    references: [matches.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
