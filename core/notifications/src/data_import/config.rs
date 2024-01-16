use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MongoImportConfig {
    /// This is to connect via port forwarding when testing against staging
    pub direct_connection: Option<bool>,
    pub connection: String,
}

impl Default for MongoImportConfig {
    fn default() -> Self {
        Self {
            direct_connection: None,
            connection: "mongodb://localhost:27017/galoy".to_string(),
        }
    }
}
