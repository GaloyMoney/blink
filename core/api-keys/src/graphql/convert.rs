use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    app::ApplicationError,
    identity::{ApiKeySecret, IdentityApiKey, IdentityError},
};

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
