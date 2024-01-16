use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, Serialize, Deserialize)]
pub struct MongoImportConfig {
    pub execute_import: bool,
    pub connection: Option<String>,
}
