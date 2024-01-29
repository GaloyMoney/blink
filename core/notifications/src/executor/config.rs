use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct NovuConfig {
    pub api_key: String,
    pub workflows: NovuWorkflows,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct NovuWorkflows {
    pub circle_grew: String,
    pub threshold_reached: String,
}

impl NovuWorkflows {
    pub fn for_name(&self, name: &str) -> String {
        match name {
            "circle_grew" => self.circle_grew.clone(),
            "threshold_reached" => self.threshold_reached.clone(),
            _ => unreachable!("unknown workflow name: {}", name),
        }
    }
}

impl Default for NovuWorkflows {
    fn default() -> Self {
        Self {
            circle_grew: dummy_workflow(),
            threshold_reached: dummy_workflow(),
        }
    }
}

fn dummy_workflow() -> String {
    String::from("dummy-workflow")
}
