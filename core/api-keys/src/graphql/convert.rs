use crate::identity::{ApiKeySecret, IdentityApiKey};

use super::schema::{ApiKey, ApiKeyCreatePayload};

impl From<(IdentityApiKey, ApiKeySecret)> for ApiKeyCreatePayload {
    fn from((key, secret): (IdentityApiKey, ApiKeySecret)) -> Self {
        Self {
            api_key: ApiKey {
                id: key.id.to_string().into(),
                name: key.name,
                created_at: key.created_at,
                expires_at: key.expires_at,
            },
            api_key_secret: secret.into_inner(),
        }
    }
}
