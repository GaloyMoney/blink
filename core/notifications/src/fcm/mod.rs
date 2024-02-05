mod config;
mod error;

use google_fcm1::{
    hyper::{client::HttpConnector, Client},
    hyper_rustls::{HttpsConnector, HttpsConnectorBuilder},
    oauth2, FirebaseCloudMessaging,
};

pub use config::*;
use error::*;

pub struct FcmExecutor {
    pub client: FirebaseCloudMessaging<HttpsConnector<HttpConnector>>,
    pub config: FcmConfig,
}

impl FcmExecutor {
    pub async fn new(config: FcmConfig) -> Result<Self, FcmError> {
        let auth = oauth2::ServiceAccountAuthenticator::builder(
            config.secret.clone().expect("secret should be set"),
        )
        .build()
        .await?;

        let hyper_client = Client::builder().build(
            HttpsConnectorBuilder::new()
                .with_native_roots()
                .https_or_http()
                .enable_http1()
                .build(),
        );
        let client = FirebaseCloudMessaging::new(hyper_client, auth);
        Ok(Self { client, config })
    }
}
