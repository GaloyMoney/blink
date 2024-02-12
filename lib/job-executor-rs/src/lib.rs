use derive_builder::Builder;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use sqlxmq::CurrentJob;
use std::{collections::HashMap, time::Duration};
use tokio::task::JoinHandle;
use tracing::{extract_tracing_data, inject_tracing_data, instrument, Span};

pub trait JobExecutionError: std::fmt::Display + From<sqlx::Error> {}

pub struct KeepAliveHandle(Option<JoinHandle<()>>);
impl KeepAliveHandle {
    pub fn new(inner: JoinHandle<()>) -> Self {
        Self(Some(inner))
    }
    pub fn into_inner(mut self) -> JoinHandle<()> {
        self.0.take().expect("Only consumed once")
    }
    pub async fn stop(self) {
        let handle = self.into_inner();
        handle.abort();
        let _ = handle.await;
    }
}
impl Drop for KeepAliveHandle {
    fn drop(&mut self) {
        if let Some(handle) = self.0.take() {
            handle.abort();
        }
    }
}

#[derive(Builder)]
#[builder(pattern = "owned")]
pub struct JobExecutor<'a> {
    job: &'a mut CurrentJob,
    #[builder(default = "4")]
    warn_retries: u32,
    #[builder(default = "5")]
    max_attempts: u32,
    #[builder(default = "Duration::from_secs(1)")]
    initial_retry_delay: Duration,
    #[builder(default = "Duration::from_secs(60)")]
    max_retry_delay: Duration,
}

impl<'a> JobExecutor<'a> {
    pub fn builder(job: &'a mut CurrentJob) -> JobExecutorBuilder<'a> {
        JobExecutorBuilder::default().job(job)
    }

    #[instrument(name = "execute_job", skip_all, fields(
            job_id, job_name, checkpoint_json, attempt, last_attempt,
            error, error.level, error.message
    ), err)]
    pub async fn execute<T, E, R, F>(mut self, func: F) -> Result<T, E>
    where
        T: DeserializeOwned + Serialize,
        E: JobExecutionError,
        R: std::future::Future<Output = Result<T, E>>,
        F: FnOnce(Option<T>) -> R,
    {
        let mut data = JobData::<T>::from_raw_payload(self.job.raw_json()).unwrap();
        let keep_alive_handle = self.spawn_keep_alive(data.job_meta.wait_till_next_attempt);

        let completed = self.checkpoint_attempt(&mut data).await?;
        let result = func(data.data).await;

        keep_alive_handle.stop().await;

        if let Err(ref e) = result {
            self.handle_error(data.job_meta, e).await;
        } else if !completed {
            self.job.complete().await?;
        }
        result
    }

    fn spawn_keep_alive(&self, mut interval: Duration) -> KeepAliveHandle {
        let pool = self.job.pool().clone();
        let id = self.job.id();
        let max_interval = self.max_retry_delay;
        let handle = tokio::spawn(async move {
            loop {
                tokio::time::sleep(interval / 2).await;
                interval = max_interval.min(interval * 2);
                if let Err(e) = sqlx::query("SELECT mq_keep_alive(ARRAY[$1], $2)")
                    .bind(id)
                    .bind(interval)
                    .execute(&pool)
                    .await
                {
                    tracing::error!("Failed to keep job {id} alive: {e}");
                    break;
                }
            }
        });
        KeepAliveHandle::new(handle)
    }

    async fn handle_error<E: JobExecutionError>(&mut self, meta: JobMeta, error: &E) {
        Span::current().record("error", &tracing::field::display("true"));
        Span::current().record("error.message", &tracing::field::display(&error));
        if meta.attempts <= self.warn_retries {
            Span::current().record(
                "error.level",
                &tracing::field::display(tracing::Level::WARN),
            );
        } else {
            Span::current().record(
                "error.level",
                &tracing::field::display(tracing::Level::ERROR),
            );
        }
    }

    async fn checkpoint_attempt<T: Serialize>(
        &mut self,
        data: &mut JobData<T>,
    ) -> Result<bool, sqlx::Error> {
        let span = Span::current();

        if let Some(tracing_data) = data.job_meta.tracing_data.as_ref() {
            inject_tracing_data(&span, tracing_data);
        } else {
            inject_tracing_data(&span, &data.tracing_data);
        }
        if data.job_meta.attempts == 0 {
            data.job_meta.wait_till_next_attempt = self.initial_retry_delay;
        }

        data.job_meta.attempts += 1;
        data.job_meta.tracing_data = Some(extract_tracing_data());

        span.record("job_id", &tracing::field::display(self.job.id()));
        span.record("job_name", &tracing::field::display(self.job.name()));
        span.record("attempt", &tracing::field::display(data.job_meta.attempts));
        span.record(
            "checkpoint_json",
            &tracing::field::display(serde_json::to_string(&data).expect("Couldn't checkpoint")),
        );

        let mut checkpoint =
            sqlxmq::Checkpoint::new_keep_alive(data.job_meta.wait_till_next_attempt);

        data.job_meta.wait_till_next_attempt = self
            .max_retry_delay
            .min(data.job_meta.wait_till_next_attempt * 2);
        if data.job_meta.attempts < self.max_attempts {
            checkpoint.set_extra_retries(1);
        }

        checkpoint.set_json(&data).expect("Couldn't update tracker");
        let mut tx = self.job.pool().begin().await?;
        if let Ok(interval) =
            sqlx::postgres::types::PgInterval::try_from(data.job_meta.wait_till_next_attempt)
        {
            sqlx::query!(
                "UPDATE mq_msgs SET retry_backoff = $1 WHERE id = $2",
                interval,
                self.job.id()
            )
            .execute(&mut *tx)
            .await?;
        }
        self.job
            .checkpoint_with_transaction(tx, &checkpoint)
            .await?;

        if data.job_meta.attempts >= self.max_attempts {
            span.record("last_attempt", &tracing::field::display(true));
            self.job.complete().await?;
            Ok(true)
        } else {
            span.record("last_attempt", &tracing::field::display(false));
            Ok(false)
        }
    }
}

