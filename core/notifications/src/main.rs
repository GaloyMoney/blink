use lib_notifications::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    cli::run().await
}
