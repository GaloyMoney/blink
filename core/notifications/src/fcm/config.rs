use google_fcm1::oauth2::ServiceAccountKey;
use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct FcmConfig {
    pub secret: Option<ServiceAccountKey>,
}
