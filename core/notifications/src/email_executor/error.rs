use thiserror::Error;

use super::lettre::error::LettreError;

#[derive(Error, Debug)]
pub enum EmailExecutorError {
    #[error("EmailExecutorError - Lettre error: {0}")]
    LettreError(#[from] LettreError),
}
