-- Membership tables for workspace and space roles

-- Track who created each space
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Workspace membership with role hierarchy: owner > admin > member
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members (user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members (workspace_id);

-- Space membership with role hierarchy: owner > admin > member
CREATE TABLE IF NOT EXISTS space_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, space_id)
);

CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON space_members (user_id);
CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON space_members (space_id);

-- Migrate existing data: add workspace owner as member
INSERT INTO workspace_members (user_id, workspace_id, role)
SELECT u.id, w.id, 'owner'
FROM users u
CROSS JOIN workspaces w
WHERE u.role = 'owner'
ON CONFLICT (user_id, workspace_id) DO NOTHING;

-- Migrate existing data: add all users to all spaces in their workspace as members
INSERT INTO space_members (user_id, space_id, role)
SELECT u.id, s.id, 'member'
FROM users u
CROSS JOIN spaces s
WHERE u.role IN ('owner', 'admin', 'member')
ON CONFLICT (user_id, space_id) DO NOTHING;

-- Update spaces.created_by to the first owner user for existing spaces
UPDATE spaces
SET created_by = (
    SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1
)
WHERE created_by IS NULL;