use opentelemetry::{
    global,
    sdk::{
        propagation::TraceContextPropagator,
        resource::{EnvResourceDetector, OsResourceDetector, ProcessResourceDetector},
        trace, Resource,
    },
};
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_semantic_conventions::resource;
use serde::{Deserialize, Serialize};
use tracing_subscriber::{filter::EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};

pub use tracing::*;

use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TracingConfig {
    pub service_name: String,
}

impl Default for TracingConfig {
    fn default() -> Self {
        Self {
            service_name: "dev-rs".to_string(),
        }
    }
}

pub fn init_tracer(config: TracingConfig) -> anyhow::Result<()> {
    global::set_text_map_propagator(TraceContextPropagator::new());
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(opentelemetry_otlp::new_exporter().tonic().with_env())
        .with_trace_config(trace::config().with_resource(telemetry_resource(&config)))
        .install_batch(opentelemetry::runtime::Tokio)?;
    let telemetry = tracing_opentelemetry::layer().with_tracer(tracer);

    let fmt_layer = fmt::layer().json();
    let filter_layer = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new("info,sqlx=warn,sqlx_ledger=info"))
        .unwrap();
    tracing_subscriber::registry()
        .with(filter_layer)
        .with(fmt_layer)
        .with(telemetry)
        .try_init()?;

    Ok(())
}

fn telemetry_resource(config: &TracingConfig) -> Resource {
    Resource::from_detectors(
        Duration::from_secs(3),
        vec![
            Box::new(EnvResourceDetector::new()),
            Box::new(OsResourceDetector),
            Box::new(ProcessResourceDetector),
        ],
    )
    .merge(&Resource::new(vec![
        resource::SERVICE_NAME.string(config.service_name.to_string()),
        resource::SERVICE_NAMESPACE.string("galoy"),
    ]))
}
