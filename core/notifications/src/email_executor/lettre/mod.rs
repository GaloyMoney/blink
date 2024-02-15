mod config;
pub mod error;

use lettre::{
    transport::smtp::authentication::Credentials, AsyncSmtpTransport, AsyncTransport, Message,
    Tokio1Executor,
};
use tokio;

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct LettreClient {
    client: lettre::SmtpClient,
}

impl LettreClient {
    pub async fn init(config: LettreConfig) -> Result<Self, LettreError> {
        let creds = Credentials::new(config.username, config.password);
        let client: AsyncSmtpTransport<Tokio1Executor> =
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay("smtp.gmail.com")?
                .credentials(creds)
                .build();
        Ok(Self { client })
    }
}
