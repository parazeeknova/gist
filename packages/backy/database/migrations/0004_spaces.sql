CREATE TABLE IF NOT EXISTS spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add space_id to pages
ALTER TABLE pages ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES spaces(id) ON DELETE RESTRICT;

-- Seed default space
INSERT INTO spaces (id, name, slug, icon)
VALUES (gen_random_uuid(), 'Notes', 'notes', '')
ON CONFLICT (slug) DO NOTHING;

-- Backfill existing pages
UPDATE pages SET space_id = (SELECT id FROM spaces WHERE slug = 'notes' LIMIT 1)
WHERE space_id IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE pages ALTER COLUMN space_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pages_space_id ON pages (space_id);
CREATE INDEX IF NOT EXISTS idx_pages_space_parent_position ON pages (space_id, parent_page_id, position COLLATE "C");
