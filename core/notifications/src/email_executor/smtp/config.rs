use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct SmtpConfig {
    #[serde(default)]
    pub username: String,
    #[serde(default)]
    pub password: String,
    #[serde(default)]
    pub from_email: String,
    #[serde(default)]
    pub relay: String,
    #[serde(default)]
    pub port: u16,
}
