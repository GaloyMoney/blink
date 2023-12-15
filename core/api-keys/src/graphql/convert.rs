use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    app::ApplicationError,
    identity::{ApiKeySecret, IdentityApiKey, IdentityError},
};

use super::{
    schema::{ApiKey, ApiKeyCreatePayload, ApiKeyRevokePayload},
    Timestamp,
};

impl From<IdentityApiKey> for ApiKey {
    fn from(key: IdentityApiKey) -> Self {
        ApiKey {
            id: key.id.to_string().into(),
            name: key.name,
            revoked: key.revoked,
            expired: key.expired,
            last_used_at: key.last_used_at.map(Timestamp::from),
            created_at: Timestamp::from(key.created_at),
            expires_at: key.expires_at.map(Timestamp::from),
            read_only: key.read_only,
        }
    }
}
impl From<(IdentityApiKey, ApiKeySecret)> for ApiKeyCreatePayload {
    fn from((key, secret): (IdentityApiKey, ApiKeySecret)) -> Self {
        Self {
            api_key: ApiKey::from(key),
            api_key_secret: secret.into_inner(),
        }
    }
}

impl From<IdentityApiKey> for ApiKeyRevokePayload {
    fn from(key: IdentityApiKey) -> Self {
        Self {
            api_key: ApiKey::from(key),
        }
    }
}

impl IntoResponse for ApplicationError {
    fn into_response(self) -> Response {
        match self {
            ApplicationError::Identity(IdentityError::NoActiveKeyFound)
            | ApplicationError::Identity(IdentityError::MismatchedPrefix) => {
                (StatusCode::UNAUTHORIZED, self.to_string()).into_response()
            }
            ApplicationError::MissingApiKey | ApplicationError::BadKeyFormat(_) => {
                (StatusCode::BAD_REQUEST, self.to_string()).into_response()
            }
            e => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
        }
    }
}
