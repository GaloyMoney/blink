use thiserror::Error;

#[derive(Error, Debug)]
pub enum IdentityError {
    #[error("IdentityError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
}
