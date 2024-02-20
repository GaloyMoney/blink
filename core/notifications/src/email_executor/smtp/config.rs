use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct SmtpConfig {
    pub username: String,
    #[serde(default)]
    pub password: String,
    pub from_email: String,
    pub relay: String,
    pub port: u16,
}
