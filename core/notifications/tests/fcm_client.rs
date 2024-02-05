use google_fcm1::api::{Message, Notification, SendMessageRequest};

use lib_notifications::fcm::*;

#[tokio::test]
#[ignore]
async fn fcm() -> anyhow::Result<()> {
    let fcm = FcmExecutor::new().await;

    let message = Message {
        notification: Some(Notification {
            title: Some("title".to_string()),
            body: Some("body".to_string()),
            ..Default::default()
        }),
        token: Some("some-device-token".to_string()),
        ..Default::default()
    };
    let req = SendMessageRequest {
        message: Some(message),
        ..Default::default()
    };
    let _response = fcm
        .client
        .projects()
        .messages_send(req, "parent") // parent refers to the {projects/project_id} part of the URL
        .doit()
        .await?;
    Ok(())
}
