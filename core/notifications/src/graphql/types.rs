use async_graphql::*;

use crate::primitives::*;

#[derive(SimpleObject)]
pub(super) struct NotificationSettingsAlt {
    pub push: NotificationChannelSettingsAlt,
}

#[derive(SimpleObject)]
pub(super) struct NotificationChannelSettingsAlt {
    pub enabled: bool,
    pub disabled_categories: Vec<NotificationCategory>,
}
