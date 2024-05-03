use super::proto;
use crate::{
    app::error::ApplicationError,
    notification_event,
    primitives::*,
    user_notification_settings::{self, error::UserNotificationSettingsError},
};

impl From<proto::NotificationCategory> for UserNotificationCategory {
    fn from(category: proto::NotificationCategory) -> Self {
        match category {
            proto::NotificationCategory::Circles => UserNotificationCategory::Circles,
            proto::NotificationCategory::Payments => UserNotificationCategory::Payments,
            proto::NotificationCategory::AdminNotification => {
                UserNotificationCategory::AdminNotification
            }
            proto::NotificationCategory::Marketing => UserNotificationCategory::Marketing,
            proto::NotificationCategory::Price => UserNotificationCategory::Price,
        }
    }
}

impl From<proto::NotificationChannel> for UserNotificationChannel {
    fn from(channel: proto::NotificationChannel) -> Self {
        match channel {
            proto::NotificationChannel::Push => UserNotificationChannel::Push,
        }
    }
}

impl From<ApplicationError> for tonic::Status {
    fn from(err: ApplicationError) -> Self {
        if let ApplicationError::UserNotificationSettingsError(
            UserNotificationSettingsError::ConcurrentModification,
        ) = err
        {
            tonic::Status::aborted(err.to_string())
        } else {
            tonic::Status::internal(err.to_string())
        }
    }
}

impl From<user_notification_settings::UserNotificationSettings> for proto::NotificationSettings {
    fn from(settings: user_notification_settings::UserNotificationSettings) -> Self {
        Self {
            locale: settings.locale().map(|l| l.to_string()),
            push: Some(proto::ChannelNotificationSettings {
                enabled: settings.is_channel_enabled(UserNotificationChannel::Push),
                disabled_categories: settings
                    .disabled_categories_for(UserNotificationChannel::Push)
                    .into_iter()
                    .map(|category| proto::NotificationCategory::from(category).into())
                    .collect(),
            }),
            push_device_tokens: settings
                .push_device_tokens()
                .into_iter()
                .map(|token| token.to_string())
                .collect(),
        }
    }
}

impl From<UserNotificationCategory> for proto::NotificationCategory {
    fn from(category: UserNotificationCategory) -> Self {
        match category {
            UserNotificationCategory::Circles => proto::NotificationCategory::Circles,
            UserNotificationCategory::Payments => proto::NotificationCategory::Payments,
            UserNotificationCategory::AdminNotification => {
                proto::NotificationCategory::AdminNotification
            }
            UserNotificationCategory::Marketing => proto::NotificationCategory::Marketing,
            UserNotificationCategory::Price => proto::NotificationCategory::Price,
            UserNotificationCategory::Security => {
                unreachable!("should never match security to grpc category")
            }
        }
    }
}

impl From<proto::CircleType> for CircleType {
    fn from(c_type: proto::CircleType) -> Self {
        match c_type {
            proto::CircleType::Inner => CircleType::Inner,
            proto::CircleType::Outer => CircleType::Outer,
        }
    }
}

impl From<proto::CircleTimeFrame> for CircleTimeFrame {
    fn from(c_type: proto::CircleTimeFrame) -> Self {
        match c_type {
            proto::CircleTimeFrame::Month => CircleTimeFrame::Month,
            proto::CircleTimeFrame::AllTime => CircleTimeFrame::AllTime,
        }
    }
}

impl From<proto::DeclinedReason> for notification_event::IdentityVerificationDeclinedReason {
    fn from(reason: proto::DeclinedReason) -> Self {
        match reason {
            proto::DeclinedReason::DocumentsNotClear => {
                notification_event::IdentityVerificationDeclinedReason::DocumentsNotClear
            }
            proto::DeclinedReason::VerificationPhotoNotClear => {
                notification_event::IdentityVerificationDeclinedReason::SelfieNotClear
            }
            proto::DeclinedReason::DocumentsNotSupported => {
                notification_event::IdentityVerificationDeclinedReason::DocumentsNotSupported
            }
            proto::DeclinedReason::DocumentsExpired => {
                notification_event::IdentityVerificationDeclinedReason::DocumentsExpired
            }
            proto::DeclinedReason::Other => {
                notification_event::IdentityVerificationDeclinedReason::Other
            }
            proto::DeclinedReason::DocumentsDoNotMatch => {
                notification_event::IdentityVerificationDeclinedReason::DocumentsDoNotMatch
            }
        }
    }
}

impl From<proto::TransactionType> for notification_event::TransactionType {
    fn from(reason: proto::TransactionType) -> Self {
        match reason {
            proto::TransactionType::IntraLedgerPayment => {
                notification_event::TransactionType::IntraLedgerPayment
            }
            proto::TransactionType::IntraLedgerReceipt => {
                notification_event::TransactionType::IntraLedgerReceipt
            }
            proto::TransactionType::OnchainReceipt => {
                notification_event::TransactionType::OnchainReceipt
            }
            proto::TransactionType::OnchainPayment => {
                notification_event::TransactionType::OnchainPayment
            }
            proto::TransactionType::OnchainReceiptPending => {
                notification_event::TransactionType::OnchainReceiptPending
            }
            proto::TransactionType::LightningReceipt => {
                notification_event::TransactionType::LightningReceipt
            }
            proto::TransactionType::LightningPayment => {
                notification_event::TransactionType::LightningPayment
            }
        }
    }
}

