use serde::{Deserialize, Serialize};

use super::lettre::LettreConfig;

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct EmailExecutorConfig {
    pub lettre: LettreConfig,
}
