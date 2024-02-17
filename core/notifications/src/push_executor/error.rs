use thiserror::Error;

use super::fcm::error::FcmError;
use crate::user_notification_settings::error::*;

#[derive(Error, Debug)]
pub enum PushExecutorError {
    #[error("ExecutorError - FcmError: {0}")]
    Fcm(#[from] FcmError),
    #[error("ExecutorError - UserNotificationSettingsError: {0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
}
