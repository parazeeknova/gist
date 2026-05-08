-- System-wide settings for feature toggles and configuration
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT 'false',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO system_settings (key, value) VALUES ('debug_routes', 'false') ON CONFLICT (key) DO NOTHING;
INSERT INTO system_settings (key, value) VALUES ('debug_api', 'false') ON CONFLICT (key) DO NOTHING;
