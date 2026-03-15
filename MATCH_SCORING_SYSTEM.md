# Match Scoring System

## Overview
The OrganEase matching algorithm calculates a compatibility score (0-100) for each donor-recipient pair based on multiple factors.

## Scoring Breakdown

### 1. Blood Group Compatibility (40 points)
- Checks if the donor's blood type is compatible with the recipient's blood type
- Uses standard blood donation compatibility rules:
  - **O-** (Universal donor): Can donate to all blood types
  - **O+**: Can donate to O+, A+, B+, AB+
  - **A-**: Can donate to A-, A+, AB-, AB+
  - **A+**: Can donate to A+, AB+
  - **B-**: Can donate to B-, B+, AB-, AB+
  - **B+**: Can donate to B+, AB+
  - **AB-**: Can donate to AB-, AB+
  - **AB+**: Can only donate to AB+

### 2. Location Proximity (30 points max)
- **Same state**: 30 points
- **Different state**: 15 points
- Rationale: Organ viability decreases with transport time, so proximity is crucial

### 3. Emergency Availability (20 points)
- Awarded when:
  - Recipient has "emergency" priority status, AND
  - Donor is marked as available for emergency procedures
- Ensures urgent cases get priority matching

### 4. Age Compatibility (10 points max)
- **Age difference < 10 years**: 10 points
- **Age difference < 20 years**: 5 points
- **Age difference ≥ 20 years**: 0 points
- Rationale: Similar age groups often have better transplant outcomes

## Maximum Score
**100 points** = Perfect match (same blood type, same state, emergency available, similar age)

## Minimum Requirements
Before scoring, the system filters for:
- ✅ Donor has the required organ available
- ✅ Blood type compatibility
- ✅ Donor is marked as "active" and available
- ✅ Donor documents are verified

## Example Scenarios

### Scenario 1: Perfect Match (100 points)
- Blood type: O- donor → AB+ recipient (40 points)
- Location: Both in Maharashtra (30 points)
- Emergency: Recipient is emergency, donor available (20 points)
- Age: Donor 28, Recipient 30 (10 points)
- **Total: 100 points**

### Scenario 2: Good Match (80 points)
- Blood type: A+ donor → A+ recipient (40 points)
- Location: Both in Karnataka (30 points)
- Emergency: Not emergency case (0 points)
- Age: Donor 35, Recipient 40 (10 points)
- **Total: 80 points**

### Scenario 3: Acceptable Match (55 points)
- Blood type: O+ donor → AB+ recipient (40 points)
- Location: Different states (15 points)
- Emergency: Not emergency case (0 points)
- Age: Donor 25, Recipient 45 (0 points)
- **Total: 55 points**

## Implementation Notes
- Matches are sorted by score (highest first)
- The system automatically creates a match with the best-scoring donor for each verified recipient
- Hospital administrators can review and approve matches before proceeding
- Scores are stored in the database as `matchScore` field


## Your Current Match

Based on the database check, here's the breakdown for your current match:

**Match Details:**
- Donor: Pranshu Sharma (B+, Delhi, Age 20)
- Recipient: Suryansh Tomar (B+, Delhi, Age 9)
- Organ: Kidney

**Score Calculation (75 points):**
- Blood type compatibility (B+ → B+): **40 points** ✓
- Same state (Delhi): **30 points** ✓
- Age difference (11 years): **5 points** ✓
- Emergency availability: **0 points** (recipient is normal priority)
- **Total: 75 points**

This is a good match with strong blood compatibility and location proximity. The age difference is slightly over 10 years, so it gets 5 points instead of the full 10.

## Recalculating Scores

If you need to recalculate match scores after updating the algorithm, run:
```bash
node scripts/recalculate_match_scores.mjs
```

This script will:
1. Fetch all existing matches
2. Recalculate scores using the current algorithm
3. Update the database with corrected scores
