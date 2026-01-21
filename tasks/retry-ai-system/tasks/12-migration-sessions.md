# Task 12: Create Sessions Table Migration

## Meta
- **File**: `backend/migrations/004_add_sessions.up.sql`
- **Action**: create
- **Depends**: []
- **Priority**: P1
- **Phase**: 3

## Objective
Create sessions table for grouping related activities.

## Requirements
- Create sessions table
- Add session_id foreign key to activities
- Support session summaries
- Non-breaking migration

## Acceptance Criteria
- [ ] `sessions` table created
- [ ] `session_id` column added to activities (nullable)
- [ ] Index on session_id
- [ ] Session summary columns (nullable)
- [ ] Hypertable for time-series optimization

## Implementation Notes

```sql
-- backend/migrations/004_add_sessions.up.sql

-- Sessions table for grouping related activities
CREATE TABLE activity_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    app_name VARCHAR(100),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    activity_count INT DEFAULT 0,
    total_minutes INT DEFAULT 0,
    summary TEXT,
    summary_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable
SELECT create_hypertable('activity_sessions', 'started_at',
    chunk_time_interval => INTERVAL '1 week'
);

-- Add compression policy
SELECT add_compression_policy('activity_sessions', INTERVAL '1 month');

-- Add retention policy (keep longer than activities)
SELECT add_retention_policy('activity_sessions', INTERVAL '2 years');

-- Add session_id to activities (nullable, non-breaking)
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES activity_sessions(id) ON DELETE SET NULL;

-- Index for session lookups
CREATE INDEX idx_activities_session ON activities(session_id)
    WHERE session_id IS NOT NULL;

-- Index for user sessions
CREATE INDEX idx_sessions_user_started ON activity_sessions(user_id, started_at DESC);

-- Index for unprocessed summaries
CREATE INDEX idx_sessions_no_summary ON activity_sessions(user_id, started_at)
    WHERE summary IS NULL;
```

## Session Logic

Sessions are created algorithmically (not by AI):
- Same category
- Gap < 30 minutes between activities
- Ordered by captured_at

Example:
```
Activity 1: 10:00 - VS Code (coding)
Activity 2: 10:05 - VS Code (coding)
Activity 3: 10:35 - Chrome (browsing)  → New session (30 min gap)
Activity 4: 10:40 - Chrome (browsing)
```
