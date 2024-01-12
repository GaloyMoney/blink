use thiserror::Error;

#[derive(Error, Debug)]
pub enum UserNotificationSettingsError {
    #[error("UserNotificationSettingsError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("UserNotificationSettingsError - EntityError: {0}")]
    EntityError(#[from] es_entity::EntityError),
}
