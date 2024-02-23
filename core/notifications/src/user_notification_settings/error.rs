use thiserror::Error;

#[derive(Error, Debug)]
pub enum UserNotificationSettingsError {
    #[error("UserNotificationSettingsError - Sqlx: {0}")]
    Sqlx(sqlx::Error),
    #[error("UserNotificationSettingsError - EntityError: {0}")]
    EntityError(#[from] es_entity::EntityError),
    #[error("UserNotificationSettingsError - ConcurrentModification")]
    ConcurrentModification,
}

impl From<sqlx::Error> for UserNotificationSettingsError {
    fn from(error: sqlx::Error) -> Self {
        if let Some(err) = error.as_database_error() {
            if let Some(constraint) = err.constraint() {
                if constraint.contains("duplicate key value violates unique constraint")
                    && constraint.contains("events_id_sequence_key")
                {
                    return Self::ConcurrentModification;
                }
            }
        }
        Self::Sqlx(error)
    }
}
