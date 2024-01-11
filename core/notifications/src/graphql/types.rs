use async_graphql::*;

#[derive(SimpleObject)]
pub(super) struct NotificationSettingsAlt {
    pub push: NotificationChannelSettingsAlt,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub(super) enum NotificationCategoryAlt {
    Circles,
}

#[derive(SimpleObject)]
pub(super) struct NotificationChannelSettingsAlt {
    pub enabled: bool,
    pub disabled_categories: Vec<NotificationCategoryAlt>,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub(super) enum NotificationChannelAlt {
    Push,
}
