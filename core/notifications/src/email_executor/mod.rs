mod config;
pub mod error;
mod lettre;

pub use config::*;
use error::*;
use lettre::LettreClient;

#[derive(Clone)]
pub struct EmailExecutor {
    pub config: EmailExecutorConfig,
    lettre: LettreClient,
}

impl EmailExecutor {
    pub fn init(config: EmailExecutorConfig) -> Result<Self, EmailExecutorError> {
        let lettre = LettreClient::init(config.lettre.clone())?;
        Ok(EmailExecutor { config, lettre })
    }

    pub async fn notify(&self, title: String, body: String) -> Result<(), EmailExecutorError> {
        self.lettre.send_email(title, body).await?;
        Ok(())
    }
}
