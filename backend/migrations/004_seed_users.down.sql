-- backend/migrations/004_seed_users.down.sql

DELETE FROM users WHERE email = 'pile@timetrack.local';
