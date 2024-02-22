use axum::http::header::ToStrError;
use thiserror::Error;

use crate::identity::IdentityError;

#[derive(Error, Debug)]
pub enum ApplicationError {
    #[error("ApplicationError - MissingScopes")]
    MissingScopes,
    #[error("ApplicationError - MissingApiKey")]
    MissingApiKey,
    #[error("ApplicationError - BadKeyFormat: {0}")]
    BadKeyFormat(#[from] ToStrError),
    #[error("ApplicationError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("ApplicationError - IdentityError: {0}")]
    Identity(#[from] IdentityError),
}
