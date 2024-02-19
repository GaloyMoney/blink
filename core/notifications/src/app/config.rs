use serde::{Deserialize, Serialize};

use crate::{email_executor::EmailExecutorConfig, push_executor::PushExecutorConfig};

#[derive(Clone, Default, Serialize, Deserialize)]
pub struct AppConfig {
    pub push_executor: PushExecutorConfig,
    pub email_executor: EmailExecutorConfig,
}
