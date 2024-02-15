use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
pub struct LettreConfig {
    pub username: String,
    pub password: String,
}
