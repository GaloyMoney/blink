use serde::{de::DeserializeOwned, Serialize};

use super::error::EntityError;

#[derive(sqlx::Type)]
pub struct GenericEvent {
    pub id: uuid::Uuid,
    pub sequence: i32,
    pub event: serde_json::Value,
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

pub trait EsEntityProjection<E>
where
    Self: Default,
{
    fn apply(&mut self, event: &E) -> Self;
}

pub struct EntityEvents<T: EntityEvent> {
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
            entity_id: id,
            persisted_events: Vec::new(),
            new_events: initial_events.into_iter().collect(),
        }
    }

    pub fn push(&mut self, event: T) {
        self.new_events.push(event);
    }

    pub fn project<P: EsEntityProjection<T>>(&self) -> P {
        self.persisted_events
            .iter()
            .chain(self.new_events.iter())
            .fold(P::default(), |mut acc, event| {
                acc = acc.apply(event);
                acc
            })
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
        let query = query_builder.build();
        query.execute(&mut **tx).await?;

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
                    entity_id: e.id.into(),
                    persisted_events: Vec::new(),
                    new_events: Vec::new(),
                });
            }
            if current_id != Some(e.id) {
                break;
            }
            current
                .as_mut()
                .expect("Could not get current")
                .persisted_events
                .push(serde_json::from_value(e.event).expect("Could not deserialize event"));
        }
        if let Some(current) = current {
            E::try_from(current)
        } else {
            Err(EntityError::NoEntityEventsPresent)
        }
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
                .find_map(|e| match e {
                    DummyEvent::Created(name) => Some(name),
                })
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
        }];
        let entity: DummyEntity = EntityEvents::load_first(generic_events).expect("Could not load");
        assert!(entity.name == "dummy-name");
    }
}
