use derive_builder::Builder;
use es_entity::*;
use serde::{Deserialize, Serialize};

use std::collections::HashSet;

use crate::primitives::*;

const DEFAULT_LOCALE: &str = "en-US";

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum UserNotificationSettingsEvent {
    Initialized {
        id: UserNotificationSettingsId,
        galoy_user_id: GaloyUserId,
    },
    ChannelDisabled {
        channel: UserNotificationChannel,
    },
    ChannelEnabled {
        channel: UserNotificationChannel,
    },
    CategoryDisabled {
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    },
    CategoryEnabled {
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    },
    LocaleUpdated {
        locale: String,
    },
}

impl EntityEvent for UserNotificationSettingsEvent {
    type EntityId = UserNotificationSettingsId;
    fn event_table_name() -> &'static str {
        "user_notification_settings_events"
    }
}

#[derive(Builder)]
#[builder(pattern = "owned", build_fn(error = "EntityError"))]
pub struct UserNotificationSettings {
    pub id: UserNotificationSettingsId,
    pub galoy_user_id: GaloyUserId,
    pub(super) events: EntityEvents<UserNotificationSettingsEvent>,
}

impl EsEntity for UserNotificationSettings {
    type Event = UserNotificationSettingsEvent;
}

impl UserNotificationSettings {
    pub fn new(galoy_user_id: GaloyUserId) -> Self {
        let id = UserNotificationSettingsId::new();
        Self::try_from(EntityEvents::init(
            id,
            [UserNotificationSettingsEvent::Initialized { id, galoy_user_id }],
        ))
        .expect("Could not create default")
    }

    pub fn update_locale(&mut self, locale: String) {
        if self.locale() != locale {
            self.events
                .push(UserNotificationSettingsEvent::LocaleUpdated { locale });
        }
    }

    pub fn locale(&self) -> String {
        let mut ret = DEFAULT_LOCALE;
        for event in self.events.iter() {
            if let UserNotificationSettingsEvent::LocaleUpdated { locale } = event {
                ret = locale;
            }
        }
        ret.to_string()
    }

    pub fn disable_channel(&mut self, channel: UserNotificationChannel) {
        if !self.is_channel_enabled(channel) {
            return;
        }
        self.events
            .push(UserNotificationSettingsEvent::ChannelDisabled { channel });
    }

    pub fn enable_channel(&mut self, channel: UserNotificationChannel) {
        if self.is_channel_enabled(channel) {
            return;
        }
        self.events
            .push(UserNotificationSettingsEvent::ChannelEnabled { channel });
    }

    pub fn is_channel_enabled(&self, channel: UserNotificationChannel) -> bool {
        self.events.iter().fold(true, |acc, event| match event {
            UserNotificationSettingsEvent::ChannelDisabled { channel: c } if c == &channel => false,
            UserNotificationSettingsEvent::ChannelEnabled { channel: c } if c == &channel => true,
            _ => acc,
        })
    }

    pub fn disable_category(
        &mut self,
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    ) {
        if self.disabled_categories_for(channel).contains(&category) {
            return;
        }
        self.events
            .push(UserNotificationSettingsEvent::CategoryDisabled { channel, category });
    }

    pub fn enable_category(
        &mut self,
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    ) {
        if !self.disabled_categories_for(channel).contains(&category) {
            return;
        }
        self.events
            .push(UserNotificationSettingsEvent::CategoryEnabled { channel, category });
    }

    pub fn disabled_categories_for(
        &self,
        channel: UserNotificationChannel,
    ) -> HashSet<UserNotificationCategory> {
        self.events.iter().fold(HashSet::new(), |mut acc, event| {
            match event {
                UserNotificationSettingsEvent::CategoryDisabled {
                    channel: c,
                    category,
                } if c == &channel => {
                    acc.insert(*category);
                }
                UserNotificationSettingsEvent::CategoryEnabled {
                    channel: c,
                    category,
                } if c == &channel => {
                    acc.remove(category);
                }
                _ => (),
            }
            acc
        })
    }

    pub fn should_send_notification(
        &self,
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    ) -> bool {
        self.is_channel_enabled(channel)
            && !self.disabled_categories_for(channel).contains(&category)
    }
}

impl TryFrom<EntityEvents<UserNotificationSettingsEvent>> for UserNotificationSettings {
    type Error = EntityError;

