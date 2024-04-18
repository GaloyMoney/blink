use serde::{de::DeserializeOwned, Serialize};
use sqlx::Row;

use super::error::EntityError;

#[derive(sqlx::Type)]
pub struct GenericEvent {
    pub id: uuid::Uuid,
    pub sequence: i32,
    pub event: serde_json::Value,
    pub entity_created_at: chrono::DateTime<chrono::Utc>,
    pub event_recorded_at: chrono::DateTime<chrono::Utc>,
}

pub trait EntityEvent: DeserializeOwned + Serialize {
    type EntityId: Into<uuid::Uuid> + From<uuid::Uuid> + Copy;

    fn event_table_name() -> &'static str
    where
        Self: Sized;
}

pub trait EsEntity: TryFrom<EntityEvents<<Self as EsEntity>::Event>, Error = EntityError> {
    type Event: EntityEvent;
}

pub struct EntityEvents<T: EntityEvent> {
    pub entity_first_persisted_at: Option<chrono::DateTime<chrono::Utc>>,
    latest_event_persisted_at: Option<chrono::DateTime<chrono::Utc>>,
    entity_id: <T as EntityEvent>::EntityId,
    persisted_events: Vec<T>,
    new_events: Vec<T>,
}

impl<T> EntityEvents<T>
where
    T: DeserializeOwned + Serialize + 'static + EntityEvent,
{
    pub fn init(
        id: <T as EntityEvent>::EntityId,
        initial_events: impl IntoIterator<Item = T>,
    ) -> Self {
        Self {
            entity_first_persisted_at: None,
            latest_event_persisted_at: None,
            entity_id: id,
            persisted_events: Vec::new(),
            new_events: initial_events.into_iter().collect(),
        }
    }

    pub fn push(&mut self, event: T) {
        self.new_events.push(event);
    }

    pub async fn batch_persist(
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        entities: impl IntoIterator<Item = Self>,
    ) -> Result<(), sqlx::Error> {
        let mut query_builder = sqlx::QueryBuilder::new(format!(
            "INSERT INTO {} (id, sequence, event_type, event)",
            <T as EntityEvent>::event_table_name(),
        ));

        query_builder.push_values(
            entities.into_iter().flat_map(|entity| {
                let uuid: uuid::Uuid = entity.entity_id.into();
                let sequence = entity.persisted_events.len() + 1;
                entity
                    .new_events
                    .into_iter()
                    .enumerate()
                    .map(move |(offset, event)| (uuid, (sequence + offset) as i32, event))
            }),
            |mut builder, (uuid, sequence, event)| {
                let event_json = serde_json::to_value(event).expect("Could not serialize event");
                let event_type = event_json
                    .get("type")
                    .and_then(serde_json::Value::as_str)
                    .expect("Could not get type")
                    .to_owned();
                builder.push_bind(uuid);
                builder.push_bind(sequence);
                builder.push_bind(event_type);
                builder.push_bind(event_json);
            },
        );

        let query = query_builder.build();
        query.execute(&mut **tx).await?;

        Ok(())
    }

    pub async fn persist(
        &mut self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    ) -> Result<usize, sqlx::Error> {
        let uuid: uuid::Uuid = self.entity_id.into();
        let mut events = Vec::new();
        std::mem::swap(&mut events, &mut self.new_events);

        if events.is_empty() {
            return Ok(0);
        }

        let mut query_builder = sqlx::QueryBuilder::new(format!(
            "INSERT INTO {} (id, sequence, event_type, event)",
            <T as EntityEvent>::event_table_name(),
        ));

        let sequence = self.persisted_events.len() + 1;
        let n_persisted = self.new_events.len();

        query_builder.push_values(events.iter().enumerate(), |mut builder, (offset, event)| {
            let event_json = serde_json::to_value(event).expect("Could not serialize event");
            let event_type = event_json
                .get("type")
                .and_then(serde_json::Value::as_str)
                .expect("Could not get type")
                .to_owned();
            builder.push_bind(uuid);
            builder.push_bind((sequence + offset) as i32);
            builder.push_bind(event_type);
            builder.push_bind(event_json);
        });
        query_builder.push("RETURNING recorded_at");
        let query = query_builder.build();

        let rows = query.fetch_all(&mut **tx).await?;

        let recorded_at: chrono::DateTime<chrono::Utc> = rows
            .last()
            .map(|row| row.get::<chrono::DateTime<chrono::Utc>, _>("recorded_at"))
            .expect("Could not get recorded_at");

        self.latest_event_persisted_at = Some(recorded_at);
        if self.entity_first_persisted_at.is_none() {
            self.entity_first_persisted_at = Some(recorded_at);
        }

        self.persisted_events.extend(events);
        Ok(n_persisted)
    }

    pub fn load_first<E: EsEntity<Event = T>>(
        events: impl IntoIterator<Item = GenericEvent>,
    ) -> Result<E, EntityError> {
        let mut current_id = None;
        let mut current = None;
        for e in events {
            if current_id.is_none() {
                current_id = Some(e.id);
                current = Some(Self {
                    entity_first_persisted_at: Some(e.entity_created_at),
                    latest_event_persisted_at: None,
                    entity_id: e.id.into(),
                    persisted_events: Vec::new(),
                    new_events: Vec::new(),
                });
            }
            if current_id != Some(e.id) {
                break;
            }
            let cur = current.as_mut().expect("Could not get current");
            cur.latest_event_persisted_at = Some(e.event_recorded_at);
            cur.persisted_events
                .push(serde_json::from_value(e.event).expect("Could not deserialize event"));
        }
        if let Some(current) = current {
            E::try_from(current)
        } else {
            Err(EntityError::NoEntityEventsPresent)
        }
    }

    pub fn load_n<E: EsEntity<Event = T>>(
        events: impl IntoIterator<Item = GenericEvent>,
        n: usize,
    ) -> Result<(Vec<E>, bool), EntityError> {
        let mut ret: Vec<E> = Vec::new();
        let mut current_id = None;
        let mut current = None;
        for e in events {
            if current_id != Some(e.id) {
                if let Some(current) = current.take() {
                    ret.push(E::try_from(current)?);
                    if ret.len() == n {
                        return Ok((ret, true));
                    }
                }

                current_id = Some(e.id);
                current = Some(Self {
                    entity_first_persisted_at: Some(e.entity_created_at),
                    latest_event_persisted_at: None,
                    entity_id: e.id.into(),
                    persisted_events: Vec::new(),
                    new_events: Vec::new(),
                });
            }
            let cur = current.as_mut().expect("Could not get current");
            cur.latest_event_persisted_at = Some(e.event_recorded_at);
            cur.persisted_events
                .push(serde_json::from_value(e.event).expect("Could not deserialize event"));
        }
        if let Some(current) = current.take() {
            ret.push(E::try_from(current)?);
        }
        Ok((ret, false))
    }

    pub fn iter(&self) -> impl DoubleEndedIterator<Item = &T> {
        self.persisted_events.iter().chain(self.new_events.iter())
    }
}

