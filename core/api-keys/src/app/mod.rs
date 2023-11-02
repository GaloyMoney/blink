mod error;

use crate::admin_client::AdminClient;

pub use error::*;

#[derive(Clone)]
pub struct ApiKeysApp {
    admin_client: AdminClient,
}

impl ApiKeysApp {
    pub fn new(admin_client: AdminClient) -> Self {
        Self { admin_client }
    }

    pub async fn create_api_key(&self, name: String) -> Result<(), ApplicationError> {
        println!("HELLO WORLD");
        Ok(())
    }
}
