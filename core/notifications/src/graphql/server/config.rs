use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ServerConfig {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_jwks_url")]
    pub jwks_url: String,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            port: default_port(),
            jwks_url: default_jwks_url(),
        }
    }
}

fn default_port() -> u16 {
    6684
}

fn default_jwks_url() -> String {
    "http://localhost:4456/.well-known/jwks.json".to_string()
}
