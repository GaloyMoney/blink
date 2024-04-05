use thiserror::Error;

use crate::in_app_channel_service::error::InAppChannelServiceError;

#[derive(Error, Debug)]
pub enum InAppExecutorError {
    #[error("InAppExecutorError - InAppChannelServiceError: {0}")]
    InAppChannelServiceError(#[from] InAppChannelServiceError),
}
