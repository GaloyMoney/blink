use std::env;

use lib_notifications::novu::*;
use novu::subscriber::*;

#[tokio::test]
#[ignore]
async fn send_email_via_novu() -> anyhow::Result<()> {
    if let Ok(novu_api_key) = env::var("NOVU_API_KEY") {
        let executor = NovuExecutor::init(NovuConfig {
            api_key: novu_api_key,
        })?;

        let trigger_name = "random_trigger".to_string();
        let recipient_email = "name@example.com".to_string();
        let recipient_id = "random_id".to_string();
        executor
            .trigger_email_workflow(trigger_name, recipient_email, recipient_id)
            .await?;
    } else {
        panic!()
    }
    Ok(())
}

#[tokio::test]
#[ignore]
async fn update_subscriber() -> anyhow::Result<()> {
    if let Ok(novu_api_key) = env::var("NOVU_API_KEY") {
        let executor = NovuExecutor::init(NovuConfig {
            api_key: novu_api_key,
        })?;

        let subscriber_id = "some-random-user-id".to_string();
        let payload = SubscriberPayload {
            email: None,
            first_name: None,
            last_name: None,
            phone: None,
            avatar: None,
            subscriber_id: subscriber_id.clone(),
        };
        executor.update_subscriber(subscriber_id, payload).await?;
    } else {
        panic!()
    }
    Ok(())
}

#[tokio::test]
#[ignore]
async fn get_subscriber() -> anyhow::Result<()> {
    if let Ok(novu_api_key) = env::var("NOVU_API_KEY") {
        let executor = NovuExecutor::init(NovuConfig {
            api_key: novu_api_key,
        })?;
        let subscriber_id = "some-random-user-id".to_string();
        executor.get_subscriber(subscriber_id).await?;
    } else {
        panic!()
    }
    Ok(())
}

#[tokio::test]
#[ignore]
async fn create_subscriber() -> anyhow::Result<()> {
    if let Ok(novu_api_key) = env::var("NOVU_API_KEY") {
        let executor = NovuExecutor::init(NovuConfig {
            api_key: novu_api_key,
        })?;

        let mut data = std::collections::HashMap::new();
        data.insert(
            "user".to_string(),
            serde_json::Value::String("special".to_string()),
        );
        let payload = CreateSubscriberPayload {
            email: Some("name@example.com".to_string()),
            first_name: Some("name".to_string()),
            last_name: None,
            phone: None,
            avatar: None,
            subscriber_id: "some-random-user-id".to_string(),
            data: Some(data),
        };
        executor.create_subscriber(payload).await?;
    } else {
        panic!()
    }
    Ok(())
}
