mod config;
pub mod error;

use lettre::{
    message::Mailbox, transport::smtp::authentication::Credentials, AsyncSmtpTransport,
    AsyncTransport, Tokio1Executor,
};

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct LettreClient {
    client: AsyncSmtpTransport<Tokio1Executor>,
}

impl LettreClient {
    pub fn init(config: LettreConfig) -> Result<Self, LettreError> {
        let creds = Credentials::new(config.username, config.password);
        let client: AsyncSmtpTransport<Tokio1Executor> =
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay("smtp.gmail.com")?
                .credentials(creds)
                .build();
        Ok(Self { client })
    }

    pub async fn send_email(&self, title: String, body: String) -> Result<(), LettreError> {
        let email = lettre::Message::builder()
            .from(Mailbox::new(None, "some-email".parse()?))
            .to(Mailbox::new(None, "some-email".parse()?))
            .subject(title)
            .body(body)?;
        self.client.send(email).await?;
        Ok(())
    }
}
