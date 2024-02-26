use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::{DeepLink, NotificationEvent};
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
        let txn_type = match self.transaction_type {
            TransactionType::IntraLedgerPayment => "transaction.intra_ledger_payment",
            TransactionType::IntraLedgerReceipt => "transaction.intra_ledger_receipt",
            TransactionType::OnchainPayment => "transaction.onchain_payment",
            TransactionType::OnchainReceipt => "transaction.onchain_receipt",
            TransactionType::OnchainReceiptPending => "transaction.onchain_receipt_pending",
            TransactionType::LightningPayment => "transaction.lightning_payment",
            TransactionType::LightningReceipt => "transaction.lightning_receipt",
        };

        let title_name = format!("{}.title", txn_type);
        let body_name = format!("{}.body", txn_type);

        let formatted_currency_amount = format!(
            "{} {}",
            self.settlement_amount.minor_units,
            self.settlement_amount.currency.to_string()
        );

        let title = t!(
            title_name.as_str(),
            walletCurrency = self.settlement_amount.currency.to_string(),
            locale = locale.as_ref(),
        )
        .to_string();
        let body = t!(
            body_name.as_str(),
            formattedCurrencyAmount = formatted_currency_amount.as_str(),
            locale = locale.as_ref(),
        )
        .to_string();
        LocalizedPushMessage { title, body }
    }

    fn to_localized_email(&self, _locale: GaloyLocale) -> Option<LocalizedEmail> {
        None
    }

    fn should_send_email(&self) -> bool {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn payments_push_message() {
        let event = TransactionInfo {
            user_id: GaloyUserId::from("user_id".to_string()),
            transaction_type: TransactionType::IntraLedgerPayment,

            settlement_amount: TransactionAmount {
                minor_units: 100,
                currency: Currency::Iso(rusty_money::iso::USD),
            },
            display_amount: None,
        };
        let localized_message = event.to_localized_push_msg(GaloyLocale::from("en".to_string()));
        assert_eq!(localized_message.title, "USD Transaction");
        assert_eq!(localized_message.body, "Sent payment of 100 USD");
    }
}
