use thiserror::Error;

#[derive(Error, Debug)]
pub enum AdminClientError {
    #[error("AdminClientError - Reqwest: {0}")]
    Reqwest(#[from] reqwest::Error),
    #[error("AdminClientError - InvalidHeaderValue: {0}")]
    InvalidHeaderValue(#[from] reqwest::header::InvalidHeaderValue),
    #[error("AdminClientError - InvalidHeaderName: {0}")]
    InvalidHeaderName(#[from] reqwest::header::InvalidHeaderName),
}