impl<T> IntoIterator for EntityEvents<T>
where
    T: DeserializeOwned + Serialize + 'static + EntityEvent,
{
    type Item = T;
    type IntoIter = std::iter::Chain<std::vec::IntoIter<T>, std::vec::IntoIter<T>>;

    fn into_iter(self) -> Self::IntoIter {
        self.persisted_events.into_iter().chain(self.new_events)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Debug, serde::Serialize, serde::Deserialize)]
    enum DummyEvent {
        Created(String),
    }
    impl EntityEvent for DummyEvent {
        type EntityId = uuid::Uuid;

        fn event_table_name() -> &'static str {
            "dummy_events"
        }
    }
    struct DummyEntity {
        name: String,
    }
    impl EsEntity for DummyEntity {
        type Event = DummyEvent;
    }
    impl TryFrom<EntityEvents<DummyEvent>> for DummyEntity {
        type Error = EntityError;
        fn try_from(events: EntityEvents<DummyEvent>) -> Result<Self, Self::Error> {
            let name = events
                .into_iter()
                .map(|e| match e {
                    DummyEvent::Created(name) => name,
                })
                .next()
                .expect("Could not find name");
            Ok(Self { name })
        }
    }

    #[test]
    fn load_zero_events() {
        let generic_events = vec![];
        let res = EntityEvents::load_first::<DummyEntity>(generic_events);
        assert!(matches!(res, Err(EntityError::NoEntityEventsPresent)));
    }

    #[test]
    fn load_first() {
        let generic_events = vec![GenericEvent {
            id: uuid::Uuid::new_v4(),
            sequence: 1,
            event: serde_json::to_value(DummyEvent::Created("dummy-name".to_owned()))
                .expect("Could not serialize"),
            entity_created_at: chrono::Utc::now(),
            event_recorded_at: chrono::Utc::now(),
        }];
        let entity: DummyEntity = EntityEvents::load_first(generic_events).expect("Could not load");
        assert!(entity.name == "dummy-name");
    }

    #[test]
    fn load_n() {
        let generic_events = vec![
            GenericEvent {
                id: uuid::Uuid::new_v4(),
                sequence: 1,
                event: serde_json::to_value(DummyEvent::Created("dummy-name".to_owned()))
                    .expect("Could not serialize"),
                entity_created_at: chrono::Utc::now(),
                event_recorded_at: chrono::Utc::now(),
            },
            GenericEvent {
                id: uuid::Uuid::new_v4(),
                sequence: 1,
                event: serde_json::to_value(DummyEvent::Created("other-name".to_owned()))
                    .expect("Could not serialize"),
                entity_created_at: chrono::Utc::now(),
                event_recorded_at: chrono::Utc::now(),
            },
        ];
        let (entity, more): (Vec<DummyEntity>, _) =
            EntityEvents::load_n(generic_events, 2).expect("Could not load");
        assert!(!more);
        assert_eq!(entity.len(), 2);
    }
}
