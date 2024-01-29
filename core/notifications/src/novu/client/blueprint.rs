use super::{
    client::{Client, Response},
    error::NovuError,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Blueprint {
    pub _id: String,
    pub name: String,
    pub description: String,
    pub active: bool,
    pub draft: bool,
    pub critical: bool,
    pub tags: Vec<String>,
    pub _creator_id: String,
    pub _environment_id: String,
    pub _organization_id: String,
    pub _notification_group_id: String,
    pub _parent_id: String,
    pub deleted: bool,
    pub deleted_at: String,
    pub deleted_by: String,
    pub updated_at: String,
    pub created_at: String,
    pub is_blueprint: bool,
    pub blueprint_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintGroupByCategoryResponse {
    pub general: Vec<Blueprint>,
    pub popular: Blueprint,
}

pub struct Blueprints {
    client: Client,
}

impl Blueprints {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn group_by_category(&self) -> Result<BlueprintGroupByCategoryResponse, NovuError> {
        let result: Response<BlueprintGroupByCategoryResponse> =
            self.client.get("/blueprints/group-by-category").await?;

        match result {
            super::client::Response::Success(data) => Ok(data.data),
            super::client::Response::Error(err) => todo!("{:?}", err),
            super::client::Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn template(&self, template_id: String) -> Result<Blueprint, NovuError> {
        let result: Response<Blueprint> = self
            .client
            .get(format!("/blueprints/{}", template_id))
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
async fn test_list_blueprint() {
    let blueprint = Blueprints::new(Client::new("", Some("")).unwrap());

    let result = blueprint.group_by_category().await;
    assert!(result.is_err());
}
