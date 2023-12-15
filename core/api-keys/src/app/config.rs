use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[serde_with::serde_as]
pub struct AppConfig {
    #[serde(default = "default_key_prefix")]
    pub key_prefix: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            key_prefix: default_key_prefix(),
        }
    }
}

fn default_key_prefix() -> String {
    "dev".to_string()
}
