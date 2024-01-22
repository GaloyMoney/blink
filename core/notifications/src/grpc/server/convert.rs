use super::proto;
use crate::app::error::ApplicationError;
use crate::circles_notifications::*;
use crate::primitives::{UserNotificationCategory, UserNotificationChannel};
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

impl From<user_notification_settings::UserNotificationSettings>
    for proto::UserNotificationSettings
{
    fn from(settings: user_notification_settings::UserNotificationSettings) -> Self {
        Self {
            push: Some(proto::ChannelNotificationSettings {
                enabled: settings.is_channel_enabled(UserNotificationChannel::Push),
                disabled_categories: settings
                    .disabled_categories_for(UserNotificationChannel::Push)
                    .into_iter()
                    .map(|category| proto::NotificationCategory::from(category).into())
                    .collect(),
            }),
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
    fn from(circle_type: proto::CircleType) -> Self {
        match circle_type {
            proto::CircleType::Inner => CircleType::Inner,
            proto::CircleType::Outer => CircleType::Outer,
        }
    }
}

impl From<proto::CircleThresholdType> for ThresholdType {
    fn from(threshold_type: proto::CircleThresholdType) -> Self {
        match threshold_type {
            proto::CircleThresholdType::ThisMonth => ThresholdType::ThisMonth,
            proto::CircleThresholdType::AllTime => ThresholdType::AllTime,
        }
    }
}

impl TryFrom<proto::notify_user_of_circles_event_request::CirclesEvent> for CirclesEvent {
    type Error = prost::DecodeError;

    fn try_from(
        event: proto::notify_user_of_circles_event_request::CirclesEvent,
    ) -> Result<Self, Self::Error> {
        let circles_event = match event {
            proto::notify_user_of_circles_event_request::CirclesEvent::CircleGrew(event) => {
                CirclesEvent::CircleGrew {
                    circle_type: CircleType::from(proto::CircleType::try_from(event.circle_type)?),
                    this_month_circle_size: event.this_month_circle_size,
                    all_time_circle_size: event.all_time_circle_size,
                }
            }
            proto::notify_user_of_circles_event_request::CirclesEvent::CircleThresholdReached(
                event,
            ) => CirclesEvent::CircleThresholdReached {
                circle_type: CircleType::from(proto::CircleType::try_from(event.circle_type)?),
                threshold_type: ThresholdType::from(proto::CircleThresholdType::try_from(
                    event.threshold_type,
                )?),
                threshold: event.threshold,
            },
        };
        Ok(circles_event)
    }
}
