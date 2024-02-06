use google_fcm1::oauth2::ServiceAccountKey;
use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct ExecutorConfig {
    pub novu: NovuConfig,
    pub fcm: FcmConfig,
}

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct NovuConfig {
    pub api_key: String,
    pub workflows: NovuWorkflows,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct NovuWorkflows {
    #[serde(default = "default_circle_grew_workflow_id")]
    pub circle_grew: String,
    #[serde(default = "default_circle_threshold_reached_workflow_id")]
    pub circle_threshold_reached: String,
}

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct FcmConfig {
    pub service_account_key: Option<ServiceAccountKey>,
}

impl NovuWorkflows {
    pub fn for_name(&self, name: &str) -> String {
        match name {
            "circle_grew" => self.circle_grew.clone(),
            "circle_threshold_reached" => self.circle_threshold_reached.clone(),
            _ => unreachable!("unknown workflow name: {}", name),
        }
    }
}

impl Default for NovuWorkflows {
    fn default() -> Self {
        Self {
            circle_grew: default_circle_grew_workflow_id(),
            circle_threshold_reached: default_circle_threshold_reached_workflow_id(),
        }
    }
}

fn default_circle_grew_workflow_id() -> String {
    String::from("circle_grew")
}

fn default_circle_threshold_reached_workflow_id() -> String {
    String::from("circle_threshold_reached")
}
