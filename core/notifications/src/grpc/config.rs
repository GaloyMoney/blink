use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct GrpcServerConfig {
    #[serde(default = "default_port")]
    pub port: u16,
}

impl Default for GrpcServerConfig {
    fn default() -> Self {
        Self {
            port: default_port(),
        }
    }
}

fn default_port() -> u16 {
    6685
}
