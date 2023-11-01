mod account_details;
mod config;
mod error;
mod oauth_grant;

use reqwest::{
    header::{HeaderMap, HeaderName, HeaderValue},
    Client as ReqwestClient,
};
use std::sync::Arc;
use tokio::sync::RwLock;

pub use account_details::AccountDetails;
pub use config::*;
pub use error::*;
pub use oauth_grant::OAuthGrantConfig;

use self::oauth_grant::OAuthGrant;

#[derive(Clone)]
pub struct AdminClient {
    config: AdminClientConfig,
    grant: Arc<RwLock<OAuthGrant>>,
}

impl AdminClient {
    pub fn new(config: AdminClientConfig, oauth_config: OAuthGrantConfig) -> Self {
        Self {
            config,
            grant: Arc::new(RwLock::new(OAuthGrant::new(oauth_config))),
        }
    }

    pub async fn account_details(
        &self,
        user_id: String,
    ) -> Result<AccountDetails, AdminClientError> {
        use account_details::*;

        let variables = AccountDetailsVariables { user_id };

        let request = AccountDetails::request(variables);

        let response = self
            .client()
            .await?
            .post(&self.config.admin_api)
            .json(&request)
            .send()
            .await?;
        let response = response.json::<AccountDetailsResponse>().await?;

        Ok(AccountDetails::from(response))
    }

    async fn client(&self) -> Result<ReqwestClient, AdminClientError> {
        let headers = {
            let maybe_headers = {
                let grant = self.grant.read().await;
                grant.token().map(Self::headers)
            };
            if let Some(headers) = maybe_headers {
                headers
            } else {
                let mut grant = self.grant.write().await;
                let token = grant.refresh().await?;
                Self::headers(token)
            }
        };
        Ok(ReqwestClient::builder()
            .use_rustls_tls()
            .default_headers(headers)
            .build()?)
    }

    fn headers(token: &str) -> HeaderMap {
        use std::str::FromStr;

        std::iter::once((
            HeaderName::from_str("Oauth2-Token").unwrap(),
            HeaderValue::from_str(&token).unwrap(),
        ))
        .collect()
    }
}
