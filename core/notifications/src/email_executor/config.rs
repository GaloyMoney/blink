use serde::{Deserialize, Serialize};

use super::smtp::SmtpConfig;

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct EmailExecutorConfig {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default)]
    pub smtp: SmtpConfig,
}
