use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MongoImportConfig {
    pub execute_import: bool,
    pub connection: Option<String>,
}

impl Default for MongoImportConfig {
    fn default() -> Self {
        Self {
            execute_import: false,
            connection: None,
        }
    }
}
