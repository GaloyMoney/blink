use google_fcm1::oauth2::ServiceAccountKey;
use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct FcmConfig {
    service_account_key: Option<ServiceAccountKey>,
    pub google_application_credentials_path: String,
}

impl FcmConfig {
    pub fn load_creds(&mut self) -> anyhow::Result<()> {
        use anyhow::Context;

        let file = std::fs::File::open(&self.google_application_credentials_path)
            .context("Failed to open the service account file")?;
        let reader = std::io::BufReader::new(file);
        let service_account_key: ServiceAccountKey =
            serde_json::from_reader(reader).context("Failed to parse the service account file")?;
        self.service_account_key = Some(service_account_key);

        Ok(())
    }

    pub fn service_account_key(&mut self) -> ServiceAccountKey {
        self.service_account_key
            .take()
            .expect("Service account key not loaded")
    }
}
