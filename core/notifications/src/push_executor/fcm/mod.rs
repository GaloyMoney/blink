mod config;
pub mod error;

use google_fcm1::{
    api::{Message, Notification, SendMessageRequest},
    hyper::{client::HttpConnector, Client},
    hyper_rustls::{HttpsConnector, HttpsConnectorBuilder},
    oauth2::{self, ServiceAccountKey},
    FirebaseCloudMessaging,
};

use std::collections::HashMap;

use crate::{messages::LocalizedMessage, notification_event::*, primitives::PushDeviceToken};

pub use config::*;
use error::*;

impl DeepLink {
    fn add_to_data(&self, data: &mut HashMap<String, String>) {
        match self {
            DeepLink::None => {}
            DeepLink::Circles => {
                data.insert("linkTo".to_string(), "/people/circles".to_string());
            }
        }
    }
}

#[derive(Clone)]
pub struct FcmClient {
    fcm_project_id: String,
    client: FirebaseCloudMessaging<HttpsConnector<HttpConnector>>,
}

impl FcmClient {
    pub async fn init(service_account_key: ServiceAccountKey) -> Result<Self, FcmError> {
        let fcm_project_id = service_account_key
            .project_id
            .clone()
            .expect("Project ID is missing in service account key");

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

        Ok(Self {
            fcm_project_id,
            client,
        })
    }

    pub async fn send(
        &self,
        device_token: &PushDeviceToken,
        msg: &LocalizedMessage,
        deep_link: DeepLink,
    ) -> Result<(), FcmError> {
        let mut data = HashMap::new();
        deep_link.add_to_data(&mut data);

        let notification = Notification {
            title: Some(msg.title.clone()),
            body: Some(msg.body.clone()),
            ..Default::default()
        };
        let message = Message {
            notification: Some(notification),
            token: Some(device_token.clone().into_inner()),
            data: Some(data.clone()),
            ..Default::default()
        };

        let parent = format!("projects/{}", self.fcm_project_id);
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
        Ok(())
    }
}
