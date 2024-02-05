#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]
#![cfg_attr(feature = "fail-on-warnings", deny(clippy::all))]

rust_i18n::i18n!("locales", fallback = "en");

mod app;
mod data_import;
mod messages;

pub mod cli;
pub mod executor;
pub mod fcm;
pub mod graphql;
pub mod grpc;
pub mod notification_event;
pub mod primitives;
pub mod user_notification_settings;
