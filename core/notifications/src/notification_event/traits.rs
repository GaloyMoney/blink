use super::DeepLink;
use crate::{messages::*, primitives::*};

pub trait NotificationEvent: ToLocalizedEmail + std::fmt::Debug + Send + Sync {
    fn category(&self) -> UserNotificationCategory;
    fn deep_link(&self) -> Option<DeepLink>;
    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage;
    fn should_send_in_app_msg(&self) -> bool;
    fn to_localized_in_app_msg(&self, locale: GaloyLocale) -> Option<LocalizedInAppMessage>;
}

pub trait ToLocalizedEmail {
    fn should_send_email(&self) -> bool;
    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail>;
}

impl<T> ToLocalizedEmail for T
where
    T: NotificationEvent + ?Sized,
    T: !AsEmail,
{
    fn should_send_email(&self) -> bool {
        false
    }

    fn to_localized_email(&self, _locale: GaloyLocale) -> Option<LocalizedEmail> {
        None
    }
}

impl<T: AsEmail> ToLocalizedEmail for T {
    fn should_send_email(&self) -> bool {
        true
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        Some(self.to_localized_email(locale))
    }
}

pub trait AsEmail {
    fn to_localized_email(&self, _locale: GaloyLocale) -> LocalizedEmail;
}
