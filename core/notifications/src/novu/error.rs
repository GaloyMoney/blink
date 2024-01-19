use thiserror::Error;

#[derive(Error, Debug)]
pub enum NovuExecutorError {
    #[error("NovuExecutorError - Novu: {0}")]
    Novu(#[from] novu::error::NovuError),
}
