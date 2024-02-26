use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::{DeepLink, NotificationEvent, NotificationEventError};
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum TransactionType {
    IntraLedgerReceipt,
    IntraLedgerPayment,
    OnchainReceipt,
    OnchainReceiptPending,
    OnchainPayment,
    LightningReceipt,
    LightningPayment,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransactionInfo {
    pub user_id: GaloyUserId,
    pub transaction_type: TransactionType,
}

impl NotificationEvent for TransactionInfo {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Payments
    }

    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        let title = t!(
            "identity_verification_review_started.title",
            locale = locale.as_ref()
        )
        .to_string();
        let body = t!(
            "identity_verification_review_started.body",
            locale = locale.as_ref()
        )
        .to_string();
        LocalizedPushMessage { title, body }
    }

    fn to_localized_email(
        &self,
        locale: GaloyLocale,
    ) -> Result<Option<LocalizedEmail>, NotificationEventError> {
        let email_formatter = EmailFormatter::init()?;

        let title = t!(
            "identity_verification_review_started.title",
            locale = locale.as_ref()
        )
        .to_string();
        let body = t!(
            "identity_verification_review_started.body",
            locale = locale.as_ref()
        )
        .to_string();

        let body = email_formatter.generic_email_template(&title, &body)?;

        Ok(Some(LocalizedEmail {
            subject: title,
            body,
        }))
    }

    fn should_send_email(&self) -> bool {
        true
    }
}