#[derive(Deserialize, Serialize)]
struct JobData<T> {
    #[serde(rename = "_job_meta", default)]
    job_meta: JobMeta,
    #[serde(flatten)]
    data: Option<T>,
    #[serde(flatten)]
    tracing_data: HashMap<String, String>,
}

impl<'a, T: Deserialize<'a>> JobData<T> {
    pub fn from_raw_payload(payload: Option<&'a str>) -> Result<Self, serde_json::Error> {
        if let Some(payload) = payload {
            serde_json::from_str(payload)
        } else {
            Ok(Self {
                job_meta: JobMeta::default(),
                data: None,
                tracing_data: HashMap::new(),
            })
        }
    }
}

#[serde_with::serde_as]
#[derive(Serialize, Deserialize)]
struct JobMeta {
    attempts: u32,
    #[serde_as(as = "serde_with::DurationSeconds<u64>")]
    wait_till_next_attempt: Duration,
    tracing_data: Option<HashMap<String, String>>,
}
impl Default for JobMeta {
    fn default() -> Self {
        Self {
            attempts: 0,
            wait_till_next_attempt: Duration::from_secs(1),
            tracing_data: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Deserialize)]
    struct DummyData {
        value: String,
    }

    #[test]
    fn from_raw() {
        let json = r#"{
            "_job_meta": {
                "attempts": 1,
                "wait_till_next_attempt": 1
            }
        }"#;
        let job_data: JobData<DummyData> = JobData::from_raw_payload(Some(json)).unwrap();
        assert!(job_data.job_meta.attempts == 1);
        assert!(job_data.data.is_none());
        assert!(job_data.tracing_data.is_empty());

        let json = r#"{
            "value": "test"
        }"#;
        let job_data: JobData<DummyData> = JobData::from_raw_payload(Some(json)).unwrap();
        assert!(job_data.job_meta.attempts == 0);
        assert_eq!(job_data.data.unwrap().value, "test");
        assert!(job_data.tracing_data.is_empty());

        let json = r#"{
            "_job_meta": {
                "attempts": 2,
                "wait_till_next_attempt": 1
            },
            "header": "value"
        }"#;
        let job_data: JobData<DummyData> = JobData::from_raw_payload(Some(json)).unwrap();
        assert!(job_data.job_meta.attempts == 2);
        assert!(job_data.data.is_none());
        assert_eq!(job_data.tracing_data.get("header").unwrap(), "value");
    }
}
