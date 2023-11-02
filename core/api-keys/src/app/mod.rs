use crate::admin_client::AdminClient;

#[derive(Clone)]
pub struct ApiKeysApp {
    admin_client: AdminClient,
}

impl ApiKeysApp {
    pub fn new(admin_client: AdminClient) -> Self {
        Self { admin_client }
    }
}
