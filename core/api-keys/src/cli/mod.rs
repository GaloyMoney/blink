pub mod config;

use clap::{Parser, Subcommand};

use self::config::{Config, EnvOverride};

#[derive(Parser)]
#[clap(long_about = None)]
struct Cli {
    #[clap(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    Run {
        #[clap(env = "PG_CON")]
        pg_con: String,
    },
}

pub async fn run() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Command::Run { pg_con } => {
            let config = Config::from_env(EnvOverride { pg_con })?;

            run_cmd(config).await?
        }
    }
    Ok(())
}

async fn run_cmd(config: Config) -> anyhow::Result<()> {
    println!("Running server");
    let app = crate::app::ApiKeysApp::new();
    crate::server::run_server(config.server, app).await
}
