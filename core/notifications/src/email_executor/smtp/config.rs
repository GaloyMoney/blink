use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct SmtpConfig {
    pub username: String,
    pub password: String,
}
