use serde::{Deserialize, Serialize};

use crate::executor::NovuConfig;

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub novu: NovuConfig,
}
