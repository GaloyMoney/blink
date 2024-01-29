use super::{
    client::{Client, Response},
    error::NovuError,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedPayload {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteFeedPayload {
    pub _id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Feed {
    pub _id: String,
    pub name: String,
    pub identifier: String,
    #[serde(rename = "_environmentId")]
    pub _environment_id: String,
    #[serde(rename = "_organizationId")]
    pub _organization_id: String,
}

#[derive(Clone)]
pub struct Feeds {
    client: Client,
}

impl Feeds {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn list(&self) -> Result<Vec<Feed>, NovuError> {
        let result = self.client.get("/feeds").await?;
        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                400 => {
                    println!("{:?}", err);
                    todo!()
                }
                401 => Err(NovuError::UnauthorizedError("/feeds".to_string())),
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn create(&self, data: FeedPayload) -> Result<Feed, NovuError> {
        let result: Response<Feed> = self.client.post("/feeds", Some(&data)).await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                401 => Err(NovuError::UnauthorizedError("/feeds".to_string())),
                409 => {
                    println!("Feed already exists");
                    todo!()
                }
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }

    pub async fn delete(&self, data: DeleteFeedPayload) -> Result<Vec<Feed>, NovuError> {
        let result = self.client.delete(&format!("/feeds/{}", data._id)).await?;

        match result {
            Response::Success(data) => Ok(data.data),
            Response::Error(err) => match err.status_code {
                400 => {
                    println!("Could not find feed with id {}", data._id);
                    todo!()
                }
                401 => Err(NovuError::UnauthorizedError("/feeds".to_string())),
                404 => {
                    println!("Feed not found");
                    todo!()
                }
                code => todo!("{}", code),
            },
            Response::Messages(err) => todo!("{:?}", err),
        }
    }
}
