use super::{
    client::{Client, Response},
    error::NovuError,
    utils::generate_query_string,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ChangeType {
    Feed,
    MessageTemplate,
    Layout,
    DefaultLayout,
    NotificationTemplate,
    NotificationGroup,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Change {
    pub _id: String,
    pub _creator_id: String,
    pub _environment_id: String,
    pub _organization_id: String,
    pub _entity_id: String,
    pub _parent_id: String,
    pub enabled: bool,
    pub created_at: String,
    // pub change: String,
    #[serde(rename = "type")]
    pub change_type: ChangeType,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangesResponse {
    pub page: u32,
    pub total_count: u32,
    pub page_size: u32,
    pub data: Vec<Change>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangesCountResponse {
    pub data: u32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkApplyChangesRequest {
    pub change_ids: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyChangeResponse {
    pub data: Vec<Change>,
}

pub struct Changes {
    client: Client,
}

impl Changes {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn list(
        &self,
        page: Option<u32>,
        limit: Option<u32>,
        promoted: bool,
    ) -> Result<ChangesResponse, NovuError> {
        let mut params = HashMap::new();
        params.insert("page", page.map(|p| p.to_string()));
        params.insert("limit", limit.map(|l| l.to_string()));
        params.insert(
            "promoted",
            Some(match promoted {
                true => "true".to_string(),
                false => "false".to_string(),
            }),
        );

        let result: Response<ChangesResponse> = self
            .client
            .get(format!("/changes/?{}", generate_query_string(&params)))
            .await?;

        match result {
            super::client::Response::Success(data) => Ok(data.data),
            super::client::Response::Error(err) => todo!("{:?}", err),
            super::client::Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn count(&self) -> Result<ChangesCountResponse, NovuError> {
        let result: Response<ChangesCountResponse> = self.client.get("/changes/count").await?;

        match result {
            super::client::Response::Success(data) => Ok(data.data),
            super::client::Response::Error(err) => todo!("{:?}", err),
            super::client::Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn bulk_apply(
        &self,
        data: BulkApplyChangesRequest,
    ) -> Result<ApplyChangeResponse, NovuError> {
        let result: Response<ApplyChangeResponse> =
            self.client.post("/changes/bulk/apply", Some(&data)).await?;

        match result {
            super::client::Response::Success(data) => Ok(data.data),
            super::client::Response::Error(err) => todo!("{:?}", err),
            super::client::Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn apply(&self, change_id: String) -> Result<ApplyChangeResponse, NovuError> {
        let result: Response<ApplyChangeResponse> = self
            .client
            .post(format!("/changes/{}/apply", change_id), None::<&()>)
            .await?;

        match result {
            super::client::Response::Success(data) => Ok(data.data),
            super::client::Response::Error(err) => todo!("{:?}", err),
            super::client::Response::Messages(err) => todo!("{:?}", err),
        }
    }
}

#[cfg(test)]
#[tokio::test]
async fn test_list_changes() {
    let changes = Changes::new(Client::new("", Some("")).unwrap());

    let result = changes.list(None, Some(10), false).await;
    assert!(result.is_err());
}
