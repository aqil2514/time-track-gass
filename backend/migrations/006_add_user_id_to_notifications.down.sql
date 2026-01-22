-- Remove user_id column from notifications table
ALTER TABLE notifications DROP COLUMN IF EXISTS user_id;
