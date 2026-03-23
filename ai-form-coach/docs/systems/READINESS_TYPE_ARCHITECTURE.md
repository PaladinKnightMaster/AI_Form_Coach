> Historical note: this document reflects earlier broader-scope or pre-Beta-1 work. It is not the canonical source of truth for the current public MVP. Use [../technical/MVP_TRUTH_BASELINE.md](../technical/MVP_TRUTH_BASELINE.md), [../technical/MVP_RELEASE_CHECKLIST.md](../technical/MVP_RELEASE_CHECKLIST.md), [../technical/MVP_RELEASE_SCORECARD.md](../technical/MVP_RELEASE_SCORECARD.md), and [../technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md](../technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md) for current Beta 1 release truth.
# Readiness Type Architecture

## Overview

This document explains the type system for readiness assessment data in the AI Form Coach application. Understanding this architecture is crucial for maintaining type safety and avoiding confusion between different data representations.

## Type Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                   ReadinessAssessment                    │
│                  (Core Input Model)                      │
│  - 6 manual assessment fields (0-10 scale)              │
│  - assessmentDate                                        │
│  - Used by: Progression Engine, Component Logic         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ extends
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     ReadinessData                        │
│                 (Extended TypeScript Model)              │
│  - All ReadinessAssessment fields                       │
│  + Health data (sleep, HR, HRV, steps, training load)   │
│  + Computed fields (computedReadiness, category)        │
│  + Metadata (id, userId, timestamps)                    │
│  - Used by: TypeScript code, type checking              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ snake_case version
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   ReadinessDataDB                        │
│                 (Database Format)                        │
│  - Same fields as ReadinessData but in snake_case       │
│  - Matches PostgreSQL readiness_day table schema        │
│  - Used by: API responses, database operations          │
└─────────────────────────────────────────────────────────┘
```

## Type Definitions

### 1. ReadinessAssessment
**Location**: `src/lib/progression/engine.ts`

**Purpose**: Core input model for user's manual readiness assessment

```typescript
export interface ReadinessAssessment {
  sorenessLevel: number;      // 0-10 (0 = no soreness, 10 = extreme)
  fatigueLevel: number;       // 0-10 (0 = fresh, 10 = exhausted)
  sleepQuality: number;       // 0-10 (0 = poor, 10 = excellent)
  stressLevel: number;        // 0-10 (0 = low, 10 = high)
  motivationLevel: number;    // 0-10 (0 = low, 10 = high)
  assessmentDate: Date;
}
```

**When to use**:
- ✅ Collecting user input in forms
- ✅ Passing assessment data to progression engine
- ✅ Component `onSubmit` callbacks
- ✅ Workout target calculations
- ❌ NOT for API responses
- ❌ NOT for displaying computed scores

### 2. ReadinessData
**Location**: `src/lib/progression/engine.ts`

**Purpose**: Extended model including all database fields in camelCase

```typescript
export interface ReadinessData extends ReadinessAssessment {
  id?: string;
  userId?: string;
  date?: string;
  // Health data inputs
  sleepDuration?: number;           // hours
  restingHeartRate?: number;        // bpm
  hrvAverage?: number;              // ms
  stepCount?: number;
  trainingLoad?: number;
  // Computed fields (from database functions)
  computedReadiness?: number;       // 0-1 scale
  readinessCategory?: 'poor' | 'fair' | 'good' | 'excellent';
  // Metadata
  dataSources?: string[];
  lastUpdated?: Date;
  createdAt?: Date;
}
```

**When to use**:
- ✅ Working with full readiness records in TypeScript
- ✅ Converting between formats
- ✅ Type-safe data transformations
- ❌ NOT for database operations directly (use ReadinessDataDB)

### 3. ReadinessDataDB
**Location**: `src/types/readiness.ts`

**Purpose**: Database format with snake_case matching PostgreSQL schema

```typescript
export interface ReadinessDataDB {
  id: string;
  user_id: string;                  // snake_case!
  date: string;
  soreness_level: number;           // snake_case!
  fatigue_level: number;
  sleep_quality: number;
  stress_level: number;
  motivation_level: number;
  sleep_duration?: number;
  resting_heart_rate?: number;
  hrv_average?: number;
  step_count?: number;
  training_load?: number;
  computed_readiness: number;       // Calculated by DB function
  readiness_category: 'poor' | 'fair' | 'good' | 'excellent';
  data_sources?: string[];
  last_updated?: string;
  created_at: string;
}
```

**When to use**:
- ✅ API response types
- ✅ Database query results
- ✅ Direct database operations
- ❌ NOT for progression engine calculations

## Database Architecture

### Table: `readiness_day`

**Computed Fields**:
- `computed_readiness`: Calculated by `calculate_readiness_score()` function
- `readiness_category`: Calculated by `get_readiness_category()` function

### Functions:

#### `calculate_readiness_score()`
```sql
CREATE OR REPLACE FUNCTION calculate_readiness_score(
    p_soreness INTEGER,
    p_fatigue INTEGER,
    p_sleep_quality INTEGER,
    p_stress INTEGER,
    p_motivation INTEGER,
    p_sleep_duration REAL,
    p_resting_hr INTEGER,
    p_hrv INTEGER,
    p_steps INTEGER,
    p_training_load REAL
) RETURNS REAL
```

**Purpose**: Combines manual assessment + health data → single readiness score (0-1)

**Algorithm**:
1. Calculate manual score from 5 subjective inputs
2. Calculate health score from objective data (if available)
3. Weighted average: 60% manual + 40% health

#### `get_readiness_category()`
```sql
CREATE OR REPLACE FUNCTION get_readiness_category(p_score REAL)
RETURNS TEXT
```

**Purpose**: Converts numeric score to category label

**Thresholds**:
- `>= 0.8` → `'excellent'`
- `>= 0.6` → `'good'`
- `>= 0.4` → `'fair'`
- `< 0.4` → `'poor'`

## Data Flow

### 1. User Submits Assessment

```typescript
// Component collects data
const assessment: ReadinessAssessment = {
  sorenessLevel: 3,
  fatigueLevel: 4,
  sleepQuality: 7,
  stressLevel: 5,
  motivationLevel: 6,
  assessmentDate: new Date()
};
```

### 2. Convert to API Format

```typescript
import { toAPIRequest } from '@/types/readiness';

