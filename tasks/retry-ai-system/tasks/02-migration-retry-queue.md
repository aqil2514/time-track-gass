# Task 02: Create Retry Queue Migration

## Meta
- **File**: `backend/migrations/002_add_retry_queue.up.sql`
- **Action**: create
- **Depends**: []
- **Priority**: P0
- **Phase**: 1

## Objective
Create database migration for the retry queue table to store failed AI tasks for background processing.

## Requirements
- Create retry_queue table with proper indexes
- Support multiple task types (screenshot, session_summary, daily_summary)
- Track attempts, delays, and error history
- Add status tracking (pending, success, failed)
- TimescaleDB hypertable for time-series optimization

## Acceptance Criteria
- [ ] `retry_queue` table created with all required columns
- [ ] Indexes on `(next_retry_at, status)` for efficient querying
- [ ] Index on `(type, status)` for filtering
- [ ] Hypertable on `created_at` for time-series optimization
- [ ] Proper foreign key if needed

## Implementation Notes

```sql
-- backend/migrations/002_add_retry_queue.up.sql

-- Retry Queue Table
CREATE TABLE retry_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,  -- 'screenshot', 'session_summary', 'daily_summary'
    payload JSONB NOT NULL,      -- Task-specific data
    attempt INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    next_retry_at TIMESTAMPTZ NOT NULL,
    last_error TEXT,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'success', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable for time-series optimization
SELECT create_hypertable('retry_queue', 'created_at',
    chunk_time_interval => INTERVAL '1 day'
);

-- Indexes for efficient querying
CREATE INDEX idx_retry_queue_next_retry ON retry_queue(next_retry_at, status)
    WHERE status = 'pending';
CREATE INDEX idx_retry_queue_type_status ON retry_queue(type, status);

-- Add compression policy (compress after 1 week)
SELECT add_compression_policy('retry_queue', INTERVAL '1 week');

-- Add retention policy (delete after 1 month)
SELECT add_retention_policy('retry_queue', INTERVAL '1 month');

-- Index for activity lookups in screenshot tasks
CREATE INDEX idx_retry_queue_activity_id ON retry_queue((payload->>'activity_id'))
    WHERE type = 'screenshot';

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_retry_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER retry_queue_updated_at
    BEFORE UPDATE ON retry_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_retry_queue_updated_at();
```

## Payload Structure Examples

```json
-- Screenshot task
{
  "activity_id": "uuid",
  "image_base64": "base64string..."
}

-- Session summary task
{
  "session_id": "uuid",
  "activities": [
    {"app_name": "...", "window_title": "...", "category": "..."}
  ]
}

-- Daily summary task
{
  "user_id": "uuid",
  "date": "2025-01-20"
}
```
