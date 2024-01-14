use crate::app::ApplicationError;
use crate::primitives::{UserNotificationCategory, UserNotificationChannel};

impl From<i32> for UserNotificationCategory {
    fn from(category: i32) -> Self {
        match category {
            0 => UserNotificationCategory::Circles,
            1 => UserNotificationCategory::Payments,
            _ => unimplemented!(),
        }
    }
}

impl From<i32> for UserNotificationChannel {
    fn from(channel: i32) -> Self {
        match channel {
            0 => UserNotificationChannel::Push,
            _ => unimplemented!(),
        }
    }
}

impl From<ApplicationError> for tonic::Status {
    fn from(err: ApplicationError) -> Self {
        match err {
            _ => tonic::Status::internal(err.to_string()),
        }
    }
}
