use async_graphql::*;

use crate::primitives::*;

#[derive(SimpleObject)]
pub(super) struct NotificationSettingsAlt {
    pub push: NotificationChannelSettingsAlt,
}

impl Default for NotificationSettingsAlt {
    fn default() -> Self {
        Self {
            push: NotificationChannelSettingsAlt {
                enabled: true,
                disabled_categories: vec![],
            },
        }
    }
}

#[derive(SimpleObject)]
pub(super) struct NotificationChannelSettingsAlt {
    pub enabled: bool,
    pub disabled_categories: Vec<NotificationCategory>,
}
