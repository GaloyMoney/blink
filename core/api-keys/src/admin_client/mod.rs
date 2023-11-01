mod account_details;
mod config;
mod convert;
mod error;
mod queries;

use std::str::FromStr;

use graphql_client::{GraphQLQuery, Response};
use reqwest::{header::HeaderName, header::HeaderValue, Client as ReqwestClient, Method};

pub use account_details::*;
pub use config::*;
pub use error::*;
pub use queries::*;

pub struct AdminClient {
    client: ReqwestClient,
    config: AdminClientConfig,
}

impl AdminClient {
    pub fn connect(config: AdminClientConfig) -> Result<Self, AdminClientError> {
        let client = ReqwestClient::builder()
            .use_rustls_tls()
            .default_headers(
                std::iter::once((
                    HeaderName::from_str("Oauth2-Token").unwrap(),
                    HeaderValue::from_str(&config.oauth2_token).unwrap(),
                ))
                .collect(),
            )
            .build()?;

        Ok(Self { client, config })
    }

    pub async fn get_account_details(
        &self,
        user_id: String,
    ) -> Result<AccountDetails, AdminClientError> {
        let variables = account_details_by_user_id::Variables { user_id };
        let response = AdminClient::gql_request::<AccountDetailsByUserId, _>(
            &self.client,
            &self.config.api,
            variables,
        )
        .await?;

        let response = response
            .data
            .ok_or_else(|| AdminClientError::GraphQLNested {
                message: "Empty `data` in response".to_string(),
                path: None,
            })?;

        AccountDetails::try_from(response)
    }

    async fn gql_request<Q: GraphQLQuery, U: reqwest::IntoUrl>(
        client: &ReqwestClient,
        url: U,
        variables: Q::Variables,
    ) -> Result<Response<Q::ResponseData>, AdminClientError> {
        let body = Q::build_query(variables);
        let response = client.request(Method::POST, url).json(&body).send().await?;

        let response = response.json::<Response<Q::ResponseData>>().await?;

        Ok(response)
    }
}
