-- Migrate existing users to organization-based structure
-- Each existing user becomes owner of their own organization

-- First, create organizations for each existing user
INSERT INTO organizations (id, name, owner_id, timezone, created_at)
SELECT
    gen_random_uuid(),
    COALESCE(name, email) || '''s Organization',
    id,
    'Asia/Jakarta',
    created_at
FROM users
WHERE organization_id IS NULL
RETURNING id, owner_id;

-- Then update users to reference their new organization
UPDATE users u
SET organization_id = o.id,
    role = 'owner'
FROM organizations o
WHERE u.organization_id IS NULL
  AND o.owner_id = u.id;
