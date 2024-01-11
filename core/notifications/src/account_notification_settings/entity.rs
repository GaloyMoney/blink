use derive_builder::Builder;
use es_entity::*;
use serde::{Deserialize, Serialize};

use crate::primitives::*;

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AccountNotificationSettingsEvent {
    Initialized {
        id: AccountNotificationSettingsId,
        galoy_account_id: GaloyAccountId,
    },
}

impl EntityEvent for AccountNotificationSettingsEvent {
    type EntityId = AccountNotificationSettingsId;
    fn event_table_name() -> &'static str {
        "account_notification_settings_events"
    }
}

#[derive(Builder)]
#[builder(pattern = "owned", build_fn(error = "EntityError"))]
#[allow(dead_code)]
pub struct AccountNotificationSettings {
    pub id: AccountNotificationSettingsId,
    pub galoy_account_id: GaloyAccountId,
    pub(super) events: EntityEvents<AccountNotificationSettingsEvent>,
}

impl Entity for AccountNotificationSettings {
    type Event = AccountNotificationSettingsEvent;
}

impl TryFrom<EntityEvents<AccountNotificationSettingsEvent>> for AccountNotificationSettings {
    type Error = EntityError;

    fn try_from(
        events: EntityEvents<AccountNotificationSettingsEvent>,
    ) -> Result<Self, Self::Error> {
        let mut builder = AccountNotificationSettingsBuilder::default();
        for event in events.iter() {
            match event {
                AccountNotificationSettingsEvent::Initialized {
                    id,
                    galoy_account_id,
                } => {
                    builder = builder.id(*id);
                    builder = builder.galoy_account_id(galoy_account_id.clone());
                }
            }
        }
        builder.events(events).build()
    }
}
