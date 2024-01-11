use thiserror::Error;

#[derive(Error, Debug)]
pub enum EntityError {
    #[error("EntityError - NoEntityEventsPresent")]
    NoEntityEventsPresent,
    #[error("EntityError - UninitializedFieldError: {0}")]
    UninitializedFieldError(#[from] derive_builder::UninitializedFieldError),
    #[error("EntityError - LoadEvent: {0}")]
    LoadEvent(#[from] serde_json::Error),
}