impl TryFrom<proto::Money> for notification_event::TransactionAmount {
    type Error = ApplicationError;

    fn try_from(money: proto::Money) -> Result<Self, Self::Error> {
        Ok(Self {
            minor_units: money.minor_units,
            currency: Currency::try_from(money.currency_code)
                .map_err(ApplicationError::UnknownCurrencyCode)?,
        })
    }
}

impl TryFrom<proto::Money> for notification_event::PriceOfOneBitcoin {
    type Error = ApplicationError;

    fn try_from(money: proto::Money) -> Result<Self, Self::Error> {
        Ok(Self {
            minor_units: money.minor_units,
            currency: Currency::try_from(money.currency_code)
                .map_err(ApplicationError::UnknownCurrencyCode)?,
        })
    }
}

impl From<proto::PriceChangeDirection> for notification_event::PriceChangeDirection {
    fn from(d: proto::PriceChangeDirection) -> Self {
        match d {
            proto::PriceChangeDirection::Up => notification_event::PriceChangeDirection::Up,
            proto::PriceChangeDirection::Down => notification_event::PriceChangeDirection::Down,
        }
    }
}

impl From<proto::DeepLinkScreen> for notification_event::DeepLinkScreen {
    fn from(screen: proto::DeepLinkScreen) -> Self {
        match screen {
            proto::DeepLinkScreen::Circles => notification_event::DeepLinkScreen::Circles,
            proto::DeepLinkScreen::Price => notification_event::DeepLinkScreen::Price,
            proto::DeepLinkScreen::Earn => notification_event::DeepLinkScreen::Earn,
            proto::DeepLinkScreen::Map => notification_event::DeepLinkScreen::Map,
            proto::DeepLinkScreen::People => notification_event::DeepLinkScreen::People,
            proto::DeepLinkScreen::Home => notification_event::DeepLinkScreen::Home,
            proto::DeepLinkScreen::Receive => notification_event::DeepLinkScreen::Receive,
            proto::DeepLinkScreen::Convert => notification_event::DeepLinkScreen::Convert,
            proto::DeepLinkScreen::ScanQr => notification_event::DeepLinkScreen::ScanQR,
            proto::DeepLinkScreen::Chat => notification_event::DeepLinkScreen::Chat,
            proto::DeepLinkScreen::Settings => notification_event::DeepLinkScreen::Settings,
            proto::DeepLinkScreen::Settings2Fa => notification_event::DeepLinkScreen::Settings2FA,
            proto::DeepLinkScreen::SettingsDisplayCurrency => {
                notification_event::DeepLinkScreen::SettingsDisplayCurrency
            }
            proto::DeepLinkScreen::SettingsDefaultAccount => {
                notification_event::DeepLinkScreen::SettingsDefaultAccount
            }
            proto::DeepLinkScreen::SettingsLanguage => {
                notification_event::DeepLinkScreen::SettingsLanguage
            }
            proto::DeepLinkScreen::SettingsTheme => {
                notification_event::DeepLinkScreen::SettingsTheme
            }
            proto::DeepLinkScreen::SettingsSecurity => {
                notification_event::DeepLinkScreen::SettingsSecurity
            }
            proto::DeepLinkScreen::SettingsAccount => {
                notification_event::DeepLinkScreen::SettingsAccount
            }
            proto::DeepLinkScreen::SettingsTxLimits => {
                notification_event::DeepLinkScreen::SettingsTxLimits
            }
            proto::DeepLinkScreen::SettingsNotifications => {
                notification_event::DeepLinkScreen::SettingsNotifications
            }
            proto::DeepLinkScreen::SettingsEmail => {
                notification_event::DeepLinkScreen::SettingsEmail
            }
        }
    }
}

impl From<proto::DeepLinkAction> for notification_event::DeepLinkAction {
    fn from(action: proto::DeepLinkAction) -> Self {
        match action {
            proto::DeepLinkAction::SetLnAddressModal => {
                notification_event::DeepLinkAction::SetLnAddressModal
            }
            proto::DeepLinkAction::SetDefaultAccountModal => {
                notification_event::DeepLinkAction::SetDefaultAccountModal
            }
            proto::DeepLinkAction::UpgradeAccountModal => {
                notification_event::DeepLinkAction::UpgradeAccountModal
            }
        }
    }
}

impl From<proto::Action> for notification_event::Action {
    fn from(action: proto::Action) -> Self {
        match action.data {
            Some(proto::action::Data::DeepLink(deep_link)) => {
                let screen = deep_link.screen.and_then(|screen| {
                    proto::DeepLinkScreen::try_from(screen)
                        .map(notification_event::DeepLinkScreen::from)
                        .ok()
                });

                let action = deep_link.action.and_then(|action| {
                    proto::DeepLinkAction::try_from(action)
                        .map(notification_event::DeepLinkAction::from)
                        .ok()
                });

                let dl = notification_event::DeepLink { screen, action };
                notification_event::Action::OpenDeepLink(dl)
            }
            Some(proto::action::Data::ExternalUrl(url)) => {
                notification_event::Action::OpenExternalUrl(url)
            }
            None => unreachable!("action data should always be set"),
        }
    }
}
