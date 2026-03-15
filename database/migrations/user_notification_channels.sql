-- Migration: user_notification_channels
-- Purpose: Track which messaging channels (WhatsApp, Telegram) each user has linked.
-- Both channels share command logic via the unified messaging layer on Server 1.

CREATE TABLE user_notification_channels (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel       TEXT NOT NULL CHECK (channel IN ('whatsapp', 'telegram')),
    channel_id    TEXT NOT NULL,   -- WA: phone number | TG: chat_id
    is_active     BOOLEAN DEFAULT TRUE,
    linked_at     TIMESTAMPTZ DEFAULT NOW(),
    last_used_at  TIMESTAMPTZ,
    UNIQUE (user_id, channel)
);

-- RLS: users can read their own channel records
ALTER TABLE user_notification_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_channels"
    ON user_notification_channels FOR SELECT
    USING (auth.uid() = user_id);

-- Service role (Servers 2/3) handles all writes — no INSERT/UPDATE/DELETE policies for users

-- Fast lookup by user_id for outbound routing
CREATE INDEX idx_notif_channels_user ON user_notification_channels(user_id);
