pub mod error;

use sqlx::PgPool;

use crate::{
    messages::LocalizedInAppMessage, notification_event::DeepLink, primitives::GaloyUserId,
};

use error::*;

#[derive(Debug, Clone)]
pub struct InAppChannel {
    _pool: PgPool,
}

impl InAppChannel {
    pub fn new(pool: &PgPool) -> Self {
        InAppChannel {
            _pool: pool.clone(),
        }
    }

    pub async fn send_msg(
        &self,
        _user_id: &GaloyUserId,
        _msg: LocalizedInAppMessage,
        _deep_link: Option<DeepLink>,
    ) -> Result<(), InAppChannelError> {
        unimplemented!()
    }
}
