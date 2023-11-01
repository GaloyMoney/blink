use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct AdminClientConfig {
    #[serde(default)]
    pub api: String,
    #[serde(default)]
    pub client_id: String,
    pub client_secret: String,
}
