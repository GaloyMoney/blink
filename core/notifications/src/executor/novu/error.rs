use reqwest::header::InvalidHeaderValue;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum NovuError {
    #[error("NovuError - BuildError: {0}")]
    BuildError(String),
    #[error("NovuError - HttpError: {0}")]
    HttpError(#[from] reqwest::Error),
    #[error("NovuError - InvalidHeaderValue: {0}")]
    InvalidHeaderValue(#[from] InvalidHeaderValue),
    #[error("NovuError - UnexpectedResponse: {code:?} - {msg:?}")]
    UnexpectedResponse { msg: String, code: String },
}
