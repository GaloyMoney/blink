use super::proto;
use crate::{
    app::error::ApplicationError,
    notification_event,
    primitives::*,
    user_notification_settings::{self, error::UserNotificationSettingsError},
};

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
        if let ApplicationError::UserNotificationSettingsError(
            UserNotificationSettingsError::ConcurrentModification,
        ) = err
        {
            tonic::Status::aborted(err.to_string())
        } else {
            tonic::Status::internal(err.to_string())
        }
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

impl From<proto::DeclinedReason> for notification_event::IdentityVerificationDeclinedReason {
    fn from(reason: proto::DeclinedReason) -> Self {
        match reason {
            proto::DeclinedReason::DocumentsNotClear => {
                notification_event::IdentityVerificationDeclinedReason::DocumentsNotClear
            }
            proto::DeclinedReason::VerificationPhotoNotClear => {
                notification_event::IdentityVerificationDeclinedReason::SelfieNotClear
            }
            proto::DeclinedReason::DocumentsNotSupported => {
                notification_event::IdentityVerificationDeclinedReason::DocumentsNotSupported
            }
            proto::DeclinedReason::DocumentsExpired => {
                notification_event::IdentityVerificationDeclinedReason::DocumentsExpired
            }
            proto::DeclinedReason::Other => {
                notification_event::IdentityVerificationDeclinedReason::Other
            }
            proto::DeclinedReason::DocumentsDoNotMatch => {
                notification_event::IdentityVerificationDeclinedReason::DocumentsDoNotMatch
            }
        }
    }
}

impl From<proto::TransactionType> for notification_event::TransactionType {
    fn from(reason: proto::TransactionType) -> Self {
        match reason {
            proto::TransactionType::IntraLedgerPayment => {
                notification_event::TransactionType::IntraLedgerPayment
            }
            proto::TransactionType::IntraLedgerReceipt => {
                notification_event::TransactionType::IntraLedgerReceipt
            }
            proto::TransactionType::OnchainReceipt => {
                notification_event::TransactionType::OnchainReceipt
            }
            proto::TransactionType::OnchainPayment => {
                notification_event::TransactionType::OnchainPayment
            }
            proto::TransactionType::OnchainReceiptPending => {
                notification_event::TransactionType::OnchainReceiptPending
            }
            proto::TransactionType::LightningReceipt => {
                notification_event::TransactionType::LightningReceipt
            }
            proto::TransactionType::LightningPayment => {
                notification_event::TransactionType::LightningPayment
            }
        }
    }
}
