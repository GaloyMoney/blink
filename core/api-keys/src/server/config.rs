use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ServerConfig {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_api_key_auth_header")]
    pub api_key_auth_header: String,
    #[serde(default = "default_oathkeeper_jwks_url")]
    pub oathkeeper_jwks_url: String,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            port: default_port(),
            api_key_auth_header: default_api_key_auth_header(),
            oathkeeper_jwks_url: default_oathkeeper_jwks_url(),
        }
    }
}

fn default_port() -> u16 {
    5397
}

fn default_api_key_auth_header() -> String {
    "X-API-KEY".to_string()
}

fn default_oathkeeper_jwks_url() -> String {
    "http://localhost:4456/.well-known/jwks.json".to_string()
}
