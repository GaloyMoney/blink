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
        #[clap(env = "CLIENT_ID")]
        client_id: String,

        #[clap(env = "CLIENT_SECRET")]
        client_secret: String,

        #[clap(env = "HYDRA_API")]
        hydra_api: String,

        #[clap(env = "ADMIN_API")]
        admin_api: String,
    },
}

pub async fn run() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Command::Run {
            client_id,
            client_secret,
            hydra_api,
            admin_api,
        } => {
            let config = Config::from_env(EnvOverride {
                client_id,
                client_secret,
                hydra_api,
                admin_api,
            })?;

            run_cmd(config).await?
        }
    }
    Ok(())
}

async fn run_cmd(config: Config) -> anyhow::Result<()> {
    println!("Running server");
    crate::graphql::run_server(config).await;
    Ok(())
}
