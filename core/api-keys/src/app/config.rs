use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Clone, Serialize, Deserialize)]
#[serde_with::serde_as]
pub struct AppConfig {
    #[serde(default = "default_key_prefix")]
    pub key_prefix: String,
    #[serde(default = "default_expiry_days")]
    pub default_expiry_days: u32,
}

impl AppConfig {
    pub fn default_expiry(&self) -> Duration {
        Duration::from_secs(self.default_expiry_days as u64 * 24 * 60 * 60)
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            key_prefix: default_key_prefix(),
            default_expiry_days: default_expiry_days(),
        }
    }
}

fn default_key_prefix() -> String {
    "dev".to_string()
}

fn default_expiry_days() -> u32 {
    30
}
