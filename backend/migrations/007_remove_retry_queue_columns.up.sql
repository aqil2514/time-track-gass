-- Remove retry_queue_id column from activities table
-- Client-side AI analysis means we no longer need server-side retry queue tracking
ALTER TABLE activities DROP COLUMN IF EXISTS retry_queue_id;