const apiData = toAPIRequest(assessment, healthData);
// Result is snake_case format for API
```

### 3. API Processes Request

```typescript
// API receives snake_case data
POST /api/readiness
{
  date: "2024-01-15",
  soreness_level: 3,
  fatigue_level: 4,
  // ... etc
}

// API calls database functions
const computed_readiness = await supabase.rpc('calculate_readiness_score', ...);
const readiness_category = await supabase.rpc('get_readiness_category', ...);

// API saves to database with computed fields
await supabase.from('readiness_day').upsert({
  ...apiData,
  computed_readiness,
  readiness_category
});
```

### 4. API Returns Full Record

```typescript
// Response includes computed fields
{
  success: true,
  readiness: {
    id: "...",
    user_id: "...",
    date: "2024-01-15",
    soreness_level: 3,
    // ... all fields ...
    computed_readiness: 0.72,      // ← Computed by DB
    readiness_category: "good"     // ← Computed by DB
  }
}
```

### 5. Component Displays Results

```typescript
// Component receives ReadinessDataDB from API
const { readiness } = await response.json();

// Display computed score in UI
showSuccess(`Your readiness: ${Math.round(readiness.computed_readiness * 100)}%`);

// Pass core assessment to progression engine
onSubmit({
  sorenessLevel: readiness.soreness_level,
  fatigueLevel: readiness.fatigue_level,
  sleepQuality: readiness.sleep_quality,
  stressLevel: readiness.stress_level,
  motivationLevel: readiness.motivation_level,
  assessmentDate: new Date(readiness.date)
});
```

## Utility Functions

### toAPIRequest()
Converts `ReadinessAssessment` + health data → `ReadinessAPIRequest` (snake_case)

```typescript
const apiData = toAPIRequest(assessment, healthData);
```

### fromDBRecord()
Converts `ReadinessDataDB` → `ReadinessAssessment` (core fields only)

```typescript
const assessment = fromDBRecord(dbRecord);
```

### fromDBRecordFull()
Converts `ReadinessDataDB` → `ReadinessData` (all fields)

```typescript
const fullData = fromDBRecordFull(dbRecord);
```

## Best Practices

### ✅ DO:
- Use `ReadinessAssessment` for progression engine logic
- Use `ReadinessDataDB` for API responses
- Use utility functions for conversions
- Keep computed fields in database, not in input model
- Document which type is expected in function signatures

### ❌ DON'T:
- Mix camelCase and snake_case in the same interface
- Add computed fields to `ReadinessAssessment`
- Manually convert between formats (use utilities)
- Assume API responses match TypeScript interfaces
- Store computed values in component state when they should be fetched

## Common Pitfalls

### 1. Adding computed fields to ReadinessAssessment
```typescript
// ❌ WRONG
interface ReadinessAssessment {
  // ... core fields ...
  computedReadiness?: number;  // This belongs in ReadinessData!
}
```

### 2. Not converting case when calling API
```typescript
// ❌ WRONG
await fetch('/api/readiness', {
  body: JSON.stringify({
    sorenessLevel: 5  // API expects snake_case!
  })
});

// ✅ CORRECT
await fetch('/api/readiness', {
  body: JSON.stringify(toAPIRequest(assessment))
});
```

### 3. Passing full DB record to progression engine
```typescript
// ❌ WRONG
progressionEngine.calculateTarget(metrics, dbRecord);  // Too many fields!

// ✅ CORRECT
progressionEngine.calculateTarget(metrics, fromDBRecord(dbRecord));
```

## Testing

When writing tests, use the correct type for each scenario:

```typescript
// Unit test for progression engine
const assessment: ReadinessAssessment = {
  sorenessLevel: 2,
  // ... core fields only
};

// Integration test for API
const dbRecord: ReadinessDataDB = {
  id: 'test-id',
  user_id: 'test-user',
  // ... all fields including computed ones
  computed_readiness: 0.75,
  readiness_category: 'good'
};
```

## Migration Guide

If you have existing code that uses computed fields incorrectly:

1. Identify where computed fields are accessed
2. Determine if it's from API response (use `ReadinessDataDB`)
3. Or if it's for progression logic (use `ReadinessAssessment`)
4. Update type annotations accordingly
5. Use utility functions for conversions

## Questions?

If you're unsure which type to use, ask yourself:

1. **Am I collecting user input?** → `ReadinessAssessment`
2. **Am I processing API responses?** → `ReadinessDataDB`
3. **Am I converting between formats?** → Use utility functions
4. **Do I need computed scores?** → Fetch from API, don't calculate locally


