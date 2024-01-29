#![allow(dead_code)]

pub mod blueprint;
pub mod changes;
pub mod client;
pub mod consts;
pub mod environments;
pub mod error;
pub mod events;
pub mod feeds;
pub mod inbound_parse;
pub mod integrations;
pub mod layouts;
pub mod messages;
pub mod subscriber;
pub mod utils;
pub mod workflows;

use std::fmt::Display;

use client::Client;
use environments::{ApiKey, Environment, EnvironmentPayload};
use error::NovuError;
use events::{TriggerPayload, TriggerResponse};
use feeds::Feeds;
use inbound_parse::InboundParse;
use layouts::Layouts;
use messages::Messages;
use serde::{Deserialize, Serialize};
use subscriber::Subscribers;
use workflows::Workflows;

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
    pub feeds: Feeds,
    pub layouts: Layouts,
    pub messages: Messages,
    pub workflows: Workflows,
    pub subscribers: Subscribers,
}

impl NovuClient {
    pub fn new(api_key: impl ToString, api_url: Option<&str>) -> Result<Self, NovuError> {
        let client = Client::new(api_key, api_url)?;
        let feeds = Feeds::new(client.clone_client());
        let layouts = Layouts::new(client.clone_client());
        let messages = Messages::new(client.clone_client());
        let workflows = Workflows::new(client.clone_client());
        let subscribers = Subscribers::new(client.clone_client());

        Ok(Self {
            client,
            feeds,
            layouts,
            messages,
            workflows,
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

    pub async fn current_environment(&self) -> Result<Environment, NovuError> {
        let result = self.client.get("/environments/me").await?;
        match result {
            client::Response::Success(data) => Ok(data.data),
            client::Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/environments/me".to_string())),
                code => todo!("{}", code),
            },
            client::Response::Messages(err) => Err(NovuError::InvalidValues(
                "current_environment".to_string(),
                format!("{:?}", err.message),
            )),
        }
    }

    pub async fn get_environments(&self) -> Result<Vec<Environment>, NovuError> {
        let result = self.client.get("/environments").await?;
        match result {
            client::Response::Success(data) => Ok(data.data),
            client::Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/environments".to_string())),
                code => todo!("{}", code),
            },
            client::Response::Messages(err) => Err(NovuError::InvalidValues(
                "current_environment".to_string(),
                format!("{:?}", err.message),
            )),
        }
    }

    pub async fn create_environment(
        &self,
        data: EnvironmentPayload,
    ) -> Result<Environment, NovuError> {
        let result = self.client.post("/environments", Some(&data)).await?;
        match result {
            client::Response::Success(data) => Ok(data.data),
            client::Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/environments".to_string())),
                code => todo!("{}", code),
            },

            client::Response::Messages(err) => Err(NovuError::InvalidValues(
                "current_environment".to_string(),
                format!("{:?}", err.message),
            )),
        }
    }

    pub async fn get_environment_api_keys(&self) -> Result<ApiKey, NovuError> {
        let result = self.client.get("/environments/api-keys").await?;
        match result {
            client::Response::Success(data) => Ok(data.data),
            client::Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError(
                    "/environments/api-keys".to_string(),
                )),
                code => todo!("{}", code),
            },
            client::Response::Messages(err) => Err(NovuError::InvalidValues(
                "current_environment".to_string(),
                format!("{:?}", err.message),
            )),
        }
    }

    pub async fn regenerate_environment_api_keys(&self) -> Result<ApiKey, NovuError> {
        let result = self
            .client
            .post("/environments/api-keys/regenerate", None::<&()>)
            .await?;
        match result {
            client::Response::Success(data) => Ok(data.data),
            client::Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError(
                    "/environments/api-keys".to_string(),
                )),
                400 => {
                    println!("{:?}", err);
                    todo!()
                }
                code => todo!("{}", code),
            },
            client::Response::Messages(err) => Err(NovuError::InvalidValues(
                "current_environment".to_string(),
                format!("{:?}", err.message),
            )),
        }
    }

    pub async fn validate_mx_record_setup_for_inbound_parse(
        &self,
    ) -> Result<InboundParse, NovuError> {
        let result = self.client.get("/inbound-parse/mx/status").await?;

        match result {
            client::Response::Success(data) => Ok(data.data),
            client::Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError(
                    "/inbound-parse/mx/status".to_string(),
                )),
                400 => {
                    println!("{:?}", err);
                    todo!()
                }
                code => todo!("{}", code),
            },
            client::Response::Messages(err) => Err(NovuError::InvalidValues(
                "validating".to_string(),
                format!("{:?}", err.message),
            )),
        }
    }
}

#[cfg(test)]
#[tokio::test]
async fn test_trigger() {
    let novu = NovuClient::new("", None).unwrap();
    let result = novu
        .trigger(TriggerPayload {
            name: "testing".to_string(),
            payload: std::collections::HashMap::new(),
            to: events::TriggerRecipientsType::Single(
                events::TriggerRecipientBuilder::new("test_subscriber_id")
                    .first_name("Test")
                    .last_name("testing")
                    .build(),
            ),
        })
        .await;

    assert!(result.is_err());
}

#[cfg(test)]
#[tokio::test]
async fn test_current_environment() {
    let novu = NovuClient::new("", None).unwrap();
    let curr_result = novu.current_environment().await;
    assert!(curr_result.is_err());
}

#[cfg(test)]
#[tokio::test]
async fn test_get_environments() {
    let novu = NovuClient::new("", None).unwrap();
    let result = novu.get_environments().await;
    assert!(result.is_err());
}

#[cfg(test)]
#[tokio::test]
async fn test_create_environment() {
    let novu = NovuClient::new("", None).unwrap();
    let create_result = novu
        .create_environment(environments::EnvironmentPayloadBuilder::new("test").build())
        .await;
    assert!(create_result.is_err());
}

#[cfg(test)]
#[tokio::test]
async fn test_get_environment_api_keys() {
    let novu = NovuClient::new("", None).unwrap();
    let api_keys_result = novu.get_environment_api_keys().await;
    assert!(api_keys_result.is_err());
}

#[cfg(test)]
#[tokio::test]
async fn test_regenerate_environment_api_keys() {
    let novu = NovuClient::new("", None).unwrap();
    let regenerate_api_keys_result = novu.regenerate_environment_api_keys().await;
    assert!(regenerate_api_keys_result.is_err());
}
