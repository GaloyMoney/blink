use thiserror::Error;

#[derive(Debug, Error)]
pub enum FcmError {
    #[error("FcmError - I/O Error: {0}")]
    IOError(#[from] std::io::Error),
    #[error("FcmError - GoogleFcm1Error: {0}")]
    GoogleFcm1Error(#[from] google_fcm1::Error),
}
