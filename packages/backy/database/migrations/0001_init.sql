CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    is_owner BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Password credentials
CREATE TABLE IF NOT EXISTS password_credentials (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    device_name TEXT DEFAULT 'unknown device',
    expires_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rotated_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id ON refresh_tokens (session_id);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT '',
    enforce_mfa BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spaces
CREATE TABLE IF NOT EXISTS spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spaces_workspace_id ON spaces (workspace_id);

-- Pages
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    cover_photo TEXT NOT NULL DEFAULT '',
    content_json JSONB NOT NULL DEFAULT '{}',
    ydoc BYTEA,
    text_content TEXT NOT NULL DEFAULT '',
    position TEXT NOT NULL DEFAULT '',
    is_published BOOLEAN NOT NULL DEFAULT false,
    parent_page_id UUID REFERENCES pages (id) ON DELETE SET NULL,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE RESTRICT,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    creator_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    last_updated_by_id UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pages_parent_page_id ON pages (parent_page_id);
CREATE INDEX IF NOT EXISTS idx_pages_creator_id ON pages (creator_id);
CREATE INDEX IF NOT EXISTS idx_pages_is_published ON pages (is_published);
CREATE INDEX IF NOT EXISTS idx_pages_space_id ON pages (space_id);
CREATE INDEX IF NOT EXISTS idx_pages_workspace_id ON pages (workspace_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_position ON pages (parent_page_id, position COLLATE "C");
CREATE INDEX IF NOT EXISTS idx_pages_space_parent_position ON pages (space_id, parent_page_id, position COLLATE "C");

-- Page history
CREATE TABLE IF NOT EXISTS page_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_json JSONB NOT NULL DEFAULT '{}',
    ydoc BYTEA,
    text_content TEXT NOT NULL DEFAULT '',
    operation TEXT NOT NULL,
    created_by_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_history_page_id ON page_history (page_id);
CREATE INDEX IF NOT EXISTS idx_page_history_created_at ON page_history (created_at);
CREATE INDEX IF NOT EXISTS idx_page_history_page_id_created_at ON page_history (page_id, created_at DESC);

-- MFA
CREATE TABLE IF NOT EXISTS user_mfa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    method TEXT NOT NULL DEFAULT 'totp',
    secret TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    backup_code_hashes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa (user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_workspace_id ON user_mfa (workspace_id);

-- Workspace membership
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

-- Space membership (admin / writer / reader)
CREATE TABLE IF NOT EXISTS space_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'writer', 'reader')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, space_id)
);

CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON space_members (user_id);
CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON space_members (space_id);

-- ============================================================================
-- Schema evolution: add columns safely to existing tables
-- ============================================================================

-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'admin', 'member'));

-- sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_name TEXT DEFAULT 'unknown device';

-- workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS default_space_id UUID;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- spaces
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private';
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS default_role TEXT NOT NULL DEFAULT 'reader';
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- spaces visibility/default_role constraints
ALTER TABLE spaces DROP CONSTRAINT IF EXISTS spaces_visibility_check;
ALTER TABLE spaces ADD CONSTRAINT spaces_visibility_check CHECK (visibility IN ('private', 'public'));
ALTER TABLE spaces DROP CONSTRAINT IF EXISTS spaces_default_role_check;
ALTER TABLE spaces ADD CONSTRAINT spaces_default_role_check CHECK (default_role IN ('admin', 'writer', 'reader'));

-- pages
ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS deleted_by_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- pages indexes
CREATE INDEX IF NOT EXISTS idx_pages_deleted_at ON pages (deleted_at);
CREATE INDEX IF NOT EXISTS idx_spaces_deleted_at ON spaces (deleted_at);

-- spaces slug unique per workspace
ALTER TABLE spaces DROP CONSTRAINT IF EXISTS spaces_slug_key;
ALTER TABLE spaces DROP CONSTRAINT IF EXISTS spaces_workspace_slug_unique;
ALTER TABLE spaces ADD CONSTRAINT spaces_workspace_slug_unique UNIQUE (workspace_id, slug);

-- workspaces FK to default_space_id
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS fk_workspaces_default_space_id;
ALTER TABLE workspaces ADD CONSTRAINT fk_workspaces_default_space_id
    FOREIGN KEY (default_space_id) REFERENCES spaces(id) ON DELETE SET NULL;
