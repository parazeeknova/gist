ALTER TABLE pages ADD COLUMN IF NOT EXISTS position TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_pages_parent_position ON pages (parent_page_id, position COLLATE "C");
