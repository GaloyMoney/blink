-- Add up migration script here
CREATE TABLE user_transaction_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    galoy_user_id VARCHAR UNIQUE NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
