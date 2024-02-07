use serde::{Deserialize, Serialize};

use super::fcm::FcmConfig;

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct ExecutorConfig {
    pub fcm: FcmConfig,
}
