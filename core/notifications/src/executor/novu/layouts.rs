use std::collections::HashMap;

use super::{
    client::{Client, Response},
    error::NovuError,
    utils::generate_query_string,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLayoutPayload {
    pub name: String,
    pub identifier: String,
    pub description: String,
    pub content: String,
    pub variables: Option<Vec<Value>>,
    pub is_default: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Data {
    pub _id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLayoutResponse {
    pub data: Data,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Layout {
    pub _id: String,
    pub _organization_id: String,
    pub _environment_id: String,
    pub _creator_id: String,
    pub name: String,
    pub identifier: String,
    pub description: String,
    pub channel: String,
    pub content: String,
    pub content_type: String,
    pub variables: Option<Vec<Value>>,
    pub is_default: bool,
    pub is_deleted: bool,
    pub created_at: String,
    pub updated_at: String,
    pub _parent_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayoutResponse {
    pub data: Vec<Layout>,
    pub page: i32,
    pub page_size: i32,
    pub total_count: i32,
}

#[derive(Clone)]
pub struct Layouts {
    client: Client,
}

impl Layouts {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn create(
        &self,
        data: CreateLayoutPayload,
    ) -> Result<CreateLayoutResponse, NovuError> {
        let result = self.client.post("/layouts", Some(&data)).await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/layouts".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn list(
        &self,
        page: Option<u32>,
        page_size: Option<u32>,
        sort_by: Option<String>,
        order_by: Option<u32>,
    ) -> Result<Vec<LayoutResponse>, NovuError> {
        let mut params = HashMap::new();
        params.insert("page", page.map(|p| p.to_string()));
        params.insert("pageSize", page_size.map(|l| l.to_string()));
        params.insert("sortBy", sort_by.map(|s| s.to_string()));
        params.insert("orderBy", order_by.map(|s| s.to_string()));

        let result = self
            .client
            .get(format!("/layouts/?{}", generate_query_string(&params)))
            .await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/layouts".to_string())),
                400 => Err(NovuError::InvalidValues(
                    "page size".to_string(),
                    "page size limit".to_string(),
                )),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn get(&self, id: String) -> Result<Layout, NovuError> {
        let result = self.client.get(format!("/layouts/{}", id)).await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/layouts".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn update(&self, id: String, data: CreateLayoutPayload) -> Result<Layout, NovuError> {
        let result: Response<Layout> = self
            .client
            .patch(format!("/layouts/{}", id), Some(&data))
            .await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/layouts".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn delete(&self, id: String) -> Result<Layout, NovuError> {
        let result = self.client.delete(format!("/layouts/{}", id)).await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/layouts".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn set_default(&self, id: String) -> Result<(), NovuError> {
        let result: Response<()> = self
            .client
            .post(format!("/layouts/{}/default", id), None::<()>.as_ref())
            .await?;

        match result {
            Response::Success(_data) => Ok(()),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/layouts".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }
}
