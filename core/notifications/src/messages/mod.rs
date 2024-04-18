mod email_formatter;

pub use email_formatter::EmailFormatter;
use serde::{Deserialize, Serialize};

use crate::primitives::GaloyLocale;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalizedPushMessage {
    pub title: String,
    pub body: String,
}

pub struct LocalizedEmail {
    pub subject: String,
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalizedStatefulMessage {
    pub locale: GaloyLocale,
    pub title: String,
    pub body: String,
}
