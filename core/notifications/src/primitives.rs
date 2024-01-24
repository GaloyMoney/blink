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
pub struct GaloyLocale(String);
impl From<String> for GaloyLocale {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl AsRef<str> for GaloyLocale {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for GaloyLocale {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize, Hash)]
pub struct PushDeviceToken(String);
impl From<String> for PushDeviceToken {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl AsRef<str> for PushDeviceToken {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for PushDeviceToken {
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

#[derive(Debug)]
pub enum CircleType {
    Inner,
    Outer,
}
