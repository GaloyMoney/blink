mod config;
mod error;

use sqlx::{Pool, Postgres};

pub use config::*;
pub use error::*;

#[derive(Clone)]
pub struct NotificationsApp {
    _config: AppConfig,
    pool: Pool<Postgres>,
}

impl NotificationsApp {
    pub fn new(pool: Pool<Postgres>, config: AppConfig) -> Self {
        Self {
            _config: config,
            pool,
        }
    }
}
