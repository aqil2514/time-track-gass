-- Rollback migration for existing users to organizations
-- This is a destructive operation - data will be lost

-- Delete organizations that were created for users (where owner is a user who owns their own org)
DELETE FROM organizations
WHERE owner_id IN (
    SELECT u.id
    FROM users u
    WHERE u.organization_id IS NOT NULL
    AND u.role = 'owner'
);

-- Remove organization_id and role from users
UPDATE users SET organization_id = NULL, role = 'member';
