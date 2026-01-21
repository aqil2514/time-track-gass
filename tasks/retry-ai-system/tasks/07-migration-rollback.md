# Task 07: Create Retry Queue Rollback Migration

## Meta
- **File**: `backend/migrations/002_add_retry_queue.down.sql`
- **Action**: create
- **Depends**: [02]
- **Priority**: P1
- **Phase**: 1

## Objective
Create rollback migration for retry queue table.

## Requirements
- Safe rollback that removes all retry_queue artifacts
- Remove hypertable, indexes, policies

## Acceptance Criteria
- [ ] Drops all indexes
- [ ] Removes compression policy
- [ ] Removes retention policy
- [ ] Drops hypertable
- [ ] Removes update trigger

## Implementation Notes

```sql
-- backend/migrations/002_add_retry_queue.down.sql

-- Drop trigger
DROP TRIGGER IF EXISTS retry_queue_updated_at ON retry_queue;
DROP FUNCTION IF EXISTS update_retry_queue_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_retry_queue_activity_id;
DROP INDEX IF EXISTS idx_retry_queue_type_status;
DROP INDEX IF EXISTS idx_retry_queue_next_retry;

-- Drop compression policy
SELECT remove_compression_policy('retry_queue');

-- Drop retention policy
SELECT remove_retention_policy('retry_queue');

-- Drop hypertable (this also drops the table)
DROP TABLE IF EXISTS retry_queue;
```
