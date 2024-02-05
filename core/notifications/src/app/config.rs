use serde::{Deserialize, Serialize};

use crate::{executor::NovuConfig, fcm::FcmConfig};

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub novu: NovuConfig,
    pub fcm: FcmConfig,
}
