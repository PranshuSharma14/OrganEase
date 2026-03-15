# Testing Guide - Real-Time System

## Prerequisites
1. Start the development server: `npm run dev`
2. Have at least one of each profile type created:
   - Donor profile
   - Recipient profile  
   - Hospital profile

## Test Flow

### Step 1: Create Profiles (if not already created)
1. **Donor Profile**
   - Sign up as donor
   - Complete onboarding with organs, blood group, location
   - Upload documents
   
2. **Recipient Profile**
   - Sign up as recipient
   - Complete onboarding with required organ, blood group, location
   - Upload documents

3. **Hospital Profile**
   - Sign up as hospital
   - Complete onboarding with hospital details
   - Upload registration documents

### Step 2: Match Creation
- System should automatically create matches based on compatibility
- Check in recipient/donor dashboards - "Matches" tab should show potential matches

### Step 3: Hospital Approval Process
1. Login as **Hospital**
2. Navigate to "Active Matches" tab
3. Click "View Full Details" on a match
4. Verify you see:
   - ✅ Complete donor information (name, age, blood group, location, contact, organs)
   - ✅ Complete recipient information (name, age, blood group, location, contact, required organ)
   - ✅ Approve/Reject buttons
   - ✅ Notes text area
5. Add notes (optional)
6. Click "Approve Match"
7. Verify success toast appears
8. Verify match card now shows "Hospital Approved" badge

### Step 4: Donor Acceptance
1. Login as **Donor**
2. Navigate to "Matches" tab
3. Find the hospital-approved match
4. Verify you see:
   - ✅ "Hospital Approved" green badge
   - ✅ "Accept Match" button (green)
5. Click "Accept Match"
6. Verify success toast: "Match accepted! You can now chat with the recipient."
7. Verify match card updates:
   - ✅ "You Accepted" blue badge appears
   - ✅ Button changes to "Awaiting Recipient" or "Chat" (if recipient also accepted)
8. Check Timeline in sidebar:
   - ✅ Profile Created (completed, green)
   - ✅ Hospital Approved (completed, green, with date)
   - ✅ Match Acceptance (current, blue, pulsing - shows donor accepted, waiting for recipient)

### Step 5: Recipient Acceptance
1. Login as **Recipient**
2. Navigate to "Matches" tab
3. Find the hospital-approved match
4. Verify you see:
   - ✅ "Hospital Approved" green badge
   - ✅ "Donor Accepted" blue badge
   - ✅ "Accept Match" button (green)
5. Click "Accept Match"
6. Verify success toast: "Match accepted! You can now chat with the donor."
7. Verify match card updates:
   - ✅ "You Accepted" purple badge appears
   - ✅ "Chat with Donor" button appears
8. Check Timeline in sidebar:
   - ✅ Profile Created (completed, green)
   - ✅ Hospital Approved (completed, green)
   - ✅ Match Accepted (completed, green - both parties accepted)
   - ✅ Testing (current, blue, pulsing - waiting for hospital to schedule)

### Step 6: Real-Time Chat
1. As **Donor**, click "Chat with Recipient" on the match
2. Type a message: "Hello, I'm ready to help!"
3. Press Enter or click Send
4. Verify message appears with blue background (your message)
5. Login as **Recipient** (in another browser/incognito)
6. Click "Chat with Donor" on the match
7. Verify donor's message appears with gray background
8. Reply: "Thank you so much!"
9. Verify message appears instantly (3-second polling)
10. Switch back to donor view
11. Verify recipient's message appears
12. Verify chat features:
    - ✅ Message bubbles (blue for you, gray for other)
    - ✅ Avatar initials
    - ✅ Timestamps
    - ✅ Auto-scroll to bottom
    - ✅ "Encrypted end-to-end" label
    - ✅ Enter key to send

### Step 7: Hospital Schedules Test
1. Login as **Hospital**
2. Navigate to "Active Matches" tab
3. Find the match where both parties accepted
4. Verify you see:
   - ✅ "Hospital Approved" badge
   - ✅ "Donor Accepted" badge
   - ✅ "Recipient Accepted" badge
   - ✅ "Schedule Test" button
5. Click "Schedule Test"
6. Select a date/time in the future
7. Click "Schedule"
8. Verify success toast
9. Verify match card updates:
   - ✅ "Test Scheduled: [date]" orange badge appears
   - ✅ Button changes to "Schedule Procedure"

