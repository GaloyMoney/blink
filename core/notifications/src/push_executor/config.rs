use serde::{Deserialize, Serialize};

use super::fcm::FcmConfig;

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct PushExecutorConfig {
    pub fcm: FcmConfig,
}
