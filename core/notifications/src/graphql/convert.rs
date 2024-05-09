use async_graphql::ID;

use super::types;
use crate::{
    history, notification_event::Action, notification_event::Icon,
    primitives::StatefulNotificationId,
};

impl From<history::StatefulNotification> for types::StatefulNotification {
    fn from(notification: history::StatefulNotification) -> Self {
        let created_at = notification.created_at();
        let acknowledeg_at = notification.acknowledged_at();
        Self {
            deep_link: notification.deep_link().map(|d| d.to_link_string()),
            id: ID(notification.id.to_string()),
            title: notification.message.title.clone(),
            body: notification.message.body.clone(),
            created_at: types::Timestamp::from(created_at),
            acknowledged_at: acknowledeg_at.map(types::Timestamp::from),
            bulletin_enabled: notification.add_to_bulletin(),
            action: notification.action().map(|a| match a {
                Action::OpenDeepLink(deep_link) => {
                    types::NotificationAction::OpenDeepLinkAction(types::OpenDeepLinkAction {
                        deep_link: deep_link.to_link_string(),
                    })
                }
                Action::OpenExternalUrl(url) => types::NotificationAction::OpenExternalLinkAction(
                    types::OpenExternalLinkAction {
                        url: url.into_inner(),
                    },
                ),
            }),
            icon: notification.icon().map(Into::into),
        }
    }
}

impl From<StatefulNotificationId> for types::StatefulNotificationsByCreatedAtCursor {
    fn from(id: StatefulNotificationId) -> Self {
        Self { id }
    }
}

impl From<Icon> for types::Icon {
    fn from(icon: Icon) -> Self {
        match icon {
            Icon::ArrowRight => types::Icon::ArrowRight,
            Icon::ArrowLeft => types::Icon::ArrowLeft,
            Icon::BackSpace => types::Icon::BackSpace,
            Icon::Bank => types::Icon::Bank,
            Icon::Bitcoin => types::Icon::Bitcoin,
            Icon::Book => types::Icon::Book,
            Icon::BtcBook => types::Icon::BtcBook,
            Icon::CaretDown => types::Icon::CaretDown,
            Icon::CaretLeft => types::Icon::CaretLeft,
            Icon::CaretRight => types::Icon::CaretRight,
            Icon::CaretUp => types::Icon::CaretUp,
            Icon::CheckCircle => types::Icon::CheckCircle,
            Icon::Check => types::Icon::Check,
            Icon::Close => types::Icon::Close,
            Icon::CloseCrossWithBackground => types::Icon::CloseCrossWithBackground,
            Icon::Coins => types::Icon::Coins,
            Icon::People => types::Icon::People,
            Icon::CopyPaste => types::Icon::CopyPaste,
            Icon::Dollar => types::Icon::Dollar,
            Icon::EyeSlash => types::Icon::EyeSlash,
            Icon::Eye => types::Icon::Eye,
            Icon::Filter => types::Icon::Filter,
            Icon::Globe => types::Icon::Globe,
            Icon::Graph => types::Icon::Graph,
            Icon::Image => types::Icon::Image,
            Icon::Info => types::Icon::Info,
            Icon::Lightning => types::Icon::Lightning,
            Icon::Link => types::Icon::Link,
            Icon::Loading => types::Icon::Loading,
            Icon::MagnifyingGlass => types::Icon::MagnifyingGlass,
            Icon::Map => types::Icon::Map,
            Icon::Menu => types::Icon::Menu,
            Icon::Pencil => types::Icon::Pencil,
            Icon::Note => types::Icon::Note,
            Icon::Rank => types::Icon::Rank,
            Icon::QrCode => types::Icon::QrCode,
            Icon::Question => types::Icon::Question,
            Icon::Receive => types::Icon::Receive,
            Icon::Send => types::Icon::Send,
            Icon::Settings => types::Icon::Settings,
            Icon::Share => types::Icon::Share,
            Icon::Transfer => types::Icon::Transfer,
            Icon::User => types::Icon::User,
            Icon::Video => types::Icon::Video,
            Icon::Warning => types::Icon::Warning,
            Icon::WarningWithBackground => types::Icon::WarningWithBackground,
            Icon::PaymentSuccess => types::Icon::PaymentSuccess,
            Icon::PaymentPending => types::Icon::PaymentPending,
            Icon::PaymentError => types::Icon::PaymentError,
            Icon::Bell => types::Icon::Bell,
            Icon::Refresh => types::Icon::Refresh,
        }
    }
}
