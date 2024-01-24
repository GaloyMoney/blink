use std::env;

use lib_notifications::novu::*;

#[tokio::test]
async fn send_email_via_novu() -> anyhow::Result<()> {
    if let Ok(novu_api_key) = env::var("NOVU_API_KEY") {
        let executor = NovuExecutor::init(NovuConfig {
            api_key: novu_api_key,
        })?;
        executor.do_stuff().await?;
    } else {
        assert!(false);
    }
    Ok(())
}
