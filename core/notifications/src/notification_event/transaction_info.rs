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
pub struct TransactionAmount {
    pub minor_units: u64,
    pub currency: Currency,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransactionInfo {
    pub user_id: GaloyUserId,
    pub transaction_type: TransactionType,
    pub settlement_amount: TransactionAmount,
    pub display_amount: Option<TransactionAmount>,
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
        unimplemented!()
    }

    fn to_localized_email(
        &self,
        locale: GaloyLocale,
    ) -> Result<Option<LocalizedEmail>, NotificationEventError> {
        Ok(None)
    }

    fn should_send_email(&self) -> bool {
        false
    }
}
