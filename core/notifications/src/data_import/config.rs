use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, Serialize, Deserialize)]
pub struct KratosImportConfig {
    pub execute_import: bool,
    pub pg_con: Option<String>,
}
