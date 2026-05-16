CREATE TABLE IF NOT EXISTS page_watchers (
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (page_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_page_watchers_user ON page_watchers (user_id, created_at DESC);
