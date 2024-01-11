pub mod config;
mod db;

use clap::Parser;
use std::path::PathBuf;

use self::config::{Config, EnvOverride};

#[derive(Parser)]
#[clap(long_about = None)]
struct Cli {
    #[clap(
        short,
        long,
        env = "NOTIFICATIONS_CONFIG",
        default_value = "notifications.yml",
        value_name = "FILE"
    )]
    config: PathBuf,
    #[clap(env = "PG_CON")]
    pg_con: String,
}

pub async fn run() -> anyhow::Result<()> {
    let cli = Cli::parse();

    let config = Config::from_path(cli.config, EnvOverride { db_con: cli.pg_con })?;

    run_cmd(config).await?;

    Ok(())
}

async fn run_cmd(config: Config) -> anyhow::Result<()> {
    tracing::init_tracer(config.tracing)?;
    let pool = db::init_pool(&config.db).await?;
    let app = crate::app::NotificationsApp::new(pool, config.app);
    println!("Starting notifications graphql server");
    crate::graphql::server::run_server(config.server, app).await
}
