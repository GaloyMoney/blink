mod config;
pub mod error;

pub use config::*;

use google_fcm1::{
    api::{Message, Notification, SendMessageRequest},
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

    pub async fn _send(
        &self,
        title: String,
        body: String,
        device_tokens: Vec<String>,
    ) -> Result<(), FcmError> {
        // should we use tokio here for optimisation ?
        for device_token in device_tokens {
            let notification = Notification {
                title: Some(title.clone()),
                body: Some(body.clone()),
                ..Default::default()
            };
            let data = [("linkTo".to_string(), "/people/circles".to_string())]
                .into_iter()
                .collect();
            let message = Message {
                notification: Some(notification),
                token: Some(device_token),
                data: Some(data),
                ..Default::default()
            };

            let parent = format!("projects/{}", "project_id");
            let request = SendMessageRequest {
                message: Some(message),
                ..Default::default()
            };
            let _response = self
                .client
                .projects()
                .messages_send(request, &parent)
                .doit()
                .await?;
        }
        Ok(())
    }
}
