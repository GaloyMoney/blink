use es_entity::EsEntityProjection;

use super::types::NotificationSettingsAlt;
use crate::account_notification_settings::*;

impl EsEntityProjection<AccountNotificationSettingsEvent> for NotificationSettingsAlt {
    fn apply(&mut self, _: &AccountNotificationSettingsEvent) -> Self {
        unimplemented!()
    }
}
