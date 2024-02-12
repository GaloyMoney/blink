use opentelemetry::{
    global,
    propagation::TextMapPropagator,
    sdk::{
        propagation::TraceContextPropagator,
        resource::{EnvResourceDetector, OsResourceDetector, ProcessResourceDetector},
        trace, Resource,
    },
};
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_semantic_conventions::resource;
use serde::{Deserialize, Serialize};
use tracing_opentelemetry::OpenTelemetrySpanExt;
use tracing_subscriber::{filter::EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};

pub use tracing::*;

use std::{collections::HashMap, time::Duration};

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
        .or_else(|_| EnvFilter::try_new("info,otel::tracing=trace,sqlx=warn,sqlx_ledger=info"))
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

pub fn insert_error_fields(level: tracing::Level, error: impl std::fmt::Display) {
    Span::current().record("error", &tracing::field::display("true"));
    Span::current().record("error.level", &tracing::field::display(level));
    Span::current().record("error.message", &tracing::field::display(error));
}

pub fn extract_tracing_data() -> HashMap<String, String> {
    let mut tracing_data = HashMap::new();
    let propagator = TraceContextPropagator::new();
    let context = Span::current().context();
    propagator.inject_context(&context, &mut tracing_data);
    tracing_data
}

pub fn inject_tracing_data(span: &Span, tracing_data: &HashMap<String, String>) {
    let propagator = TraceContextPropagator::new();
    let context = propagator.extract(tracing_data);
    span.set_parent(context);
}

pub mod http {
    pub fn extract_tracing(headers: &http::HeaderMap) {
        use opentelemetry_http::HeaderExtractor;
        use tracing_opentelemetry::OpenTelemetrySpanExt;
        let extractor = HeaderExtractor(headers);
        let ctx = opentelemetry::global::get_text_map_propagator(|propagator| {
            propagator.extract(&extractor)
        });
        tracing::Span::current().set_parent(ctx)
    }
}

pub mod grpc {
    use opentelemetry::{
        propagation::{Extractor, TextMapPropagator},
        sdk::propagation::TraceContextPropagator,
    };
    use tracing_opentelemetry::OpenTelemetrySpanExt;

    pub fn extract_tracing<T>(request: &tonic::Request<T>) {
        let propagator = TraceContextPropagator::new();
        let parent_cx = propagator.extract(&RequestContextExtractor(request));
        tracing::Span::current().set_parent(parent_cx)
    }

    struct RequestContextExtractor<'a, T>(&'a tonic::Request<T>);

    impl<'a, T> Extractor for RequestContextExtractor<'a, T> {
        fn get(&self, key: &str) -> Option<&str> {
            self.0.metadata().get(key).and_then(|s| s.to_str().ok())
        }

        fn keys(&self) -> Vec<&str> {
            self.0
                .metadata()
                .keys()
                .filter_map(|k| {
                    if let tonic::metadata::KeyRef::Ascii(key) = k {
                        Some(key.as_str())
                    } else {
                        None
                    }
                })
                .collect()
        }
    }
}
