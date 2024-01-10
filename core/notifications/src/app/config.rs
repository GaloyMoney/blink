use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[serde_with::serde_as]
pub struct AppConfig {}

impl Default for AppConfig {
    fn default() -> Self {
        Self {}
    }
}
