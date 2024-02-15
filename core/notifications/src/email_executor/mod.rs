mod config;
pub mod error;
pub mod lettre;

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct EmailExecutor {
    pub config: EmailExecutorConfig,
}

impl EmailExecutor {
    pub async fn init(config: EmailExecutorConfig) -> Result<Self, EmailExecutorError> {
        Ok(EmailExecutor { config })
    }
}
