mod config;
pub mod error;

use lettre::{
    message::{header::ContentType, Mailbox, Message},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Tokio1Executor,
};

use crate::{messages::LocalizedEmail, primitives::GaloyEmailAddress};

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct SmtpClient {
    client: AsyncSmtpTransport<Tokio1Executor>,
    from_email: String,
    from_name: String,
}

impl SmtpClient {
    pub fn init(config: SmtpConfig) -> Result<Self, SmtpError> {
        let creds = Credentials::new(config.username, config.password);
        let client: AsyncSmtpTransport<Tokio1Executor> =
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.relay)?
                .credentials(creds)
                .port(config.port)
                .build();
        Ok(Self {
            client,
            from_email: config.from_email,
            from_name: config.from_name,
        })
    }

    pub async fn send_email(
        &self,
        msg: LocalizedEmail,
        recipient_addr: GaloyEmailAddress,
    ) -> Result<(), SmtpError> {
        let email = Message::builder()
            .from(Mailbox::new(
                Some(self.from_name.clone()),
                self.from_email.parse()?,
            ))
            .to(Mailbox::new(None, recipient_addr.into_inner().parse()?))
            .subject(msg.subject)
            .header(ContentType::TEXT_HTML)
            .body(msg.body)?;
        self.client.send(email).await?;
        Ok(())
    }
}
