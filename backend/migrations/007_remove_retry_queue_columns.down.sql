-- Add back retry_queue_id column to activities table (for rollback)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS retry_queue_id UUID REFERENCES retry_queue(id);
