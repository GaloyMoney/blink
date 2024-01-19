mod config;
pub mod error;

use novu::Novu;

pub use config::*;
use error::*;

pub struct NovuExecutor {
    client: novu::Novu,
}

impl NovuExecutor {
    pub fn init(config: NovuConfig) -> Result<Self, NovuExecutorError> {
        Ok(Self {
            client: Novu::new(config.api_key, None)?,
        })
    }
}
