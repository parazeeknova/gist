-- ============================================================================
-- Groups: workspace-scoped permission bundles
-- ============================================================================
-- Groups table
CREATE TABLE
    IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        workspace_id UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        is_default BOOLEAN NOT NULL DEFAULT false,
        creator_id UUID REFERENCES users (id) ON DELETE SET NULL,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE INDEX IF NOT EXISTS idx_groups_workspace_id ON groups (workspace_id);

CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups (deleted_at);

-- Unique name per workspace (excluding deleted groups)
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_workspace_name_unique ON groups (workspace_id, name)
WHERE
    deleted_at IS NULL;

-- Group members (users in a group)
CREATE TABLE
    IF NOT EXISTS group_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        group_id UUID NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        UNIQUE (group_id, user_id)
    );

CREATE INDEX IF NOT EXISTS idx_group_users_group_id ON group_users (group_id);

CREATE INDEX IF NOT EXISTS idx_group_users_user_id ON group_users (user_id);

-- ============================================================================
-- Extend space_members to support group-based membership
-- ============================================================================
-- Make user_id nullable and add group_id
ALTER TABLE space_members
ALTER COLUMN user_id
DROP NOT NULL;

ALTER TABLE space_members
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups (id) ON DELETE CASCADE;

-- Ensure exactly one of user_id or group_id is set
ALTER TABLE space_members
DROP CONSTRAINT IF EXISTS space_members_user_or_group_check;

ALTER TABLE space_members ADD CONSTRAINT space_members_user_or_group_check CHECK (
    (user_id IS NOT NULL)
    OR (group_id IS NOT NULL)
);

-- Replace unique constraint with partial indexes for user and group memberships
DROP INDEX IF EXISTS idx_space_members_user_id;

DROP INDEX IF EXISTS idx_space_members_space_id;

CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON space_members (space_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_space_members_user_unique ON space_members (space_id, user_id)
WHERE
    user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_space_members_group_unique ON space_members (space_id, group_id)
WHERE
    group_id IS NOT NULL;