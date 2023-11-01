mod account_details;
mod config;
mod error;
mod oauth_grant;

use std::str::FromStr;

use reqwest::{header::HeaderName, header::HeaderValue, Client as ReqwestClient, Method};

pub use account_details::*;
pub use config::*;
pub use error::*;
pub use oauth_grant::OAuthGrantConfig;

use self::oauth_grant::OAuthGrant;

#[derive(Debug, Clone)]
pub struct AdminClient {
    config: AdminClientConfig,
    grant: OAuthGrant,
}

impl AdminClient {
    pub fn new(config: AdminClientConfig, oauth_config: OAuthGrantConfig) -> Self {
        Self {
            config,
            grant: OAuthGrant::new(oauth_config),
        }
    }

    async fn connect(config: AdminClientConfig) -> Result<Self, AdminClientError> {
        // let oauth_grant = OauthGrant::new(config.clone()).validate().await?;
        // let oauth2_token = oauth_grant.access_token()?;

        // let client = ReqwestClient::builder()
        //     .use_rustls_tls()
        //     .default_headers(
        //         std::iter::once((
        //             HeaderName::from_str("Oauth2-Token").unwrap(),
        //             HeaderValue::from_str(&oauth2_token).unwrap(),
        //         ))
        //         .collect(),
        //     )
        //     .build()?;

        // Ok(Self { client, config })
        unimplemented!()
    }

    pub async fn get_account_details(
        &self,
        user_id: String,
    ) -> Result<AccountDetails, AdminClientError> {
        unimplemented!()
        // let variables = AccountDetailsVariables { user_id };

        // let json = AccountDetails::get_gql_request(variables);

        // let response = self
        //     .client
        //     .request(Method::POST, &self.config.admin_api)
        //     .json(&json)
        //     .send()
        //     .await?;
        // let response = response.json::<AccountDetailsResponse>().await?;

        // Ok(AccountDetails::from(response))
    }
}
