use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GaloyUserId(String);
impl From<String> for GaloyUserId {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl AsRef<str> for GaloyUserId {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for GaloyUserId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

es_entity::entity_id! { UserNotificationSettingsId }

#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct Locale(String);
impl From<String> for Locale {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl AsRef<str> for Locale {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for Locale {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(async_graphql::Enum, Debug, Copy, Clone, Eq, PartialEq, Deserialize, Serialize)]
#[graphql(name = "UserNotificationChannel")]
pub enum UserNotificationChannel {
    Push,
}

#[derive(async_graphql::Enum, Debug, Hash, Copy, Clone, Eq, PartialEq, Deserialize, Serialize)]
#[graphql(name = "UserNotificationCategory")]
pub enum UserNotificationCategory {
    Circles,
    Payments,
    Balance,
    AdminNotification,
}
