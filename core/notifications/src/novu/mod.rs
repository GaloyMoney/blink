mod config;
pub mod error;

use novu::Novu;

pub use config::*;
use error::*;

#[allow(dead_code)]
pub struct NovuExecutor {
    client: novu::Novu,
}

impl NovuExecutor {
    pub fn init(config: NovuConfig) -> Result<Self, NovuExecutorError> {
        Ok(Self {
            client: Novu::new(config.api_key, None)?,
        })
    }

    pub async fn do_stuff(&self) -> Result<(), NovuExecutorError> {
        dbg!(self.client.workflows.list(None, None).await?);
        Ok(())
    }
}
