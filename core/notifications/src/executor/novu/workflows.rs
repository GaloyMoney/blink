use std::collections::HashMap;

use super::{
    client::{Client, Response},
    error::NovuError,
    utils::generate_query_string,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Clone)]
pub struct Workflows {
    client: Client,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreferenceSettings {
    pub email: bool,
    pub sms: bool,
    pub in_app: bool,
    pub chat: bool,
    pub push: bool,
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
    pub filter_type: String,
    pub value: String,
    pub children: Vec<Child>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetaData {
    pub amount: i32,
    pub unit: String,
    pub digest_key: String,
    #[serde(rename = "type")]
    pub metadata_type: String,
    pub backoff: bool,
    pub backoff_amount: i32,
    pub backoff_unit: String,
    pub update_mode: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Step {
    pub _id: String,
    pub uuid: String,
    pub name: String,
    pub _template_id: String,
    pub active: bool,
    pub should_stop_on_fail: bool,
    pub template: Option<Value>,
    pub filters: Vec<Filter>,
    pub _parent_id: Option<Value>,
    pub metadata: MetaData,
    pub reply_callback: Option<Value>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trigger {
    #[serde(rename = "type")]
    pub trigger_type: String,
    pub identifier: String,
    pub variables: Vec<Value>,
    pub subscriber_variables: Vec<Value>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationGroup {
    pub _id: String,
    pub name: String,
    pub _environment_id: String,
    pub _organization_id: String,
    pub _parent_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Workflow {
    pub _id: Option<String>,
    pub name: String,
    pub description: String,
    pub active: bool,
    pub draft: Option<bool>,
    pub preference_settings: PreferenceSettings,
    pub critical: bool,
    pub tags: Vec<String>,
    pub steps: Vec<Step>,
    pub _organization_id: Option<String>,
    pub _creator_id: Option<String>,
    pub _environment_id: Option<String>,
    pub triggers: Vec<Trigger>,
    pub _notification_group_id: Option<String>,
    pub notification_group_id: Option<String>,
    pub _parent_id: Option<String>,
    pub deleted: Option<bool>,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub notification_group: Option<NotificationGroup>,
    pub data: Option<Value>,
    pub workflow_integration_status: Option<Value>,
    pub blueprint_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowsResponse {
    pub data: Vec<Workflow>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowDeleteResponse {
    pub data: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowStatusResponse {
    pub active: bool,
}

impl Workflows {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn list(
        &self,
        page: Option<i32>,
        limit: Option<i32>,
    ) -> Result<WorkflowsResponse, NovuError> {
        let mut params: HashMap<&str, Option<String>> = HashMap::new();
        params.insert("page", page.map(|p| p.to_string()));
        params.insert("limit", limit.map(|l| l.to_string()));

        let result = self
            .client
            .get(format!("/workflows/?{}", generate_query_string(&params)))
            .await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/workflows".to_string())),
                400 => Err(NovuError::InvalidValues(
                    "page size".to_string(),
                    "page size limit".to_string(),
                )),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn create(&self, data: Workflow) -> Result<Workflow, NovuError> {
        let result = self.client.post("/workflows", Some(&data)).await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/workflows".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn update(&self, id: String, data: Workflow) -> Result<Workflow, NovuError> {
        let result = self.client.put(format!("/workflows/{}", id), &data).await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/workflows".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn delete(&self, id: String) -> Result<WorkflowDeleteResponse, NovuError> {
        let result = self.client.delete(format!("/workflows/{}", id)).await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/workflows".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn get(&self, id: String) -> Result<Workflow, NovuError> {
        let result = self.client.get(format!("/workflows/{}", id)).await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/workflows".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn update_status(&self, id: String) -> Result<WorkflowStatusResponse, NovuError> {
        let result = self
            .client
            .put(format!("/workflows/{}/status", id), &None::<()>)
            .await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/workflows".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }
}
