use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct ServerConfig {
    #[serde(default = "default_port")]
    port: u16,
}

fn default_port() -> u16 {
    5397
}
