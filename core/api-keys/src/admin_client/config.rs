use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct AdminClientConfig {
    #[serde(default)]
    pub admin_api: String,
    #[serde(default)]
    pub hydra_api: String,

    #[serde(default)]
    pub client_id: String,
    #[serde(default)]
    pub client_secret: String,
}
