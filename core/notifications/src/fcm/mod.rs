use google_fcm1::{
    hyper::{client::HttpConnector, Client},
    hyper_rustls::{HttpsConnector, HttpsConnectorBuilder},
    oauth2, FirebaseCloudMessaging,
};
use std::{env, fs::File, io::BufReader};

pub struct FcmExecutor {
    pub client: FirebaseCloudMessaging<HttpsConnector<HttpConnector>>,
}

impl FcmExecutor {
    pub async fn new() -> Self {
        let credentials_path = env::var("GOOGLE_APPLICATION_CREDENTIALS")
            .expect("GOOGLE_APPLICATION_CREDENTIALS should be set");
        let file = File::open(credentials_path)
            .expect("Failed to open the GOOGLE_APPLICATION_CREDENTIALS file");
        let reader = BufReader::new(file);

        let secret: oauth2::ServiceAccountKey = serde_json::from_reader(reader)
            .expect("Failed to parse the GOOGLE_APPLICATION_CREDENTIALS file");
        let auth = oauth2::ServiceAccountAuthenticator::builder(secret)
            .build()
            .await
            .expect("Failed to create the authenticator");

        let hyper_client = Client::builder().build(
            HttpsConnectorBuilder::new()
                .with_native_roots()
                .https_or_http()
                .enable_http1()
                .build(),
        );
        let client = FirebaseCloudMessaging::new(hyper_client, auth);
        Self { client }
    }
}
