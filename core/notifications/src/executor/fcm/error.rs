use thiserror::Error;

#[derive(Debug, Error)]
pub enum FcmError {
    #[error("FcmError: I/O Error: {0}")]
    IOError(#[from] std::io::Error),
    #[error("FcmError: No Service Account Key provided")]
    NoServiceAccountKey,
}
