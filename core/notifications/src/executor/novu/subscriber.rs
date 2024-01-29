use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::{
    client::{Client, Response},
    error::NovuError,
};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubscriberPayload {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub avatar: Option<String>,
    pub subscriber_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubscribersResponse {
    pub page: i32,
    pub total_count: i32,
    pub page_size: i32,
    pub data: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSubscriberPayload {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub avatar: Option<String>,
    pub subscriber_id: String,
    pub data: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSubscriberResponse {
    #[serde(rename = "_id")]
    pub id: Option<String>,
    #[serde(rename = "_organizationId")]
    pub organization_id: Option<String>,
    #[serde(rename = "_environmentId")]
    pub environment_id: Option<String>,
    pub channels: Option<Vec<HashMap<String, serde_json::Value>>>,
    pub deleted: bool,
    pub created_at: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub subscriber_id: Option<String>,
    pub avatar: Option<String>,
    pub email: Option<String>,
    pub last_online_at: Option<String>,
    pub locale: Option<String>,
    pub phone: Option<String>,
    pub updated_at: Option<String>,
    #[serde(rename = "__v")]
    pub version: Option<i64>,
    pub data: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSubscriberResponse {
    #[serde(rename = "_id")]
    pub id: Option<String>,
    #[serde(rename = "_organizationId")]
    pub organization_id: Option<String>,
    #[serde(rename = "_environmentId")]
    pub environment_id: Option<String>,
    pub channels: Option<Vec<HashMap<String, serde_json::Value>>>,
    pub deleted: bool,
    pub created_at: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub subscriber_id: Option<String>,
    pub avatar: Option<String>,
    pub email: Option<String>,
    pub last_online_at: Option<String>,
    pub locale: Option<String>,
    pub phone: Option<String>,
    pub updated_at: Option<String>,
    #[serde(rename = "__v")]
    pub version: Option<i64>,
    pub data: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSubscriberResponse {
    #[serde(rename = "_id")]
    pub id: Option<String>,
    #[serde(rename = "_organizationId")]
    pub organization_id: Option<String>,
    #[serde(rename = "_environmentId")]
    pub environment_id: Option<String>,
    pub channels: Option<Vec<HashMap<String, serde_json::Value>>>,
    pub deleted: bool,
    pub created_at: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub subscriber_id: Option<String>,
    pub avatar: Option<String>,
    pub email: Option<String>,
    pub last_online_at: Option<String>,
    pub locale: Option<String>,
    pub phone: Option<String>,
    pub updated_at: Option<String>,
    #[serde(rename = "__v")]
    pub version: Option<i64>,
    pub data: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCredentialsPayload {
    pub provider_id: ProviderId,
    pub integration_identifier: Option<String>,
    pub credentials: Credentials,
}

#[derive(Debug, Deserialize)]
pub enum ProviderId {
    Slack,
    Discord,
    MsTeams,
    Mattermost,
    Ryver,
    Zulip,
    GrafanaOnCall,
    Getstream,
    Fcm,
    Apns,
    Expo,
    OneSignal,
    Pushpad,
    PushWebhook,
    PusherBeam,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Credentials {
    pub webhook_url: String,
    pub channel: Option<String>,
    pub device_tokens: Option<Vec<String>>,
    pub title: Option<String>,
    pub image_url: Option<String>,
    pub alert_uid: Option<String>,
    pub state: Option<String>,
    pub external_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCredentialsResponse {
    #[serde(rename = "_id")]
    pub id: Option<String>,
    #[serde(rename = "_organizationId")]
    pub organization_id: Option<String>,
    #[serde(rename = "_environmentId")]
    pub environment_id: Option<String>,
    pub channels: Option<Vec<HashMap<String, serde_json::Value>>>,
    pub deleted: bool,
    pub created_at: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub subscriber_id: Option<String>,
    pub avatar: Option<String>,
    pub email: Option<String>,
    pub last_online_at: Option<String>,
    pub locale: Option<String>,
    pub phone: Option<String>,
    pub updated_at: Option<String>,
    #[serde(rename = "__v")]
    pub version: Option<i64>,
    pub data: Option<HashMap<String, serde_json::Value>>,
}

impl serde::Serialize for ProviderId {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(match self {
            ProviderId::Slack => "slack",
            ProviderId::Discord => "discord",
            ProviderId::MsTeams => "msteams",
            ProviderId::Mattermost => "mattermost",
            ProviderId::Ryver => "ryver",
            ProviderId::Zulip => "zulip",
            ProviderId::GrafanaOnCall => "grafana-on-call",
            ProviderId::Getstream => "getstream",
            ProviderId::Fcm => "fcm",
            ProviderId::Apns => "apns",
            ProviderId::Expo => "expo",
            ProviderId::OneSignal => "one-signal",
            ProviderId::Pushpad => "pushpad",
            ProviderId::PushWebhook => "push-webhook",
            ProviderId::PusherBeam => "pusher-beam",
        })
    }
}

#[derive(Clone)]
pub struct Subscribers {
    client: Client,
}

impl Subscribers {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn list(&self, page: i32) -> Result<SubscribersResponse, NovuError> {
        let endpoint = format!("/subscribers/?page={}", page);
        let result: Response<SubscribersResponse> = self.client.get(endpoint).await?;

        match result {
            super::client::Response::Success(data) => Ok(data.data),
            super::client::Response::Error(err) => Err(NovuError::UnexpectedResponse {
                msg: err.message,
                code: err.status_code.to_string(),
            }),
            super::client::Response::Messages(err) => Err(NovuError::UnexpectedResponse {
                msg: format!("{:?}", err.message),
                code: err.status_code.to_string(),
            }),
        }
    }

    pub async fn get_subscriber(
        &self,
        subscriber_id: String,
    ) -> Result<GetSubscriberResponse, NovuError> {
        let endpoint = format!("/subscribers/{}", subscriber_id);
        let result = self.client.get(endpoint).await?;

        match result {
            super::client::Response::Success(data) => Ok(data.data),
            super::client::Response::Error(err) => Err(NovuError::UnexpectedResponse {
                msg: err.message,
                code: err.status_code.to_string(),
            }),
            super::client::Response::Messages(err) => Err(NovuError::UnexpectedResponse {
                msg: format!("{:?}", err.message),
                code: err.status_code.to_string(),
            }),
        }
    }

    pub async fn update(
        &self,
        subscriber_id: String,
        data: SubscriberPayload,
    ) -> Result<UpdateSubscriberResponse, NovuError> {
        let endpoint = format!("/subscribers/{}", subscriber_id);
        let result = self.client.put(endpoint, &data).await?;

        match result {
            super::client::Response::Success(data) => Ok(data.data),
            super::client::Response::Error(err) => Err(NovuError::UnexpectedResponse {
                msg: err.message,
                code: err.status_code.to_string(),
            }),
            super::client::Response::Messages(err) => Err(NovuError::UnexpectedResponse {
                msg: format!("{:?}", err.message),
                code: err.status_code.to_string(),
            }),
        }
    }

    pub async fn create(
        &self,
        data: CreateSubscriberPayload,
    ) -> Result<CreateSubscriberResponse, NovuError> {
        let endpoint = "/subscribers/".to_string();
        let result = self.client.post(endpoint, Some(&data)).await?;

        match result {
            super::client::Response::Success(data) => Ok(data.data),
            super::client::Response::Error(err) => Err(NovuError::UnexpectedResponse {
                msg: err.message,
                code: err.status_code.to_string(),
            }),
            super::client::Response::Messages(err) => Err(NovuError::UnexpectedResponse {
                msg: format!("{:?}", err.message),
                code: err.status_code.to_string(),
            }),
        }
    }

    pub async fn update_credentials(
        &self,
        subscriber_id: String,
        data: UpdateCredentialsPayload,
    ) -> Result<UpdateCredentialsResponse, NovuError> {
        let endpoint = format!("/subscribers/{}/credentials", subscriber_id);
        let result = self.client.put(endpoint, &data).await?;
        match result {
            super::client::Response::Success(data) => Ok(data.data),
            super::client::Response::Error(err) => Err(NovuError::UnexpectedResponse {
                msg: err.message,
                code: err.status_code.to_string(),
            }),
            super::client::Response::Messages(err) => Err(NovuError::UnexpectedResponse {
                msg: format!("{:?}", err.message),
                code: err.status_code.to_string(),
            }),
        }
    }
}
