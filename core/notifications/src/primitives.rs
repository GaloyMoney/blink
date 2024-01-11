use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GaloyAccountId(String);
impl From<String> for GaloyAccountId {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl AsRef<str> for GaloyAccountId {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

es_entity::entity_id! { AccountNotificationSettingsId }

#[derive(async_graphql::Enum, Copy, Clone, Eq, PartialEq, Deserialize, Serialize)]
#[graphql(name = "NotificationChannelAlt")]
pub enum NotificationChannel {
    Push,
}

#[derive(async_graphql::Enum, Copy, Clone, Eq, PartialEq, Deserialize, Serialize)]
#[graphql(name = "NotificationCategoryAlt")]
pub enum NotificationCategory {
    Circles,
}
