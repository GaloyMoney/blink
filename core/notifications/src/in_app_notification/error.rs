use thiserror::Error;

#[derive(Error, Debug)]
pub enum InAppNotificationError {
    #[error("InAppChannelError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
}
