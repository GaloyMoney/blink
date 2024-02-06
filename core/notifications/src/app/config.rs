use serde::{Deserialize, Serialize};

use crate::executor::ExecutorConfig;

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub exectuor: ExecutorConfig,
}
