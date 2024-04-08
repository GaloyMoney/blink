use thiserror::Error;

use crate::in_app_notification::error::InAppNotificationError;

#[derive(Error, Debug)]
pub enum InAppExecutorError {
    #[error("InAppExecutorError - InAppChannelError: {0}")]
    InAppChannelError(#[from] InAppNotificationError),
}
