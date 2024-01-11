use super::types::*;
use crate::{account_notification_settings::*, primitives::*};

impl From<AccountNotificationSettings> for NotificationSettingsAlt {
    fn from(settings: AccountNotificationSettings) -> Self {
        NotificationSettingsAlt {
            push: NotificationChannelSettingsAlt {
                enabled: settings.is_channel_enabled(NotificationChannel::Push),
                disabled_categories: settings
                    .disabled_categories_for(NotificationChannel::Push)
                    .into_iter()
                    .collect(),
            },
        }
    }
}
