use serde::{Deserialize, Serialize};

use crate::primitives::ReadPool;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbConfig {
    #[serde(default)]
    pub pg_con: String,
    #[serde(default)]
    pub pg_read_con: String,
    #[serde(default = "default_pool_size")]
    pub pool_size: u32,
}

pub async fn init_pool(config: &DbConfig) -> anyhow::Result<(sqlx::PgPool, ReadPool)> {
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(config.pool_size)
        .connect(&config.pg_con)
        .await?;

    sqlx::migrate!().run(&pool).await?;

    let read_pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(config.pool_size)
        .connect(&config.pg_read_con)
        .await?;

    Ok((pool, ReadPool::from(read_pool)))
}

impl Default for DbConfig {
    fn default() -> Self {
        Self {
            pg_con: "".to_string(),
            pg_read_con: "".to_string(),
            pool_size: default_pool_size(),
        }
    }
}

fn default_pool_size() -> u32 {
    20
}
