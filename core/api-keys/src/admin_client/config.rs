use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct AdminClientConfig {
    #[serde(default = "default_admin_api")]
    pub admin_api: String, // URL type?
}

fn default_admin_api() -> String {
    "local admin endpoint".to_string()
}
