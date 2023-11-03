use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Clone, Serialize, Deserialize)]
#[serde_with::serde_as]
pub struct AppConfig {
    #[serde(default = "default_key_prefix")]
    pub key_prefix: String,
    #[serde_as(as = "serde_with::DurationSeconds<u64>")]
    #[serde(default = "default_expiry")]
    pub default_expiry: Duration,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            key_prefix: default_key_prefix(),
            default_expiry: default_expiry(),
        }
    }
}

fn default_key_prefix() -> String {
    "galoy_dev".to_string()
}

fn default_expiry() -> Duration {
    Duration::from_secs(60 * 60 * 24 * 30)
}
