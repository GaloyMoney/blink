use serde::{Deserialize, Serialize};

use super::{
    client::{Client, Response},
    error::NovuError,
    ChannelTypeEnum,
};

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Integration {
    pub _id: Option<String>,
    pub _environment_id: String,
    pub _organization_id: String,
    pub name: String,
    pub identifier: String,
    pub provider_id: String,
    pub channel: ChannelTypeEnum,
    pub credentials: Credentials,
    pub active: bool,
    pub deleted: bool,
    pub deleted_at: String,
    pub deleted_by: String,
    pub primary: bool,
    pub conditions: Option<Vec<StepFilter>>,
}

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Credentials {
    pub api_key: Option<String>,
    pub user: Option<String>,
    pub secret_key: Option<String>,
    pub domain: Option<String>,
    pub password: Option<String>,
    pub host: Option<String>,
    pub port: Option<String>,
    pub secure: Option<bool>,
    pub region: Option<String>,
    pub account_sid: Option<String>,
    pub message_profile_id: Option<String>,
    pub token: Option<String>,
    pub from: Option<String>,
    pub sender_name: Option<String>,
    pub project_name: Option<String>,
    pub application_id: Option<String>,
    pub client_id: Option<String>,
    pub require_tls: Option<bool>,
    pub ignore_tls: Option<bool>,
    pub tls_options: Option<serde_json::Value>,
    pub base_url: Option<String>,
    pub webhook_url: Option<String>,
    pub redirect_url: Option<String>,
    pub hmac: Option<bool>,
    pub service_account: Option<String>,
    pub ip_pool_name: Option<String>,
}

#[derive(PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct StepFilter {
    #[serde(rename = "isNegated")]
    is_negated: bool,
    #[serde(rename = "type")]
    step_filter_type: StepFilterType,
    value: StepFilterValue,
    children: Vec<FieldFilterPart>,
}

#[derive(PartialEq, Eq, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum StepFilterType {
    BOOLEAN,
    TEXT,
    DATE,
    NUMBER,
    STATEMENT,
    LIST,
    MultiList,
    GROUP,
}

#[derive(PartialEq, Eq, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum StepFilterValue {
    AND,
    OR,
}

#[derive(PartialEq, Eq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldFilterPart {
    pub field: String,
    pub value: String,
    pub operator: FieldFilterPartOperator,
    pub on: FieldFilterPartOn,
}

#[derive(PartialEq, Eq, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FieldFilterPartOperator {
    LARGER,
    SMALLER,
    LargerEqual,
    SmallerEqual,
    EQUAL,
    NotEqual,
    AllIn,
    AnyIn,
    NotIn,
    BETWEEN,
    NotBetween,
    LIKE,
    NotLike,
    IN,
}

#[derive(PartialEq, Eq, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FieldFilterPartOn {
    SUBSCRIBER,
    PAYLOAD,
}

#[derive(PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct CreateIntegrationRequest {
    name: Option<String>,
    identifier: Option<String>,
    #[serde(rename = "_environmentId")]
    _environment_id: Option<String>,
    #[serde(rename = "providerId")]
    provider_id: String,
    channel: ChannelTypeEnum,
    credentials: Option<Credentials>,
    active: Option<bool>,
    check: Option<bool>,
    conditions: Option<Vec<StepFilter>>,
}

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct UpdateIntegrationRequest {
    name: Option<String>,
    identifier: Option<String>,
    #[serde(rename = "_environmentId")]
    _environment_id: Option<String>,
    credentials: Option<Credentials>,
    active: Option<bool>,
    check: Option<bool>,
    conditions: Vec<StepFilter>,
}

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ChannelTypeLimit {
    limit: u32,
    count: u32,
}

pub struct Integrations {
    client: Client,
}

impl Integrations {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn get_integrations(&self) -> Result<Vec<Integration>, NovuError> {
        let result: Response<Vec<Integration>> = self.client.get("/integrations").await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                400 => {
                    println!("{:?}", err);
                    todo!()
                }
                401 => Err(NovuError::UnauthorizedError("/integrations".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn create(&self, data: CreateIntegrationRequest) -> Result<Integration, NovuError> {
        let result: Response<Integration> = self.client.post("/integrations", Some(&data)).await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/integrations".to_string())),
                409 => {
                    println!("Integration already exists");
                    todo!()
                }
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn active_integrations(&self) -> Result<Vec<Integration>, NovuError> {
        let result: Response<Vec<Integration>> = self.client.get("/integrations/active").await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError(
                    "/integrations/active".to_string(),
                )),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn webhook_support_status(&self, provider_id: u32) -> Result<bool, NovuError> {
        let result: Response<bool> = self
            .client
            .get(format!(
                "/integrations/webhook/provider/{}/status",
                provider_id
            ))
            .await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError(format!(
                    "/integrations/provider/{}/webhook-support",
                    provider_id
                ))),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn update_integration(
        &self,
        integration_id: u32,
        update_integration: UpdateIntegrationRequest,
    ) -> Result<Integration, NovuError> {
        let result: Response<Integration> = self
            .client
            .put(
                format!("/integrations/{}", integration_id),
                &Some(update_integration),
            )
            .await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/integrations".to_string())),
                409 => {
                    println!("Integration already exists");
                    todo!()
                }
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn delete_integration(&self, integration_id: u32) -> Result<Integration, NovuError> {
        let result: Response<Integration> = self
            .client
            .delete(format!("/integrations/{}", integration_id))
            .await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/integrations".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn set_primary_integration(
        &self,
        integration_id: u32,
    ) -> Result<Integration, NovuError> {
        let result: Response<Integration> = self
            .client
            .post(
                format!("/integrations/{}/set-primary", integration_id),
                None::<&()>,
            )
            .await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/integrations".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn get_channel_limit(
        &self,
        channel_type: ChannelTypeEnum,
    ) -> Result<ChannelTypeLimit, NovuError> {
        let result: Response<ChannelTypeLimit> = self
            .client
            .get(format!("/integrations/{}/limit", channel_type))
            .await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError(format!(
                    "/integrations/channel/{}/limit",
                    channel_type
                ))),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }
}
