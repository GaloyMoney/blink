use reqwest::header::InvalidHeaderValue;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum NovuError {
    #[error("couldn't build {0}")]
    BuildError(String),
    #[error("http error: {0}")]
    HttpError(#[from] reqwest::Error),
    #[error("failed to deserialize {0} response")]
    DeserializeError(String),
    #[error("invalid api key")]
    InvalidHeaderValue(#[from] InvalidHeaderValue),
    #[error("couldn't trigger '{0}'")]
    TriggerError(String),
    #[error("unauthorized, path: {0}")]
    UnauthorizedError(String),
    #[error("invalid values when '{0}': {1}")]
    InvalidValues(String, String),
    #[error("couldn't find template '{0}'")]
    TemplateNotFound(String),
    #[error("NovuError - UnexpectedResponse: {code:?} - {msg:?}")]
    UnexpectedResponse { msg: String, code: String },
}
