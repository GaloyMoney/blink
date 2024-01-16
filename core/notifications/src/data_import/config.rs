use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MongoImportConfig {
    pub execute_import: bool,
    pub connection: String,
}

impl Default for MongoImportConfig {
    fn default() -> Self {
        Self {
            execute_import: false,
            connection: "mongodb://localhost:27017/galoy".to_string(),
        }
    }
}
