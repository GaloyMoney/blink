use serde::{Deserialize, Serialize};

use crate::admin_client::AdminClientConfig;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Config {
    #[serde(default)]
    pub admin: AdminClientConfig,
}

pub struct EnvOverride {
    pub client_id: String,
    pub client_secret: String,
    pub admin_api: String,
    pub hydra_api: String,
}

impl Config {
    pub fn from_env(
        EnvOverride {
            client_id,
            client_secret,
            admin_api,
            hydra_api,
        }: EnvOverride,
    ) -> anyhow::Result<Self> {
        let mut config: Config = Config::default();

        config.admin.client_id = client_id;
        config.admin.client_secret = client_secret;
        config.admin.hydra_api = hydra_api;
        config.admin.admin_api = admin_api;

        Ok(config)
    }
}
