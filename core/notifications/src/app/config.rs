use serde::{Deserialize, Serialize};

use crate::novu::NovuConfig;

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub novu: NovuConfig,
}
