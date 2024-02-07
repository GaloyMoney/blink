use anyhow::Context;
use serde::{Deserialize, Serialize};
use tracing::TracingConfig;

use std::path::Path;

use super::db::*;
use crate::{
    app::AppConfig, data_import::*, graphql::server::ServerConfig, grpc::GrpcServerConfig,
};

#[derive(Clone, Default, Serialize, Deserialize)]
pub struct Config {
    #[serde(default)]
    pub db: DbConfig,
    #[serde(default)]
    pub app: AppConfig,
    #[serde(default)]
    pub subgraph_server: ServerConfig,
    #[serde(default)]
    pub grpc_server: GrpcServerConfig,
    #[serde(default = "default_tracing_config")]
    pub tracing: TracingConfig,
    #[serde(default)]
    pub mongo_import: MongoImportConfig,
}

fn default_tracing_config() -> TracingConfig {
    TracingConfig {
        service_name: "notifications".to_string(),
    }
}

pub struct EnvOverride {
    pub db_con: String,
    pub mongodb_connection: Option<String>,
    pub novu_api_key: Option<String>,
}

impl Config {
    pub fn from_path(
        path: Option<impl AsRef<Path>>,
        EnvOverride {
            db_con,
            mongodb_connection,
            novu_api_key,
        }: EnvOverride,
    ) -> anyhow::Result<Self> {
        let mut config: Config = if let Some(path) = path {
            let config_file = std::fs::read_to_string(path).context("Couldn't read config file")?;
            serde_yaml::from_str(&config_file).context("Couldn't parse config file")?
        } else {
            println!("No config file provided, using default config");
            Default::default()
        };
        config.db.pg_con = db_con;
        config.mongo_import.connection = mongodb_connection;

        if let Some(novu_api_key) = novu_api_key {
            config.app.executor.novu.api_key = novu_api_key;
        }

        config.app.executor.fcm.load_creds()?;

        Ok(config)
    }
}
