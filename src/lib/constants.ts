export const ORGAN_TYPES = [
  { value: "kidney", label: "Kidney" },
  { value: "partial_liver", label: "Partial Liver" },
  { value: "bone_marrow", label: "Bone Marrow / Stem Cells" },
  { value: "blood_whole", label: "Blood (Whole)" },
  { value: "blood_plasma", label: "Blood (Plasma)" },
  { value: "blood_platelets", label: "Blood (Platelets)" },
  { value: "partial_lung", label: "Partial Lung (Rare)" },
  { value: "partial_pancreas", label: "Partial Pancreas (Rare)" },
  { value: "skin", label: "Skin (Medical Use)" },
  { value: "blood_vessels", label: "Blood Vessels / Tissues" },
] as const;

export const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
] as const;

export const USER_ROLES = {
  DONOR: "donor",
  RECIPIENT: "recipient",
  HOSPITAL: "hospital",
} as const;

export const REQUEST_STATUS = {
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  VERIFIED: "verified",
  MATCHED: "matched",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const PRIORITY_LEVELS = {
  NORMAL: "normal",
  HIGH: "high",
  EMERGENCY: "emergency",
} as const;

export const URGENCY_LEVELS = ["critical", "high", "medium", "low"] as const;

export const DONOR_AVAILABILITY = {
  ACTIVE: "active",
  PAUSED: "paused",
  UNAVAILABLE: "unavailable",
} as const;
