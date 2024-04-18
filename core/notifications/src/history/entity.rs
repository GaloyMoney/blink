use chrono::{DateTime, Utc};
use derive_builder::Builder;
use es_entity::*;
use serde::{Deserialize, Serialize};

use crate::{notification_event::DeepLink, primitives::*};

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum StatefulNotificationEvent {
    Initialized {
        id: StatefulNotificationId,
        galoy_user_id: GaloyUserId,
        title: String,
        body: String,
        locale: GaloyLocale,
        deep_link: Option<DeepLink>,
    },
    Acknowledged {
        acknowledged_at: DateTime<Utc>,
    },
}

impl EntityEvent for StatefulNotificationEvent {
    type EntityId = StatefulNotificationId;
    fn event_table_name() -> &'static str {
        "stateful_notification_events"
    }
}

impl EsEntity for StatefulNotification {
    type Event = StatefulNotificationEvent;
}

#[derive(Builder)]
#[builder(pattern = "owned", build_fn(error = "EntityError"))]
pub struct StatefulNotification {
    pub id: StatefulNotificationId,
    pub galoy_user_id: GaloyUserId,
    pub title: String,
    pub body: String,
    pub locale: GaloyLocale,
    pub deep_link: Option<DeepLink>,

    pub(super) events: EntityEvents<StatefulNotificationEvent>,
}

impl StatefulNotification {
    pub(super) fn acknowledge(&mut self) {
        if self.acknowledged_at().is_none() {
            self.events.push(StatefulNotificationEvent::Acknowledged {
                acknowledged_at: Utc::now(),
            });
        }
    }

    pub fn acknowledged_at(&self) -> Option<DateTime<Utc>> {
        self.events.iter().find_map(|event| {
            if let StatefulNotificationEvent::Acknowledged {
                acknowledged_at: read_at,
            } = event
            {
                Some(*read_at)
            } else {
                None
            }
        })
    }

    pub fn created_at(&self) -> chrono::DateTime<chrono::Utc> {
        self.events
            .entity_first_persisted_at
            .expect("entity_first_persisted_at is set at time on entity creation")
    }
}

#[derive(Debug, Builder, Clone)]
pub struct NewStatefulNotification {
    #[builder(setter(into))]
    pub id: StatefulNotificationId,
    #[builder(setter(into))]
    pub user_id: GaloyUserId,
    #[builder(setter(into))]
    pub title: String,
    #[builder(setter(into))]
    pub body: String,
    #[builder(setter(into))]
    pub locale: GaloyLocale,
    #[builder(default, setter(into))]
    pub deep_link: Option<DeepLink>,
}

impl NewStatefulNotification {
    pub fn builder() -> NewStatefulNotificationBuilder {
        let mut builder = NewStatefulNotificationBuilder::default();
        builder.id(StatefulNotificationId::new());
        builder
    }

    pub(super) fn initial_events(self) -> EntityEvents<StatefulNotificationEvent> {
        let id = self.id;
        EntityEvents::init(
            id,
            [StatefulNotificationEvent::Initialized {
                id,
                galoy_user_id: self.user_id,
                title: self.title,
                body: self.body,
                locale: self.locale,
                deep_link: self.deep_link,
            }],
        )
    }
}

impl TryFrom<EntityEvents<StatefulNotificationEvent>> for StatefulNotification {
    type Error = EntityError;

    fn try_from(events: EntityEvents<StatefulNotificationEvent>) -> Result<Self, Self::Error> {
        let mut builder = StatefulNotificationBuilder::default();
        for event in events.iter() {
            if let StatefulNotificationEvent::Initialized {
                id,
                galoy_user_id,
                title,
                body,
                locale,
                deep_link,
            } = event
            {
                builder = builder
                    .id(*id)
                    .galoy_user_id(galoy_user_id.clone())
                    .title(title.clone())
                    .body(body.clone())
                    .locale(locale.clone())
                    .deep_link(deep_link.clone());
            }
        }
        builder.events(events).build()
    }
}
