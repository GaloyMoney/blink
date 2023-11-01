mod config;
mod error;

use std::str::FromStr;

use reqwest::{header::HeaderName, header::HeaderValue, Client as ReqwestClient};

pub use config::*;
pub use error::*;

pub struct AdminClient {
    client: ReqwestClient,
    config: AdminClientConfig,
}

impl AdminClient {
    pub fn new(config: AdminClientConfig) -> Result<Self, AdminClientError> {
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
}
