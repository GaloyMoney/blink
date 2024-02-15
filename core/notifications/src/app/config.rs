use serde::{Deserialize, Serialize};

use crate::push_executor::PushExecutorConfig;

#[derive(Clone, Default, Serialize, Deserialize)]
pub struct AppConfig {
    pub executor: PushExecutorConfig,
}
