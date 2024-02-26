mod email_formatter;
pub mod error;

pub use email_formatter::EmailFormatter;

#[derive(Debug)]
pub struct LocalizedPushMessage {
    pub title: String,
    pub body: String,
}

pub struct LocalizedEmail {
    pub subject: String,
    pub body: String,
}
