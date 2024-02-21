use thiserror::Error;

use crate::messages::error::*;

#[derive(Error, Debug)]
pub enum NotificationEventError {
    #[error("NotificationEvent - MessageError: {0}")]
    MessagesError(#[from] MessagesError),
}
