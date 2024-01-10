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

pub trait Entity: TryFrom<EntityEvents<<Self as Entity>::Event>, Error = EntityError> {
    type Event: EntityEvent;
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

    pub async fn persist(
        &mut self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    ) -> Result<usize, sqlx::Error> {
        let uuid: uuid::Uuid = self.entity_id.into();
        let mut events = Vec::new();
        std::mem::swap(&mut events, &mut self.new_events);

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

    pub fn load_n<E: Entity<Event = T>>(
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
                    entity_id: e.id.into(),
                    persisted_events: Vec::new(),
                    new_events: Vec::new(),
                });
            }
            current
                .as_mut()
                .expect("Could not get current")
                .persisted_events
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

    pub fn last_persisted(&self, n: usize) -> impl Iterator<Item = &T> {
        let start = self.persisted_events.len() - n - 1;
        self.persisted_events[start..].iter()
    }
}
