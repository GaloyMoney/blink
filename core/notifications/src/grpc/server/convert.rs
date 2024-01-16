use crate::app::error::ApplicationError;
use crate::primitives::{UserNotificationCategory, UserNotificationChannel};

use super::proto;

impl From<proto::NotificationCategory> for UserNotificationCategory {
    fn from(category: proto::NotificationCategory) -> Self {
        match category {
            proto::NotificationCategory::Circles => UserNotificationCategory::Circles,
            proto::NotificationCategory::Payments => UserNotificationCategory::Payments,
        }
    }
}

impl From<proto::NotificationChannel> for UserNotificationChannel {
    fn from(channel: proto::NotificationChannel) -> Self {
        match channel {
            proto::NotificationChannel::Push => UserNotificationChannel::Push,
        }
    }
}

impl From<ApplicationError> for tonic::Status {
    fn from(err: ApplicationError) -> Self {
        tonic::Status::internal(err.to_string())
    }
}
