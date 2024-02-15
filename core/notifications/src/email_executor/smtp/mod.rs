mod config;
pub mod error;

use lettre::{
    message::{Mailbox, Message},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Tokio1Executor,
};

use crate::messages::LocalizedMessage;

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct SmtpClient {
    client: AsyncSmtpTransport<Tokio1Executor>,
}

impl SmtpClient {
    pub fn init(config: SmtpConfig) -> Result<Self, SmtpError> {
        let creds = Credentials::new(config.username, config.password);
        let client: AsyncSmtpTransport<Tokio1Executor> =
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay("smtp.gmail.com")?
                .credentials(creds)
                .build();
        Ok(Self { client })
    }

    pub async fn send_email(&self, msg: LocalizedMessage) -> Result<(), SmtpError> {
        let email = Message::builder()
            .from(Mailbox::new(None, "some-email".parse()?))
            .to(Mailbox::new(None, "some-email".parse()?))
            .subject(msg.title)
            .body(msg.body)?;
        self.client.send(email).await?;
        Ok(())
    }
}
