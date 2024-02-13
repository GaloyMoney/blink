use super::proto;
use crate::app::error::ApplicationError;
use crate::primitives::*;
use crate::user_notification_settings;

impl From<proto::NotificationCategory> for UserNotificationCategory {
    fn from(category: proto::NotificationCategory) -> Self {
        match category {
            proto::NotificationCategory::Circles => UserNotificationCategory::Circles,
            proto::NotificationCategory::Payments => UserNotificationCategory::Payments,
            proto::NotificationCategory::Balance => UserNotificationCategory::Balance,
            proto::NotificationCategory::AdminNotification => {
                UserNotificationCategory::AdminNotification
            }
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

impl From<user_notification_settings::UserNotificationSettings> for proto::NotificationSettings {
    fn from(settings: user_notification_settings::UserNotificationSettings) -> Self {
        Self {
            locale: settings.locale().map(|l| l.to_string()),
            push: Some(proto::ChannelNotificationSettings {
                enabled: settings.is_channel_enabled(UserNotificationChannel::Push),
                disabled_categories: settings
                    .disabled_categories_for(UserNotificationChannel::Push)
                    .into_iter()
                    .map(|category| proto::NotificationCategory::from(category).into())
                    .collect(),
            }),
            push_device_tokens: settings
                .push_device_tokens()
                .into_iter()
                .map(|token| token.to_string())
                .collect(),
        }
    }
}

impl From<UserNotificationCategory> for proto::NotificationCategory {
    fn from(category: UserNotificationCategory) -> Self {
        match category {
            UserNotificationCategory::Circles => proto::NotificationCategory::Circles,
            UserNotificationCategory::Payments => proto::NotificationCategory::Payments,
            UserNotificationCategory::Balance => proto::NotificationCategory::Balance,
            UserNotificationCategory::AdminNotification => {
                proto::NotificationCategory::AdminNotification
            }
        }
    }
}

impl From<proto::CircleType> for CircleType {
    fn from(c_type: proto::CircleType) -> Self {
        match c_type {
            proto::CircleType::Inner => CircleType::Inner,
            proto::CircleType::Outer => CircleType::Outer,
        }
    }
}

impl From<proto::CircleTimeFrame> for CircleTimeFrame {
    fn from(c_type: proto::CircleTimeFrame) -> Self {
        match c_type {
            proto::CircleTimeFrame::Month => CircleTimeFrame::Month,
            proto::CircleTimeFrame::AllTime => CircleTimeFrame::AllTime,
        }
    }
}

impl From<proto::DeclinedReason> for IdentityVerificationDeclinedReason {
    fn from(reason: proto::DeclinedReason) -> Self {
        match reason {
            proto::DeclinedReason::DocumentsNotClear => {
                IdentityVerificationDeclinedReason::DocumentsNotClear
            }
            proto::DeclinedReason::VerificationPhotoNotClear => {
                IdentityVerificationDeclinedReason::VerificationPhotoNotClear
            }
        }
    }
}
