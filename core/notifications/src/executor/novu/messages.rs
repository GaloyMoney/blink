use super::{
    client::{Client, Response},
    error::NovuError,
    ChannelTypeEnum,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteMessagePayload {
    pub _id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Subscriber {
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub phone: String,
    pub _id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Name {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trigger {
    #[serde(rename = "type")]
    pub type_id: String,
    pub identifier: String,
    pub variables: Vec<Name>,
    pub subscriber_variables: Vec<Name>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Template {
    pub _id: String,
    pub name: String,
    pub triggers: Vec<Trigger>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Execution {
    pub _id: String,
    pub _job_id: String,
    pub status: String,
    pub detail: String,
    pub is_retry: bool,
    pub is_test: bool,
    pub provider_id: Option<Value>,
    pub raw: String,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Child {
    pub field: String,
    pub value: String,
    pub operator: String,
    pub on: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Filter {
    pub is_negated: bool,
    #[serde(rename = "type")]
    pub filter_id: String,
    pub value: String,
    pub children: Vec<Child>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Step {
    pub _id: String,
    pub active: bool,
    pub filter: Filter,
    pub template: Option<Value>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Job {
    _id: String,
    #[serde(rename = "type")]
    job_id: String,
    digest: Option<Value>,
    execution_details: Vec<Execution>,
    step: Step,
    payload: Option<Value>,
    provider_id: Option<Value>,
    status: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub _id: String,
    pub _environment_id: String,
    pub _organization_id: String,
    pub transaction_id: String,
    pub created_at: String,
    pub channels: String,
    pub subscriber: Subscriber,
    pub template: Template,
    pub jobs: Vec<Job>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageResponse {
    pub page: i32,
    pub total_count: i32,
    pub has_more: bool,
    pub data: Vec<Message>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DelMsgTransPayload {
    pub _id: String,
    pub channel: Option<ChannelTypeEnum>,
}

#[derive(Clone)]
pub struct Messages {
    client: Client,
}

fn generate_query_string(
    channel: &str,
    subscriber_id: &str,
    transaction_id: &[String],
    page: i32,
    limit: i32,
) -> String {
    let mut params = vec![
        format!("channel={}", channel),
        format!("subscriberId={}", subscriber_id),
        format!("page={}", page),
        format!("limit={}", limit),
    ];

    for id in transaction_id {
        params.push(format!("transactionId={}", id));
    }

    params.join("&")
}

impl Messages {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn get(
        &self,
        channel: String,
        subscriber_id: String,
        transaction_id: Vec<String>,
        page: i32,
        limit: i32,
    ) -> Result<MessageResponse, NovuError> {
        let query_string =
            generate_query_string(&channel, &subscriber_id, &transaction_id, page, limit);

        let result: Response<MessageResponse> = self
            .client
            .get(format!("/messages/?{}", query_string))
            .await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/messages".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn delete(&self, payload: DeleteMessagePayload) -> Result<(), NovuError> {
        let result: Response<()> = self
            .client
            .delete(&format!("/messages/{}", payload._id))
            .await?;

        match result {
            Response::Success(_) => Ok(()),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/messages".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn delete_message_by_transaction_id(
        &self,
        payload: DelMsgTransPayload,
    ) -> Result<(), NovuError> {
        let mut url = format!("/messages/transaction/{}", payload._id);

        if let Some(channel) = &payload.channel {
            // Add the "channel" query parameter if it's Some.
            url.push_str(&format!("?channel={:?}", channel));
        }

        let result: Response<()> = self.client.delete(&url).await?;

        match result {
            Response::Success(_) => Ok(()),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/messages".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }
}
