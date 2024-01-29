#![allow(dead_code)]

pub mod client;
pub mod error;
pub mod events;
pub mod subscriber;

use serde::{Deserialize, Serialize};

use std::fmt::Display;

use client::Client;
use error::NovuError;
use events::{TriggerPayload, TriggerResponse};
use subscriber::Subscribers;

#[derive(PartialEq, Eq, PartialOrd, Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum ChannelTypeEnum {
    InApp,
    Email,
    Sms,
    Chat,
    Push,
}

impl Display for ChannelTypeEnum {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ChannelTypeEnum::InApp => write!(f, "in_app"),
            ChannelTypeEnum::Email => write!(f, "email"),
            ChannelTypeEnum::Sms => write!(f, "sms"),
            ChannelTypeEnum::Chat => write!(f, "chat"),
            ChannelTypeEnum::Push => write!(f, "push"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IAttachmentOptions {
    pub mime: String,
    pub file: Vec<u8>,
    pub name: Option<String>,
    pub channels: Option<Vec<ChannelTypeEnum>>,
}

#[derive(Clone)]
pub struct NovuClient {
    client: Client,
    pub subscribers: Subscribers,
}

impl NovuClient {
    pub fn new(api_key: impl ToString, api_url: Option<&str>) -> Result<Self, NovuError> {
        let client = Client::new(api_key, api_url)?;
        let subscribers = Subscribers::new(client.clone());

        Ok(Self {
            client,
            subscribers,
        })
    }

    pub async fn trigger(&self, data: TriggerPayload) -> Result<TriggerResponse, NovuError> {
        let result = self.client.post("/events/trigger", Some(&data)).await?;

        match result {
            self::client::Response::Success(data) => Ok(data.data),
            self::client::Response::Error(err) => Err(NovuError::UnexpectedResponse {
                msg: err.message,
                code: err.status_code.to_string(),
            }),
            self::client::Response::Messages(err) => Err(NovuError::UnexpectedResponse {
                msg: format!("{:?}", err.message),
                code: err.status_code.to_string(),
            }),
        }
    }
}
