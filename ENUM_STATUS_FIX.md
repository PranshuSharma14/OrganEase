# Status Enum Issues - Complete Fix

## Problem Overview
Multiple API endpoints were trying to set invalid status values that don't exist in the `request_status` enum, causing database errors.

## Valid Status Values
The `request_status` enum in the database only allows these values:
- `pending`
- `under_review`
- `verified`
- `matched`
- `approved`
- `rejected`
- `completed`
- `cancelled`

## Issues Found & Fixed

### 1. Accept Match API (`/api/matches/accept`)
**Problem:** Tried to set status to `"both-accepted"` ❌
```typescript
// WRONG
if (willBothAccept) {
  updateData.status = "both-accepted"; // Invalid!
}
```

**Fix:** Don't change status when both parties accept ✅
```typescript
// CORRECT
// Status stays as "approved" until hospital marks as complete
const willBothAccept = 
  (session.user.role === "donor" && accepted && match.recipientAccepted) ||
  (session.user.role === "recipient" && accepted && match.donorAccepted);
// Don't change status
```

**Error Message:**
```
invalid input value for enum request_status: "both-accepted"
```

### 2. Schedule API (`/api/matches/schedule`)
**Problem:** Tried to set status to `"test-scheduled"` and `"procedure-scheduled"` ❌
```typescript
// WRONG
if (type === "test") {
  updateData.testScheduledDate = scheduleDate;
  updateData.status = "test-scheduled"; // Invalid!
} else if (type === "procedure") {
  updateData.procedureScheduledDate = scheduleDate;
  updateData.status = "procedure-scheduled"; // Invalid!
}
```

**Fix:** Don't change status when scheduling ✅
```typescript
// CORRECT
if (type === "test") {
  updateData.testScheduledDate = scheduleDate;
  // Don't change status - keep it as "approved"
} else if (type === "procedure") {
  updateData.procedureScheduledDate = scheduleDate;
  // Don't change status - keep it as "approved"
}
```

**Error Message:**
```
invalid input value for enum request_status: "test-scheduled"
invalid input value for enum request_status: "procedure-scheduled"
```

### 3. Complete Match API (`/api/matches/complete`)
**Status:** ✅ Already correct - uses valid `"completed"` value
```typescript
// CORRECT
await db.update(matches).set({
  status: "completed", // Valid enum value!
  completedAt: new Date(),
})
```

## Status Lifecycle

The correct status flow through the match lifecycle:

1. **Match Created** → `status: "matched"`
   - System creates match between compatible donor and recipient

2. **Hospital Approves** → `status: "approved"`
   - Hospital reviews and approves the match
   - `approvedByHospital: true`

3. **Both Accept** → `status: "approved"` (unchanged)
   - Donor accepts: `donorAccepted: true`
   - Recipient accepts: `recipientAccepted: true`
   - Status remains "approved"

4. **Test Scheduled** → `status: "approved"` (unchanged)
   - `testScheduledDate` is set
   - Status remains "approved"

5. **Procedure Scheduled** → `status: "approved"` (unchanged)
   - `procedureScheduledDate` is set
   - Status remains "approved"

6. **Procedure Complete** → `status: "completed"`
   - Hospital marks as complete
   - `completedAt` timestamp set
   - Status changes to "completed"

7. **Match Rejected** → `status: "rejected"`
   - Hospital or either party rejects
   - Match ends

8. **Match Cancelled** → `status: "cancelled"`
   - Match is cancelled for any reason

## Database Fields Used for Tracking

Instead of changing status for every step, we use specific fields:

| Step | Field | Type | Status Value |
|------|-------|------|--------------|
| Hospital Approval | `approvedByHospital` | boolean | "approved" |
| Hospital Approval Date | `approvedAt` | timestamp | "approved" |
| Donor Acceptance | `donorAccepted` | boolean | "approved" |
| Donor Acceptance Date | `donorAcceptedAt` | timestamp | "approved" |
| Recipient Acceptance | `recipientAccepted` | boolean | "approved" |
| Recipient Acceptance Date | `recipientAcceptedAt` | timestamp | "approved" |
| Test Scheduled | `testScheduledDate` | timestamp | "approved" |
| Procedure Scheduled | `procedureScheduledDate` | timestamp | "approved" |
| Procedure Complete | `completedAt` | timestamp | "completed" |

## Timeline Display Logic

The Timeline component uses these fields to determine progress:

```typescript
// Step 1: Profile Created - Always completed
{ status: "completed" }

// Step 2: Hospital Approval
if (match.approvedByHospital === true) {
  { status: "completed" } // Green checkmark
} else {
  { status: "current" } // Blue pulsing dot
}

// Step 3: Match Acceptance
if (match.donorAccepted && match.recipientAccepted) {
  { status: "completed" } // Green checkmark
} else if (match.approvedByHospital) {
  { status: "current" } // Blue pulsing dot
}

// Step 4: Testing Scheduled
if (match.testScheduledDate) {
  { status: "completed" } // Green checkmark
} else {
  { status: "current" } // Blue pulsing dot
}

// Step 5: Procedure Scheduled
if (match.procedureScheduledDate) {
  { status: "completed" } // Green checkmark
} else {
  { status: "current" } // Blue pulsing dot
}

// Step 6: Procedure Complete
if (match.completedAt) {
  { status: "completed" } // Green checkmark
} else {
  { status: "current" } // Blue pulsing dot
}
```

## Files Modified

1. **src/app/api/matches/accept/route.ts**
   - Removed invalid `"both-accepted"` status
   - Added detailed logging
   - Better error messages

2. **src/app/api/matches/schedule/route.ts**
   - Removed invalid `"test-scheduled"` and `"procedure-scheduled"` statuses
   - Added logging
   - Status remains "approved"

3. **src/app/api/matches/complete/route.ts**
   - Already correct (no changes needed)
   - Uses valid `"completed"` status

## Testing Scripts Created

1. **scripts/test_recipient_accept.mjs**
   - Tests recipient accepting a match
   - Verifies no enum errors

2. **scripts/test_schedule.mjs**
   - Tests scheduling medical tests
   - Verifies no enum errors

3. **scripts/check_matches.mjs**
   - Inspects current match state
   - Shows all field values

## Verification

Run these commands to verify the fixes:

```bash
# Check current match state
node scripts/check_matches.mjs

# Test recipient acceptance
node scripts/test_recipient_accept.mjs

# Test scheduling
node scripts/test_schedule.mjs
```

## Summary

The root cause of all "Failed to accept match" and "Failed to schedule" errors was attempting to use status values that don't exist in the database enum. The fix is simple: **don't change the status field** for intermediate steps. Use the dedicated boolean and timestamp fields instead, and only change status to "completed" when the procedure is actually complete.

This approach:
- ✅ Prevents database enum errors
- ✅ Provides more granular tracking
- ✅ Makes the timeline logic clearer
- ✅ Follows database best practices
