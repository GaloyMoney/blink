use thiserror::Error;

use crate::{
    executor::error::ExecutorError, job::error::JobError,
    user_notification_settings::error::UserNotificationSettingsError,
};

#[derive(Error, Debug)]
pub enum ApplicationError {
    #[error("{0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
    #[error("{0}")]
    JobError(#[from] JobError),
    #[error("{0}")]
    ExecutorError(#[from] ExecutorError),
    #[error("{0}")]
    Sqlx(#[from] sqlx::Error),
}