    fn try_from(events: EntityEvents<UserNotificationSettingsEvent>) -> Result<Self, Self::Error> {
        let mut builder = UserNotificationSettingsBuilder::default();
        for event in events.iter() {
            if let UserNotificationSettingsEvent::Initialized { id, galoy_user_id } = event {
                builder = builder.id(*id);
                builder = builder.galoy_user_id(galoy_user_id.clone());
            }
        }
        builder.events(events).build()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn initial_events() -> EntityEvents<UserNotificationSettingsEvent> {
        let id = UserNotificationSettingsId::new();
        EntityEvents::init(
            id,
            [UserNotificationSettingsEvent::Initialized {
                id,
                galoy_user_id: GaloyUserId::from("galoy_id".to_string()),
            }],
        )
    }

    #[test]
    fn channel_is_initially_enabled() {
        let events = initial_events();
        let settings = UserNotificationSettings::try_from(events).expect("Could not hydrate");
        assert!(settings.is_channel_enabled(UserNotificationChannel::Push));
    }

    #[test]
    fn can_disable_channel() {
        let events = initial_events();
        let mut settings = UserNotificationSettings::try_from(events).expect("Could not hydrate");
        settings.disable_channel(UserNotificationChannel::Push);
        assert!(!settings.is_channel_enabled(UserNotificationChannel::Push));
    }

    #[test]
    fn can_reenable_channel() {
        let events = initial_events();
        let mut settings = UserNotificationSettings::try_from(events).expect("Could not hydrate");
        settings.disable_channel(UserNotificationChannel::Push);
        settings.enable_channel(UserNotificationChannel::Push);
        assert!(settings.is_channel_enabled(UserNotificationChannel::Push));
    }

    #[test]
    fn no_categories_initially_disabled() {
        let events = initial_events();
        let settings = UserNotificationSettings::try_from(events).expect("Could not hydrate");
        assert_eq!(
            settings.disabled_categories_for(UserNotificationChannel::Push),
            HashSet::new(),
        );
    }

    #[test]
    fn can_disable_categories() {
        let events = initial_events();
        let mut settings = UserNotificationSettings::try_from(events).expect("Could not hydrate");
        settings.disable_category(
            UserNotificationChannel::Push,
            UserNotificationCategory::Circles,
        );
        assert_eq!(
            settings.disabled_categories_for(UserNotificationChannel::Push),
            HashSet::from([UserNotificationCategory::Circles])
        );
    }

    #[test]
    fn can_enable_categories() {
        let events = initial_events();
        let mut settings = UserNotificationSettings::try_from(events).expect("Could not hydrate");
        settings.disable_category(
            UserNotificationChannel::Push,
            UserNotificationCategory::Circles,
        );
        settings.disable_category(
            UserNotificationChannel::Push,
            UserNotificationCategory::Payments,
        );
        settings.enable_category(
            UserNotificationChannel::Push,
            UserNotificationCategory::Circles,
        );
        assert_eq!(
            settings.disabled_categories_for(UserNotificationChannel::Push),
            HashSet::from([UserNotificationCategory::Payments])
        );
    }

    #[test]
    fn should_send_notification() {
        let events = initial_events();
        let settings = UserNotificationSettings::try_from(events).expect("Could not hydrate");
        assert!(settings.should_send_notification(
            UserNotificationChannel::Push,
            UserNotificationCategory::Circles
        ));
    }

    #[test]
    fn should_not_send_notification_if_category_is_disabled() {
        let events = initial_events();
        let mut settings = UserNotificationSettings::try_from(events).expect("Could not hydrate");
        settings.disable_category(
            UserNotificationChannel::Push,
            UserNotificationCategory::Payments,
        );
        assert!(!settings.should_send_notification(
            UserNotificationChannel::Push,
            UserNotificationCategory::Payments,
        ));
    }

    #[test]
    fn should_not_send_notification_if_channel_is_disabled() {
        let events = initial_events();
        let mut settings = UserNotificationSettings::try_from(events).expect("Could not hydrate");
        settings.disable_channel(UserNotificationChannel::Push);
        assert!(!settings.should_send_notification(
            UserNotificationChannel::Push,
            UserNotificationCategory::Payments,
        ));
    }
}
