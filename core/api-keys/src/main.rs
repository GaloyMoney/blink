use lib_api_keys::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    cli::run().await
}
