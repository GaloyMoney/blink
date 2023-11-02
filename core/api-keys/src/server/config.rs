use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ServerConfig {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_oathkeeper_jwks_url")]
    pub oathkeeper_jwks_url: String,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            port: default_port(),
            oathkeeper_jwks_url: default_oathkeeper_jwks_url(),
        }
    }
}

fn default_port() -> u16 {
    5397
}

fn default_oathkeeper_jwks_url() -> String {
    "http://localhost:4456/.well-known/jwks.json".to_string()
}
