# Hospital Approval Workflow

## Overview
The hospital approval process is a critical step in the organ donation matching system. This document explains the complete workflow and how each component works together.

## Workflow Steps

### 1. Match Creation
When a match is created (either manually or automatically):
- A record is inserted into the `matches` table
- Initial status: `status = "matched"`, `approvedByHospital = false`
- `hospitalId` is initially `null` (no hospital assigned yet)
- Match score is calculated based on compatibility factors

### 2. Hospital Dashboard Display
The hospital dashboard shows matches that need approval:

**Query Logic** (`/api/matches?role=hospital`):
```typescript
// Shows matches where:
// 1. Match is assigned to this hospital (hospitalId matches), OR
// 2. Match has no hospital assigned AND needs approval
WHERE (hospitalId = currentHospitalId) 
   OR (hospitalId IS