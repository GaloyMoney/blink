use thiserror::Error;

use super::fcm::error::FcmError;
use crate::user_notification_settings::error::*;

#[derive(Error, Debug)]
pub enum ExecutorError {
    #[error("ExecutorError - Novu: {0}")]
    Fcm(#[from] FcmError),
    #[error("ExecutorError - UserNotificationSettingsError: {0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
}
