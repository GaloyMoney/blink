use chrono::Utc;

use reqwest::{header, Client as ReqwestClient};
use serde::{Deserialize, Serialize};

use super::{AdminClientConfig, AdminClientError};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct OAuthGrantConfig {
    #[serde(default)] // add default
    pub hydra_api: String,
    #[serde(default)]
    pub client_id: String,
    #[serde(default)]
    pub client_secret: String,
}

#[derive(Default, Clone)]
pub struct OAuthGrant {
    access_token: Option<String>,
    expires_at: Option<chrono::DateTime<Utc>>,
    config: OAuthGrantConfig,
}

#[derive(Deserialize)]
struct HydraApiResponse {
    access_token: String,
    expires_in: i64,
}

impl OAuthGrant {
    pub fn new(config: OAuthGrantConfig) -> Self {
        Self {
            config,
            ..Default::default()
        }
    }

    async fn get_new_token_from_hydra(&self) -> Result<Self, AdminClientError> {
        let client = ReqwestClient::builder().use_rustls_tls().build()?;

        let response = client
            .post(&self.config.hydra_api)
            .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
            .basic_auth(&self.config.client_id, Some(&self.config.client_secret))
            .body("grant_type=client_credentials&scope=editor")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(AdminClientError::GraphQLNested {
                message: "Hydra API Error".to_owned(),
                path: None,
            });
        }

        let data: HydraApiResponse = response.json().await?;

        let buffer = 60; // force refresh token 1 min before expiry
        let expires_at = Utc::now() + chrono::Duration::seconds(data.expires_in - buffer);

        Ok(Self {
            access_token: Some(data.access_token),
            expires_at: Some(expires_at),
            config: self.config.clone(),
        })
    }

    fn is_valid(&self) -> bool {
        self.expires_at.is_some() && self.expires_at.unwrap() < Utc::now()
    }

    pub async fn validate(self) -> Result<Self, AdminClientError> {
        if self.is_valid() {
            return self.get_new_token_from_hydra().await;
        }
        Ok(self)
    }

    pub fn access_token(&self) -> Result<String, AdminClientError> {
        if self.is_valid() {
            Ok(self.access_token.clone().unwrap())
        } else {
            Err(AdminClientError::InvalidToken)
        }
    }
}
