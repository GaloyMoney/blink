use thiserror::Error;

#[derive(Error, Debug)]
pub enum AccountNotificationSettingsError {
    #[error("AccountNotificationSettingsError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("AccountNotificationSettingsError - EntityError: {0}")]
    EntityError(#[from] es_entity::EntityError),
}
