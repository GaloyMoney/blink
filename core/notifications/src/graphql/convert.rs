use super::types;
use crate::{user_notification_settings, primitives::*};

impl From<user_notification_settings::UserNotificationSettings> for types::UserNotificationSettings {
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
