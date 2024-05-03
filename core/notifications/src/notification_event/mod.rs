mod circle_grew;
mod circle_threshold_reached;
mod identity_verification_approved;
mod identity_verification_declined;
mod identity_verification_review_started;
mod link_email_reminder;
mod marketing_notification_triggered;
mod price_changed;
mod transaction_occurred;

use serde::{Deserialize, Serialize};

use crate::{messages::*, primitives::*};

pub(super) use circle_grew::*;
pub(super) use circle_threshold_reached::*;
pub(super) use identity_verification_approved::*;
pub(super) use identity_verification_declined::*;
pub(super) use identity_verification_review_started::*;
pub(super) use link_email_reminder::*;
pub(super) use marketing_notification_triggered::*;
pub(super) use price_changed::*;
pub(super) use transaction_occurred::*;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct DeepLink {
    pub screen: Option<DeepLinkScreen>,
    pub action: Option<DeepLinkAction>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DeepLinkScreen {
    Circles,
    Price,
    Earn,
    Map,
    People,
    Home,
    Receive,
    Convert,
    ScanQR,
    Chat,
    Settings,
    Settings2FA,
    SettingsDisplayCurrency,
    SettingsDefaultAccount,
    SettingsLanguage,
    SettingsTheme,
    SettingsSecurity,
    SettingsAccount,
    SettingsTxLimits,
    SettingsNotifications,
    SettingsEmail,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DeepLinkAction {
    SetLnAddressModal,
    SetDefaultAccountModal,
    UpgradeAccountModal,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Action {
    OpenDeepLink(DeepLink),
    OpenExternalUrl(String),
}

impl DeepLink {
    pub fn to_link_string(&self) -> String {
        let mut link_string: String = String::from("/");
        if let Some(screen) = &self.screen {
            let screen = match screen {
                DeepLinkScreen::Circles => "people/circles".to_string(),
                DeepLinkScreen::Price => "price".to_string(),
                DeepLinkScreen::Earn => "earn".to_string(),
                DeepLinkScreen::Map => "map".to_string(),
                DeepLinkScreen::People => "people".to_string(),
                DeepLinkScreen::Home => "home".to_string(),
                DeepLinkScreen::Receive => "receive".to_string(),
                DeepLinkScreen::Convert => "convert".to_string(),
                DeepLinkScreen::ScanQR => "scan-qr".to_string(),
                DeepLinkScreen::Chat => "chat".to_string(),
                DeepLinkScreen::Settings => "settings".to_string(),
                DeepLinkScreen::Settings2FA => "settings/2fa".to_string(),
                DeepLinkScreen::SettingsDisplayCurrency => "settings/display-currency".to_string(),
                DeepLinkScreen::SettingsDefaultAccount => "settings/default-account".to_string(),
                DeepLinkScreen::SettingsLanguage => "settings/language".to_string(),
                DeepLinkScreen::SettingsTheme => "settings/theme".to_string(),
                DeepLinkScreen::SettingsSecurity => "settings/security".to_string(),
                DeepLinkScreen::SettingsAccount => "settings/account".to_string(),
                DeepLinkScreen::SettingsTxLimits => "settings/tx-limits".to_string(),
                DeepLinkScreen::SettingsNotifications => "settings/notifications".to_string(),
                DeepLinkScreen::SettingsEmail => "settings/email".to_string(),
            };
            link_string.push_str(&screen);
        }
        if let Some(action) = &self.action {
            let action = match action {
                DeepLinkAction::SetLnAddressModal => "set-ln-address".to_string(),
                DeepLinkAction::SetDefaultAccountModal => "set-default-account".to_string(),
                DeepLinkAction::UpgradeAccountModal => "upgrade-account".to_string(),
            };
            link_string.push_str(&format!("?action={}", action));
        }
        link_string
    }
}

pub trait NotificationEvent: std::fmt::Debug + Send + Sync {
    fn category(&self) -> UserNotificationCategory;
    fn deep_link(&self) -> Option<DeepLink> {
        None
    }
    fn should_send_push(&self) -> bool {
        false
    }
    fn to_localized_push_msg(&self, _locale: &GaloyLocale) -> LocalizedPushMessage {
        unimplemented!()
    }
    fn should_send_email(&self) -> bool {
        false
    }
    fn to_localized_email(&self, _locale: &GaloyLocale) -> LocalizedEmail {
        unimplemented!()
    }
    fn should_be_added_to_history(&self) -> bool {
        false
    }

    fn should_be_added_to_bulletin(&self) -> bool {
        false
    }

    fn to_localized_persistent_message(&self, _locale: GaloyLocale) -> LocalizedStatefulMessage {
        unimplemented!()
    }

    fn action(&self) -> Option<Action> {
        None
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NotificationEventPayload {
    CircleGrew(CircleGrew),
    CircleThresholdReached(CircleThresholdReached),
    IdentityVerificationApproved(IdentityVerificationApproved),
    IdentityVerificationDeclined(IdentityVerificationDeclined),
    IdentityVerificationReviewStarted(IdentityVerificationReviewStarted),
    TransactionOccurred(TransactionOccurred),
    PriceChanged(PriceChanged),
    MarketingNotificationTriggered(MarketingNotificationTriggered),
    LinkEmailReminder(LinkEmailReminder),
}

impl AsRef<dyn NotificationEvent> for NotificationEventPayload {
    fn as_ref(&self) -> &(dyn NotificationEvent + 'static) {
        match self {
            NotificationEventPayload::CircleGrew(event) => event,
            NotificationEventPayload::CircleThresholdReached(event) => event,
            NotificationEventPayload::IdentityVerificationApproved(event) => event,
            NotificationEventPayload::IdentityVerificationDeclined(event) => event,
            NotificationEventPayload::IdentityVerificationReviewStarted(event) => event,
            NotificationEventPayload::TransactionOccurred(event) => event,
            NotificationEventPayload::PriceChanged(event) => event,
            NotificationEventPayload::MarketingNotificationTriggered(event) => event,
            NotificationEventPayload::LinkEmailReminder(event) => event,
        }
    }
}

impl std::ops::Deref for NotificationEventPayload {
    type Target = dyn NotificationEvent;

    fn deref(&self) -> &Self::Target {
        self.as_ref()
    }
}

impl From<CircleGrew> for NotificationEventPayload {
    fn from(event: CircleGrew) -> Self {
        NotificationEventPayload::CircleGrew(event)
    }
}

impl From<CircleThresholdReached> for NotificationEventPayload {
    fn from(event: CircleThresholdReached) -> Self {
        NotificationEventPayload::CircleThresholdReached(event)
    }
}

impl From<IdentityVerificationApproved> for NotificationEventPayload {
    fn from(event: IdentityVerificationApproved) -> Self {
        NotificationEventPayload::IdentityVerificationApproved(event)
    }
}

impl From<IdentityVerificationDeclined> for NotificationEventPayload {
    fn from(event: IdentityVerificationDeclined) -> Self {
        NotificationEventPayload::IdentityVerificationDeclined(event)
    }
}

impl From<IdentityVerificationReviewStarted> for NotificationEventPayload {
    fn from(event: IdentityVerificationReviewStarted) -> Self {
        NotificationEventPayload::IdentityVerificationReviewStarted(event)
    }
}

impl From<TransactionOccurred> for NotificationEventPayload {
    fn from(event: TransactionOccurred) -> Self {
        NotificationEventPayload::TransactionOccurred(event)
    }
}

impl From<PriceChanged> for NotificationEventPayload {
    fn from(event: PriceChanged) -> Self {
        NotificationEventPayload::PriceChanged(event)
    }
}

impl From<MarketingNotificationTriggered> for NotificationEventPayload {
    fn from(event: MarketingNotificationTriggered) -> Self {
        NotificationEventPayload::MarketingNotificationTriggered(event)
    }
}

impl From<LinkEmailReminder> for NotificationEventPayload {
    fn from(event: LinkEmailReminder) -> Self {
        NotificationEventPayload::LinkEmailReminder(event)
    }
}
