use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::path::Path;

use crate::admin_client::AdminClientConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    #[serde(default)]
    pub admin: AdminClientConfig,
}

pub struct EnvOverride {
    pub client_id: String,
    pub client_secret: String,
}

impl Config {
    pub fn from_path(
        path: impl AsRef<Path>,
        EnvOverride {
            client_id,
            client_secret,
        }: EnvOverride,
    ) -> anyhow::Result<Self> {
        let config_file = std::fs::read_to_string(path).context("Couldn't read config file")?;
        let mut config: Config =
            serde_yaml::from_str(&config_file).context("Couldn't parse config file")?;

        config.admin.client_id = client_id;
        config.admin.client_secret = client_secret;

        Ok(config)
    }
}
