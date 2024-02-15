use thiserror::Error;

use crate::{
    job::error::JobError, push_executor::error::PushExecutorError,
    user_notification_settings::error::UserNotificationSettingsError,
};

#[derive(Error, Debug)]
pub enum ApplicationError {
    #[error("{0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
    #[error("{0}")]
    JobError(#[from] JobError),
    #[error("{0}")]
    PushExecutorError(#[from] PushExecutorError),
    #[error("{0}")]
    Sqlx(#[from] sqlx::Error),
}
