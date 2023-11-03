use thiserror::Error;

#[derive(Error, Debug)]
pub enum IdentityError {
    #[error("IdentityError - MismatchedPrefix")]
    MismatchedPrefix,
    #[error("IdentityError - NoActiveKeyFound")]
    NoActiveKeyFound,
    #[error("IdentityError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
}
