use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[serde_with::serde_as]
#[derive(Default)]
pub struct AppConfig {}


