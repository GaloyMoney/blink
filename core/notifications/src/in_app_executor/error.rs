use thiserror::Error;

use crate::in_app_channel::error::InAppChannelError;

#[derive(Error, Debug)]
pub enum InAppExecutorError {
    #[error("InAppExecutorError - InAppChannelError: {0}")]
    InAppChannelError(#[from] InAppChannelError),
}
