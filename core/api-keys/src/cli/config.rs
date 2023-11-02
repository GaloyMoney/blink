use serde::{Deserialize, Serialize};

use crate::server::ServerConfig;

#[derive(Clone, Default, Serialize, Deserialize)]
pub struct Config {
    #[serde(default)]
    pub server: ServerConfig,
}

pub struct EnvOverride {
    pub pg_con: String,
}

impl Config {
    pub fn from_env(EnvOverride { pg_con: _ }: EnvOverride) -> anyhow::Result<Self> {
        let config = Config::default();

        Ok(config)
    }
}
