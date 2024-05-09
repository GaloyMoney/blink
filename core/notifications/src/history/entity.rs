use chrono::{DateTime, Utc};
use derive_builder::Builder;
use es_entity::*;
use serde::{Deserialize, Serialize};

use crate::{
    messages::LocalizedStatefulMessage,
    notification_event::{Action, DeepLink, Icon, NotificationEventPayload},
    primitives::*,
};

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
#[allow(clippy::large_enum_variant)]
pub enum StatefulNotificationEvent {
    Initialized {
        id: StatefulNotificationId,
        galoy_user_id: GaloyUserId,
        message: LocalizedStatefulMessage,
        payload: NotificationEventPayload,
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
    pub message: LocalizedStatefulMessage,

    payload: NotificationEventPayload,

    pub(super) events: EntityEvents<StatefulNotificationEvent>,
}

impl StatefulNotification {
    pub fn deep_link(&self) -> Option<DeepLink> {
        self.payload.action().and_then(|action| match action {
            Action::OpenDeepLink(deep_link) => Some(deep_link),
            _ => None,
        })
    }

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

    pub fn is_acknowledged(&self) -> bool {
        self.acknowledged_at().is_some()
    }

    pub fn created_at(&self) -> chrono::DateTime<chrono::Utc> {
        self.events
            .entity_first_persisted_at
            .expect("entity_first_persisted_at is set at time on entity creation")
    }

    pub fn add_to_bulletin(&self) -> bool {
        self.payload.should_be_added_to_bulletin()
    }

    pub fn action(&self) -> Option<Action> {
        self.payload.action()
    }

    pub fn icon(&self) -> Option<Icon> {
        self.payload.icon()
    }
}

#[derive(Debug, Builder, Clone)]
pub struct NewStatefulNotification {
    #[builder(setter(into))]
    pub id: StatefulNotificationId,
    #[builder(setter(into))]
    pub user_id: GaloyUserId,
    #[builder(setter(into))]
    pub message: LocalizedStatefulMessage,
    #[builder(setter(into))]
    pub payload: NotificationEventPayload,
}

impl NewStatefulNotification {
    pub fn builder() -> NewStatefulNotificationBuilder {
        let mut builder = NewStatefulNotificationBuilder::default();
        builder.id(StatefulNotificationId::new());
        builder
    }

    pub(super) fn initial_events(self) -> EntityEvents<StatefulNotificationEvent> {
        EntityEvents::init(
            self.id,
            [StatefulNotificationEvent::Initialized {
                id: self.id,
                galoy_user_id: self.user_id,
                message: self.message,
                payload: self.payload,
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
                message,
                payload,
            } = event
            {
                builder = builder
                    .id(*id)
                    .galoy_user_id(galoy_user_id.clone())
                    .message(message.clone())
                    .payload(payload.clone());
            }
        }
        builder.events(events).build()
    }
}
