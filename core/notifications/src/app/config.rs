use serde::{Deserialize, Serialize};

use crate::executor::ExecutorConfig;

#[derive(Clone, Default, Serialize, Deserialize)]
pub struct AppConfig {
    pub executor: ExecutorConfig,
}
