use crate::{
    messages::LocalizedInAppMessage, notification_event::DeepLink, primitives::GaloyUserId,
};

pub mod error;

use error::*;

#[derive(Debug, Clone)]
pub struct InAppChannel {}

impl InAppChannel {
    pub async fn send_msg(
        &self,
        user_id: &GaloyUserId,
        msg: LocalizedInAppMessage,
        deep_link: Option<DeepLink>,
    ) -> Result<(), InAppChannelError> {
        Ok(())
    }
}
