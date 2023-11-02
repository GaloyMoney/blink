mod error;

pub use error::*;

#[derive(Clone)]
pub struct ApiKeysApp {}

impl ApiKeysApp {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn create_api_key(&self, _name: String) -> Result<(), ApplicationError> {
        println!("HELLO WORLD");
        Ok(())
    }
}
