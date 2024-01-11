use derive_builder::Builder;
use es_entity::*;
use serde::{Deserialize, Serialize};

use crate::primitives::*;

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AccountNotificationSettingsEvent {
    Initialized {
        id: AccountNotificationSettingsId,
        galoy_account_id: GaloyAccountId,
    },
    ChannelDisabled {
        channel: NotificationChannel,
    },
    ChannelEnabled {
        channel: NotificationChannel,
    },
}

impl EntityEvent for AccountNotificationSettingsEvent {
    type EntityId = AccountNotificationSettingsId;
    fn event_table_name() -> &'static str {
        "account_notification_settings_events"
    }
}

#[derive(Builder)]
#[builder(pattern = "owned", build_fn(error = "EntityError"))]
pub struct AccountNotificationSettings {
    pub id: AccountNotificationSettingsId,
    pub galoy_account_id: GaloyAccountId,
    pub(super) events: EntityEvents<AccountNotificationSettingsEvent>,
}

impl EsEntity for AccountNotificationSettings {
    type Event = AccountNotificationSettingsEvent;
}

impl AccountNotificationSettings {
    pub fn disable_channel(&mut self, channel: NotificationChannel) {
        if !self.is_channel_enabled(channel) {
            return;
        }
        self.events
            .push(AccountNotificationSettingsEvent::ChannelDisabled { channel });
    }

    pub fn enable_channel(&mut self, channel: NotificationChannel) {
        if self.is_channel_enabled(channel) {
            return;
        }
        self.events
            .push(AccountNotificationSettingsEvent::ChannelEnabled { channel });
    }

    pub fn is_channel_enabled(&self, channel: NotificationChannel) -> bool {
        self.events.iter().fold(true, |acc, event| match event {
            AccountNotificationSettingsEvent::ChannelDisabled { channel: c } if c == &channel => {
                false
            }
            AccountNotificationSettingsEvent::ChannelEnabled { channel: c } if c == &channel => {
                true
            }
            _ => acc,
        })
    }
}

impl TryFrom<EntityEvents<AccountNotificationSettingsEvent>> for AccountNotificationSettings {
    type Error = EntityError;

    fn try_from(
        events: EntityEvents<AccountNotificationSettingsEvent>,
    ) -> Result<Self, Self::Error> {
        let mut builder = AccountNotificationSettingsBuilder::default();
        for event in events.iter() {
            match event {
                AccountNotificationSettingsEvent::Initialized {
                    id,
                    galoy_account_id,
                } => {
                    builder = builder.id(*id);
                    builder = builder.galoy_account_id(galoy_account_id.clone());
                }
                _ => (),
            }
        }
        builder.events(events).build()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn initial_events() -> EntityEvents<AccountNotificationSettingsEvent> {
        let id = AccountNotificationSettingsId::new();
        EntityEvents::init(
            id,
            [AccountNotificationSettingsEvent::Initialized {
                id,
                galoy_account_id: GaloyAccountId::from("galoy_id".to_string()),
            }],
        )
    }

    #[test]
    fn channel_is_initially_enabled() {
        let events = initial_events();
        let settings = AccountNotificationSettings::try_from(events).expect("Could not hydrate");
        assert!(settings.is_channel_enabled(NotificationChannel::Push));
    }

    #[test]
    fn can_disable_channel() {
        let events = initial_events();
        let mut settings =
            AccountNotificationSettings::try_from(events).expect("Could not hydrate");
        settings.disable_channel(NotificationChannel::Push);
        assert!(!settings.is_channel_enabled(NotificationChannel::Push));
    }

    #[test]
    fn can_reenable_channel() {
        let events = initial_events();
        let mut settings =
            AccountNotificationSettings::try_from(events).expect("Could not hydrate");
        settings.disable_channel(NotificationChannel::Push);
        settings.enable_channel(NotificationChannel::Push);
        assert!(settings.is_channel_enabled(NotificationChannel::Push));
    }
}
