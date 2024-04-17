mod email_formatter;

pub use email_formatter::EmailFormatter;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalizedPushMessage {
    pub title: String,
    pub body: String,
}

pub struct LocalizedEmail {
    pub subject: String,
    pub body: String,
}

pub struct LocalizedInAppMessage {
    pub title: String,
    pub body: String,
}

pub struct LocalizedPersistentMessage {
    pub title: String,
    pub body: String,
}
