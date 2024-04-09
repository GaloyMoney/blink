use async_graphql::ID;

use super::types;
use crate::{in_app_notification, primitives::*, user_notification_settings};

impl From<user_notification_settings::UserNotificationSettings>
    for types::UserNotificationSettings
{
    fn from(settings: user_notification_settings::UserNotificationSettings) -> Self {
        Self {
            push: types::UserNotificationChannelSettings {
                enabled: settings.is_channel_enabled(UserNotificationChannel::Push),
                disabled_categories: settings
                    .disabled_categories_for(UserNotificationChannel::Push)
                    .into_iter()
                    .collect(),
            },
        }
    }
}

impl From<in_app_notification::InAppNotification> for types::InAppNotification {
    fn from(notification: in_app_notification::InAppNotification) -> Self {
        Self {
            id: ID(notification.id.to_string()),
            title: notification.title,
            body: notification.body,
            deep_link: notification.deep_link.map(|d| d.to_link_string()),
            created_at: types::Timestamp::from(notification.created_at),
            read_at: notification.read_at.map(types::Timestamp::from),
        }
    }
}
