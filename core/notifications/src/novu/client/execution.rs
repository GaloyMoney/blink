use serde::{Deserialize, Serialize};

use crate::{
    client::{Client, Response},
    error::NovuError,
};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionsResponse {
    pub data: Vec<String>,
}

pub struct Executions {
    client: Client,
}

impl Executions {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn list(&self, notification_id: String, subscriber_id: String) -> Result<ExecutionsResponse, NovuError> {
        let result: Response<ExecutionsResponse> = self
            .client
            .get(format!("/execution-details", page))
            .await?;

        match result {
            crate::client::Response::Success(data) => Ok(data.data),
            crate::client::Response::Error(err) => todo!("{:?}", err),
            crate::client::Response::Messages(err) => todo!("{:?}", err),
        }
    }

} 

