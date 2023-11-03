use thiserror::Error;

use crate::identity::IdentityError;

#[derive(Error, Debug)]
pub enum ApplicationError {
    #[error("ApplicationError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("ApplicationError - IdentityError: {0}")]
    Identity(#[from] IdentityError),
}
