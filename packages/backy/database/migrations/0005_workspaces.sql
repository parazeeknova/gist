CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add workspace_id to spaces
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE RESTRICT;

-- Add workspace_id to pages
ALTER TABLE pages ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE RESTRICT;

-- Seed default workspace
INSERT INTO workspaces (id, name, slug, icon)
VALUES (gen_random_uuid(), 'Personal', 'personal', '')
ON CONFLICT (slug) DO NOTHING;

-- Seed default space
INSERT INTO spaces (id, name, slug, icon, workspace_id)
SELECT gen_random_uuid(), 'Notes', 'notes', '', (SELECT id FROM workspaces WHERE slug = 'personal' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM spaces)
ON CONFLICT (slug) DO NOTHING;

-- Backfill spaces
UPDATE spaces SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'personal' LIMIT 1)
WHERE workspace_id IS NULL;

-- Backfill pages: space_id
UPDATE pages SET space_id = (SELECT id FROM spaces WHERE slug = 'notes' LIMIT 1)
WHERE space_id IS NULL;

-- Backfill pages: workspace_id
UPDATE pages SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'personal' LIMIT 1)
WHERE workspace_id IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE pages ALTER COLUMN space_id SET NOT NULL;
ALTER TABLE spaces ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE pages ALTER COLUMN workspace_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_spaces_workspace_id ON spaces (workspace_id);
CREATE INDEX IF NOT EXISTS idx_pages_workspace_id ON pages (workspace_id);
