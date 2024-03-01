use thiserror::Error;

use crate::{
    email_executor::error::EmailExecutorError, job::error::JobError,
    notification_cool_off_tracker::NotificationCoolOffTrackerError,
    push_executor::error::PushExecutorError,
    user_notification_settings::error::UserNotificationSettingsError,
};

#[derive(Error, Debug)]
pub enum ApplicationError {
    #[error("{0}")]
    UnknownCurrencyCode(String),
    #[error("{0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
    #[error("{0}")]
    JobError(#[from] JobError),
    #[error("{0}")]
    PushExecutorError(#[from] PushExecutorError),
    #[error("{0}")]
    EmailExecutorError(#[from] EmailExecutorError),
    #[error("{0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("{0}")]
    NotificationCoolOffTrackerError(#[from] NotificationCoolOffTrackerError),
}
