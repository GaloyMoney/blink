use derive_builder::Builder;
use es_entity::*;
use serde::{Deserialize, Serialize};

use crate::{notification_event::DeepLink, primitives::*};

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PersistentNotificationEvent {
    Initialized {
        id: PersistentNotificationId,
        galoy_user_id: GaloyUserId,
        title: String,
        body: String,
        locale: GaloyLocale,
        deep_link: Option<DeepLink>,
    },
}

impl EntityEvent for PersistentNotificationEvent {
    type EntityId = PersistentNotificationId;
    fn event_table_name() -> &'static str {
        "user_notification_settings_events"
    }
}

#[derive(Builder)]
#[builder(pattern = "owned", build_fn(error = "EntityError"))]
pub struct PersistentNotification {
    pub id: PersistentNotificationId,
    pub galoy_user_id: GaloyUserId,
    pub(super) events: EntityEvents<PersistentNotificationEvent>,
}

#[derive(Debug, Builder, Clone)]
pub struct NewPersistentNotification {
    #[builder(setter(into))]
    pub user_id: GaloyUserId,
    #[builder(setter(into))]
    pub title: String,
    #[builder(setter(into))]
    pub body: String,
    #[builder(default, setter(into))]
    pub deep_link: Option<DeepLink>,
}

impl NewPersistentNotification {
    pub fn builder() -> NewPersistentNotificationBuilder {
        NewPersistentNotificationBuilder::default()
    }
}

impl TryFrom<EntityEvents<PersistentNotificationEvent>> for PersistentNotification {
    type Error = EntityError;

    fn try_from(events: EntityEvents<PersistentNotificationEvent>) -> Result<Self, Self::Error> {
        let mut builder = PersistentNotificationBuilder::default();
        for event in events.iter() {
            if let PersistentNotificationEvent::Initialized {
                id, galoy_user_id, ..
            } = event
            {
                builder = builder.id(*id);
                builder = builder.galoy_user_id(galoy_user_id.clone());
            }
        }
        builder.events(events).build()
    }
}