### Step 8: Check Timeline After Test Scheduled
1. Login as **Donor** or **Recipient**
2. Check Timeline in sidebar:
   - ✅ Profile Created (completed)
   - ✅ Hospital Approved (completed)
   - ✅ Match Accepted (completed)
   - ✅ Testing Scheduled (completed, green, with date)
   - ✅ Procedure Planning (current, blue, pulsing)

### Step 9: Hospital Schedules Procedure
1. Login as **Hospital**
2. Find the match with test scheduled
3. Click "Schedule Procedure"
4. Select a date/time
5. Click "Schedule"
6. Verify success toast
7. Verify match card updates:
   - ✅ "Procedure: [date]" indigo badge appears
   - ✅ Button changes to "Mark Complete"

### Step 10: Check Timeline After Procedure Scheduled
1. Login as **Donor** or **Recipient**
2. Check Timeline:
   - ✅ All previous steps completed (green)
   - ✅ Procedure Scheduled (completed, green, with date)
   - ✅ Procedure (current, blue, pulsing - awaiting completion)

### Step 11: Hospital Marks Complete
1. Login as **Hospital**
2. Find the match with procedure scheduled
3. Click "Mark Complete"
4. Verify success toast
5. Verify match status updates to "completed"

### Step 12: Final Timeline Verification
1. Login as **Donor** or **Recipient**
2. Check Timeline:
   - ✅ Profile Created (completed)
   - ✅ Hospital Approved (completed)
   - ✅ Match Accepted (completed)
   - ✅ Testing Scheduled (completed)
   - ✅ Procedure Scheduled (completed)
   - ✅ Procedure Complete (completed, green, with date)
3. Verify all steps show green checkmarks and dates

## Edge Cases to Test

### Chat Without Approval
1. Try to open chat before hospital approval
2. Expected: Chat button should not appear
3. Expected: API should reject with "Match must be approved by hospital before chatting"

### Accept Without Hospital Approval
1. Try to find "Accept Match" button before hospital approves
2. Expected: Button should not appear
3. Expected: Only "Awaiting Hospital Approval" message shown

### Schedule Without Both Acceptances
1. Hospital tries to schedule test before both parties accept
2. Expected: "Schedule Test" button should not appear
3. Expected: Must wait for both donor and recipient to accept

### Multiple Matches
1. Create multiple matches for same donor/recipient
2. Verify each match has independent timeline
3. Verify chat is separate for each match
4. Verify approvals don't affect other matches

## Expected Behavior Summary

| Stage | Donor View | Recipient View | Hospital View |
|-------|------------|---------------|---------------|
| Initial | "Awaiting Hospital" | "Awaiting Hospital" | "View Full Details" + Approve/Reject |
| Hospital Approved | "Accept Match" button | "Accept Match" button | Shows approval badge |
| Donor Accepted | "You Accepted" badge | "Accept Match" button | Shows donor accepted badge |
| Both Accepted | "Chat with Recipient" button | "Chat with Donor" button | "Schedule Test" button |
| Test Scheduled | See test date badge | See test date badge | "Schedule Procedure" button |
| Procedure Scheduled | See procedure date badge | See procedure date badge | "Mark Complete" button |
| Completed | All badges visible | All badges visible | Status: Completed |

## Timeline Progression

```
1. Profile Created ✅ (Always completed from start)
   ↓
2. Hospital Approved ✅ (After hospital approves)
   ↓
3. Match Accepted ✅ (After both donor & recipient accept)
   ↓
4. Testing Scheduled ✅ (After hospital schedules test)
   ↓
5. Procedure Scheduled ✅ (After hospital schedules procedure)
   ↓
6. Procedure Complete ✅ (After hospital marks complete)
```

## Common Issues & Solutions

### Chat messages not appearing
- Wait 3 seconds (polling interval)
- Refresh the page
- Check browser console for errors

### Timeline not updating
- Refresh the page after each action
- Verify the action completed (check toast notification)

### Buttons not appearing
- Verify you're logged in with correct role
- Check match status (approvals, acceptances)
- Ensure previous steps completed

## Performance Notes
- Chat polls every 3 seconds (intentional delay)
- Timeline recalculates on page load
- Status updates require page refresh (no WebSocket yet)

## Success Criteria
✅ Complete flow from match creation to completion
✅ Chat works between donor and recipient
✅ Timeline updates at each stage
✅ All status badges appear correctly
✅ Hospital can approve, schedule, and complete
✅ Proper security (can't chat before approval, etc.)
