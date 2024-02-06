pub mod error;

use google_fcm1::{
    hyper::{client::HttpConnector, Client},
    hyper_rustls::{HttpsConnector, HttpsConnectorBuilder},
    oauth2::{self, ServiceAccountKey},
    FirebaseCloudMessaging,
};

use error::*;

#[derive(Clone)]
pub struct FcmClient {
    pub client: FirebaseCloudMessaging<HttpsConnector<HttpConnector>>,
}

impl FcmClient {
    pub async fn new(service_account_key: Option<ServiceAccountKey>) -> Result<Self, FcmError> {
        if let Some(secret) = service_account_key {
            let auth = oauth2::ServiceAccountAuthenticator::builder(secret.clone())
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
        } else {
            Err(FcmError::NoServiceAccountKey)
        }
    }
}
