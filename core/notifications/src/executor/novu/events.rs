use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::IAttachmentOptions;

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AllowedPayloadValues {
    STRING(String),
    StringArray(Vec<String>),
    BOOLEAN(bool),
    NUMBER(i32),
    UNDEFINED(()),
    AttachmentOptions(IAttachmentOptions),
    AttachmentOptionsArray(Vec<IAttachmentOptions>),
    RECORD(HashMap<String, String>),
}

pub type ITriggerPayload = HashMap<String, AllowedPayloadValues>;

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum TriggerRecipientsType {
    Single(TriggerRecipient),
    Multiple(Vec<TriggerRecipient>),
}

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TriggerRecipient {
    subscriber_id: String,
    email: Option<String>,
    first_name: Option<String>,
    last_name: Option<String>,
    phone_number: Option<String>,
    avatar_url: Option<String>,
}

impl TriggerRecipient {
    pub fn builder() -> TriggerRecipientBuilder {
        TriggerRecipientBuilder::default()
    }
}

#[derive(Default)]
pub struct TriggerRecipientBuilder {
    recipient: TriggerRecipient,
}

impl TriggerRecipientBuilder {
    pub fn new(subscriber_id: impl ToString) -> TriggerRecipientBuilder {
        Self {
            recipient: TriggerRecipient {
                subscriber_id: subscriber_id.to_string(),
                email: None,
                first_name: None,
                last_name: None,
                phone_number: None,
                avatar_url: None,
            },
        }
    }

    pub fn first_name(mut self, name: impl ToString) -> TriggerRecipientBuilder {
        self.recipient.first_name = Some(name.to_string());
        self
    }

    pub fn last_name(mut self, name: impl ToString) -> TriggerRecipientBuilder {
        self.recipient.last_name = Some(name.to_string());
        self
    }

    pub fn email(mut self, email: impl ToString) -> TriggerRecipientBuilder {
        self.recipient.email = Some(email.to_string());
        self
    }

    pub fn phone_number(mut self, phone_number: impl ToString) -> TriggerRecipientBuilder {
        self.recipient.phone_number = Some(phone_number.to_string());
        self
    }

    pub fn avatar_url(mut self, avatar_url: impl ToString) -> TriggerRecipientBuilder {
        self.recipient.avatar_url = Some(avatar_url.to_string());
        self
    }

    pub fn build(self) -> TriggerRecipient {
        TriggerRecipient {
            subscriber_id: self.recipient.subscriber_id,
            email: self.recipient.email,
            first_name: self.recipient.first_name,
            last_name: self.recipient.last_name,
            phone_number: self.recipient.phone_number,
            avatar_url: self.recipient.avatar_url,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TriggerPayload {
    pub payload: ITriggerPayload,
    pub to: TriggerRecipientsType,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TriggerResponse {
    pub acknowledged: bool,
    pub status: String,
    pub transaction_id: String,
}
