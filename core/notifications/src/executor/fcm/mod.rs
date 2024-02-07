mod config;
pub mod error;

pub use config::*;

use google_fcm1::{
    hyper::{client::HttpConnector, Client},
    hyper_rustls::{HttpsConnector, HttpsConnectorBuilder},
    oauth2::{self, ServiceAccountKey},
    FirebaseCloudMessaging,
};

use error::*;

#[derive(Clone)]
pub struct FcmClient {
    client: FirebaseCloudMessaging<HttpsConnector<HttpConnector>>,
}

impl FcmClient {
    pub async fn init(service_account_key: ServiceAccountKey) -> Result<Self, FcmError> {
        let auth = oauth2::ServiceAccountAuthenticator::builder(service_account_key)
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

        Ok(Self { client })
    }

    pub async fn _send(&self, message: String) -> Result<(), FcmError> {
        unimplemnted!()
    }
}
