# Session Verification System

## Overview
Automated session integrity checking system with 4 verification algorithms, similar to Strava's approach.

## Architecture

### Database
- **Migration**: `supabase/migrations/add_session_verification.sql`
- **Tables**: `sessions` (extended), `session_verifications`, `integrity_check_config`
- **Trigger**: Auto-verifies sessions when `ended_at` is set
- **View**: `verified_sessions_summary` for quick queries

### Code Structure
```
src/
├── types/verification.ts              # 40+ TypeScript types
├── lib/verification/
│   ├── integrityChecks.ts            # 4 verification algorithms
│   └── verificationService.ts        # Client service + React hooks
├── app/api/verification/
│   ├── check-session/route.ts        # POST - Run verification
│   ├── session-summary/route.ts      # GET - Fetch summary
│   └── stats/route.ts                # GET - User statistics
└── components/verification/
    ├── VerificationBadge.tsx          # Status badge
    ├── IntegrityScoreDisplay.tsx      # Score with breakdown
    └── VerificationDetails.tsx        # Full verification panel
```

## Verification Algorithms

1. **ROM Consistency** (30%) - Checks consistent range of motion across reps
2. **Tempo Realism** (25%) - Ensures realistic rep speed (not suspiciously fast)
3. **Progression Naturalness** (25%) - Detects unrealistic performance jumps
4. **Outlier Detection** (20%) - Statistical analysis vs user baseline

## Usage

### Display Verification Badge
```tsx
import VerificationBadge from '@/components/verification/VerificationBadge';

<VerificationBadge
  verified={session.verified}
  integrity_score={session.integrity_score}
  flagged={session.flagged}
  showScore={true}
/>
```

### Show Integrity Score
```tsx
import IntegrityScoreDisplay from '@/components/verification/IntegrityScoreDisplay';

<IntegrityScoreDisplay
  score={session.integrity_score}
  showBreakdown={true}
  checks={checksArray}
/>
```

### Full Verification Panel
```tsx
import VerificationDetails from '@/components/verification/VerificationDetails';

<VerificationDetails
  session_id={sessionId}
  onReportIssue={() => handleReport()}
/>
```

### React Hook
```tsx
import { useSessionVerification } from '@/lib/verification/verificationService';

const { summary, loading, error, recheck } = useSessionVerification(sessionId);
```

## API Endpoints

### Check Session
```typescript
POST /api/verification/check-session
Body: { session_id: string, force_recheck?: boolean }
```

### Get Summary
```typescript
GET /api/verification/session-summary?session_id={uuid}
```

### Get Stats
```typescript
GET /api/verification/stats
```

## Database Queries

### Verified Sessions
```sql
SELECT * FROM verified_sessions_summary
WHERE user_id = 'uuid'
ORDER BY started_at DESC;
```

### Adjust Thresholds
```sql
UPDATE integrity_check_config
SET threshold_warning = 0.8
WHERE check_name = 'rom_consistency';
```

## User Education
See in-app FAQ for user-facing documentation on verification badges and integrity scores.

## Status
✅ Production-ready | Zero linting errors | Complete audit trail | RLS security

