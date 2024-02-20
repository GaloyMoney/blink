use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GaloyUserId(String);
impl GaloyUserId {
    pub fn into_inner(self) -> String {
        self.0
    }
}

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

impl Default for GaloyLocale {
    fn default() -> Self {
        Self("en".to_string())
    }
}

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
impl PushDeviceToken {
    pub fn into_inner(self) -> String {
        self.0
    }
}
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

#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize, Hash)]
pub struct GaloyEmailAddress(String);
impl GaloyEmailAddress {
    pub fn into_inner(self) -> String {
        self.0
    }
}
impl From<String> for GaloyEmailAddress {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl AsRef<str> for GaloyEmailAddress {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for GaloyEmailAddress {
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum CircleType {
    Inner,
    Outer,
}

impl std::fmt::Display for CircleType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CircleType::Inner => write!(f, "inner"),
            CircleType::Outer => write!(f, "outer"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum CircleTimeFrame {
    Month,
    AllTime,
}

impl std::fmt::Display for CircleTimeFrame {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CircleTimeFrame::Month => write!(f, "month"),
            CircleTimeFrame::AllTime => write!(f, "all_time"),
        }
    }
}
