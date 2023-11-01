use serde::{Deserialize, Serialize};

use crate::admin_client::{AdminClientConfig, OAuthGrantConfig};
use crate::graphql::ServerConfig;

#[derive(Clone, Default, Serialize, Deserialize)]
pub struct Config {
    #[serde(default)]
    pub admin: AdminClientConfig,
    #[serde(default)]
    pub hydra: OAuthGrantConfig,
    #[serde(default)]
    pub server: ServerConfig,
}

pub struct EnvOverride {
    pub client_id: String,
    pub client_secret: String,
}

impl Config {
    pub fn from_env(
        EnvOverride {
            client_id,
            client_secret,
        }: EnvOverride,
    ) -> anyhow::Result<Self> {
        let mut config: Config = Config::default();

        config.hydra.client_id = client_id;
        config.hydra.client_secret = client_secret;

        Ok(config)
    }
}
