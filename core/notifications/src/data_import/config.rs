use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct MongodbConfig {
    pub skip_collections: Vec<String>,
    pub direct_connection: Option<bool>,
    pub hosts: Vec<String>,
    pub port: u16,
    pub database: String,
    pub username: String,
}
