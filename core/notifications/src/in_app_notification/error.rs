use thiserror::Error;

#[derive(Error, Debug)]
pub enum InAppNotificationError {
    #[error("InAppNotificationError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
}
