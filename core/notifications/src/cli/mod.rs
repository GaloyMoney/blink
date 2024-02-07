pub mod config;
mod db;

use anyhow::Context;
use clap::Parser;
use std::path::PathBuf;

use self::config::{Config, EnvOverride};

#[derive(Parser)]
#[clap(long_about = None)]
struct Cli {
    #[clap(short, long, env = "NOTIFICATIONS_CONFIG", value_name = "FILE")]
    config: Option<PathBuf>,
    #[clap(env = "PG_CON")]
    pg_con: String,
    #[clap(env = "MONGODB_CON")]
    mongodb_connection: Option<String>,
}

pub async fn run() -> anyhow::Result<()> {
    let cli = Cli::parse();

    let config = Config::from_path(
        cli.config,
        EnvOverride {
            db_con: cli.pg_con,
            mongodb_connection: cli.mongodb_connection,
        },
    )?;

    run_cmd(config).await?;

    Ok(())
}

async fn run_cmd(config: Config) -> anyhow::Result<()> {
    tracing::init_tracer(config.tracing)?;

    let (send, mut receive) = tokio::sync::mpsc::channel(1);
    let mut handles = vec![];
    let pool = db::init_pool(&config.db).await?;
    let app = crate::app::NotificationsApp::init(pool, config.app).await?;
    if config.mongo_import.execute_import && config.mongo_import.connection.is_some() {
        crate::data_import::import_user_notification_settings(app.clone(), config.mongo_import)
            .await?;
    }

    println!("Starting notifications graphql server");
    let graphql_send = send.clone();
    let graphql_config = config.subgraph_server;
    let graphql_app = app.clone();
    handles.push(tokio::spawn(async move {
        let _ = graphql_send.try_send(
            crate::graphql::server::run_server(graphql_config, graphql_app)
                .await
                .context("graphql server error"),
        );
    }));

    println!("Starting notifications grpc server");
    let grpc_send = send.clone();
    let grpc_config = config.grpc_server;
    handles.push(tokio::spawn(async move {
        let _ = grpc_send.try_send(
            crate::grpc::run_server(grpc_config, app)
                .await
                .context("grpc server error"),
        );
    }));

    let reason = receive.recv().await.expect("Didn't receive msg");
    for handle in handles {
        handle.abort();
    }

    reason
}
