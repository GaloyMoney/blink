use async_graphql::*;

use crate::primitives::*;

#[derive(SimpleObject)]
pub(super) struct UserNotificationSettings {
    pub push: UserNotificationChannelSettings,
}

#[derive(SimpleObject)]
pub(super) struct UserNotificationChannelSettings {
    pub enabled: bool,
    pub disabled_categories: Vec<UserNotificationCategory>,
}
