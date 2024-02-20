use serde::{Deserialize, Serialize};

use super::smtp::SmtpConfig;

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct EmailExecutorConfig {
    pub smtp: SmtpConfig,
}
