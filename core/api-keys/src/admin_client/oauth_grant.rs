use chrono::Utc;

use reqwest::{header, Client as ReqwestClient};
use serde::{Deserialize, Serialize};

use super::AdminClientError;

#[derive(Clone, Default, Deserialize, Serialize)]
pub struct OAuthGrantConfig {
    #[serde(default)] // add default
    pub hydra_api: String,
    #[serde(default)]
    pub client_id: String,
    #[serde(default)]
    pub client_secret: String,
}

#[derive(Default, Clone)]
pub(super) struct OAuthGrant {
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

    pub fn token(&self) -> Option<&str> {
        if let (Some(token), Some(expires_at)) = (&self.access_token, &self.expires_at) {
            if expires_at < &Utc::now() {
                return None;
            }
            Some(token.as_str())
        } else {
            None
        }
    }

    pub async fn refresh(&mut self) -> Result<&str, AdminClientError> {
        if self.token().is_none() {
            let client = ReqwestClient::builder().use_rustls_tls().build()?;

            let response = client
                .post(&self.config.hydra_api)
                .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
                .basic_auth(&self.config.client_id, Some(&self.config.client_secret))
                .body("grant_type=client_credentials&scope=editor")
                .send()
                .await?;

            if !response.status().is_success() {
                return Err(AdminClientError::UnsuccessfulOAuthTokenRefresh);
            }

            let data: HydraApiResponse = response.json().await?;

            let early_expiry_margin_secs = 60;
            let expires_at =
                Utc::now() + chrono::Duration::seconds(data.expires_in - early_expiry_margin_secs);

            self.access_token = Some(data.access_token);
            self.expires_at = Some(expires_at);

            Ok(self
                .access_token
                .as_ref()
                .expect("access_token should be set"))
        } else {
            self.token()
                .ok_or(AdminClientError::UnsuccessfulOAuthTokenRefresh)
        }
    }
}
