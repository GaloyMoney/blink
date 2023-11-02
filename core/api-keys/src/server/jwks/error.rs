use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum JwksError {
    #[error("JwksError - NoKeyAvailable")]
    NoKeyAvailable,
    #[error("JwksError - Jwt: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
    #[error("JwksError - Reqwest: {0}")]
    Reqwest(#[from] reqwest::Error),
}

pub enum AuthError {
    InvalidToken,
    MissingToken,
    ExpiredToken,
    InvalidSignature,
    InternalError,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, msg) = match self {
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid token"),
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing token"),
            AuthError::ExpiredToken => (StatusCode::UNAUTHORIZED, "Expired token"),
            AuthError::InvalidSignature => (StatusCode::UNAUTHORIZED, "Invalid signature"),
            AuthError::InternalError => (StatusCode::INTERNAL_SERVER_ERROR, "Internal error"),
        };

        (status, msg).into_response()
    }
}
