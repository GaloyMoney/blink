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

        let title_key = format!("{}.title", txn_type);
        let body_key = format!("{}.body", txn_type);
        let body_display_currency_key = format!("{}.body_display_currency", txn_type);

        let formatted_currency_amount = format!(
            "{} {}",
            self.settlement_amount.minor_units, self.settlement_amount.currency
        );

        let title = t!(
            title_key.as_str(),
            walletCurrency = self.settlement_amount.currency,
            locale = locale.as_ref(),
        )
        .to_string();

        let body = if let Some(disp_amount) = &self.display_amount {
            let formatted_display_currency_amount = rusty_money::Money::from_minor(
                disp_amount.minor_units as i64,
                rusty_money::iso::find(disp_amount.currency.code()).expect("invalid currency code"),
            );
            t!(
                body_display_currency_key.as_str(),
                formattedCurrencyAmount = formatted_currency_amount,
                displayCurrencyAmount = formatted_display_currency_amount,
                locale = locale.as_ref(),
            )
            .to_string()
        } else {
            t!(
                body_key.as_str(),
                formattedCurrencyAmount = formatted_currency_amount,
                locale = locale.as_ref(),
            )
            .to_string()
        };
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
    fn intra_ledger_payment_push_message() {
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
        assert_eq!(localized_message.body, "Sent payment of 1 USD");
    }

    #[test]
    fn intra_ledger_payment_receipt_message() {
        let event = TransactionInfo {
            user_id: GaloyUserId::from("user_id".to_string()),
            transaction_type: TransactionType::IntraLedgerReceipt,
            settlement_amount: TransactionAmount {
                minor_units: 1,
                currency: Currency::Crypto(rusty_money::crypto::BTC),
            },
            display_amount: Some(TransactionAmount {
                minor_units: 4,
                currency: Currency::Iso(rusty_money::iso::USD),
            }),
        };
        let localized_message = event.to_localized_push_msg(GaloyLocale::from("en".to_string()));
        assert_eq!(localized_message.title, "BTC Transaction");
        assert_eq!(localized_message.body, "+$0.04 | 1 BTC"); // fix this assertion
    }
}
