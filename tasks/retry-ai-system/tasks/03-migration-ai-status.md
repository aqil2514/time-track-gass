# Task 03: Add AI Status Tracking to Activities

## Meta
- **File**: `backend/migrations/003_add_ai_status_to_activities.up.sql`
- **Action**: create
- **Depends**: []
- **Priority**: P0
- **Phase**: 1

## Objective
Add columns to activities table to track AI analysis status and attempts.

## Requirements
- Add status column (pending, success, queued, failed)
- Add attempt counter
- Add error tracking
- Non-breaking (nullable with defaults)

## Acceptance Criteria
- [ ] `ai_analysis_status` column added (VARCHAR, default 'success')
- [ ] `ai_analysis_attempts` column added (INT, default 0)
- [ ] `ai_analysis_last_error` column added (TEXT, nullable)
- [ ] All columns nullable or have defaults
- [ ] No breaking changes to existing data

## Implementation Notes

```sql
-- backend/migrations/003_add_ai_status_to_activities.up.sql

-- Add AI analysis status tracking
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS ai_analysis_status VARCHAR(20) DEFAULT 'success',
ADD COLUMN IF NOT EXISTS ai_analysis_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_analysis_last_error TEXT;

-- Add index for querying queued activities
CREATE INDEX IF NOT EXISTS idx_activities_ai_status
ON activities(user_id, ai_analysis_status)
WHERE ai_analysis_status = 'queued';

-- Add comment for documentation
COMMENT ON COLUMN activities.ai_analysis_status IS 'AI analysis status: pending, success, queued, failed';
COMMENT ON COLUMN activities.ai_analysis_attempts IS 'Number of AI analysis attempts';
COMMENT ON COLUMN activities.ai_analysis_last_error IS 'Last error from AI analysis if failed';
```

## Status Values

| Status | Description |
|--------|-------------|
| `pending` | Initial state (default to 'success' for existing data) |
| `success` | AI analysis completed successfully |
| `queued` | Queued for background retry |
| `failed` | All retry attempts exhausted |

## Down Migration

```sql
-- backend/migrations/003_add_ai_status_to_activities.down.sql

DROP INDEX IF EXISTS idx_activities_ai_status;
ALTER TABLE activities
DROP COLUMN IF EXISTS ai_analysis_last_error,
DROP COLUMN IF EXISTS ai_analysis_attempts,
DROP COLUMN IF EXISTS ai_analysis_status;
```
