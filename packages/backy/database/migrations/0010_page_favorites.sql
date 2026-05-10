CREATE TABLE IF NOT EXISTS page_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, page_id)
);
