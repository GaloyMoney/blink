use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GaloyAccountId(String);

es_entity::entity_id! { AccountNotificationSettingsId }
