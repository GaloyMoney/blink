CREATE TABLE email_reminder_projection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    galoy_user_id VARCHAR UNIQUE NOT NULL,
    user_created_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_transaction_at TIMESTAMPTZ 
);
