use thiserror::Error;

#[derive(Error, Debug)]
pub enum LettreError {
    #[error("LettreError - Transport : {0}")]
    Transport(#[from] lettre::transport::smtp::Error),
    #[error("LettreError - Lettre : {0}")]
    Lettre(#[from] lettre::error::Error),
    #[error("LettreError - Address : {0}")]
    Address(#[from] lettre::address::AddressError),
}
