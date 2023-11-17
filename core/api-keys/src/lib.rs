#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]
#![cfg_attr(feature = "fail-on-warnings", deny(clippy::all))]

pub mod app;
pub mod cli;
mod entity;
pub mod graphql;
pub mod identity;
pub mod scope;
pub mod server;
