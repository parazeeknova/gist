CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    cover_photo TEXT NOT NULL DEFAULT '',
    content_json JSONB NOT NULL DEFAULT '{}',
    ydoc BYTEA,
    text_content TEXT NOT NULL DEFAULT '',
    is_published BOOLEAN NOT NULL DEFAULT false,
    parent_page_id UUID REFERENCES pages (id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    last_updated_by_id UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pages_slug_id ON pages (slug_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_page_id ON pages (parent_page_id);
CREATE INDEX IF NOT EXISTS idx_pages_creator_id ON pages (creator_id);
CREATE INDEX IF NOT EXISTS idx_pages_is_published ON pages (is_published);

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
