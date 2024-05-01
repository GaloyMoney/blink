use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::NotificationEvent;
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

impl std::fmt::Display for TransactionAmount {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.currency.format_minor_units(f, self.minor_units, false)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransactionOccurred {
    pub transaction_type: TransactionType,
    pub settlement_amount: TransactionAmount,
    pub display_amount: Option<TransactionAmount>,
}

impl NotificationEvent for TransactionOccurred {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Payments
    }

    fn should_send_push(&self) -> bool {
        true
    }

    fn to_localized_push_msg(&self, locale: &GaloyLocale) -> LocalizedPushMessage {
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

        let title = t!(
            title_key.as_str(),
            locale = locale.as_ref(),
            walletCurrency = self.settlement_amount.currency,
        )
        .to_string();

        let body = match &self.display_amount {
            Some(display_amount) if display_amount.currency != self.settlement_amount.currency => {
                t!(
                    body_display_currency_key.as_str(),
                    locale = locale.as_ref(),
                    formattedCurrencyAmount = self.settlement_amount.to_string(),
                    displayCurrencyAmount = display_amount.to_string(),
                )
                .to_string()
            }
            _ => t!(
                body_key.as_str(),
                locale = locale.as_ref(),
                formattedCurrencyAmount = self.settlement_amount.to_string(),
            )
            .to_string(),
        };

        LocalizedPushMessage { title, body }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn intra_ledger_payment_push_message() {
        let event = TransactionOccurred {
            transaction_type: TransactionType::IntraLedgerPayment,
            settlement_amount: TransactionAmount {
                minor_units: 100,
                currency: Currency::Iso(rusty_money::iso::USD),
            },
            display_amount: None,
        };
        let localized_message = event.to_localized_push_msg(&GaloyLocale::from("en".to_string()));
        assert_eq!(localized_message.title, "USD Transaction");
        assert_eq!(localized_message.body, "Sent payment of $1.00");
    }

    #[test]
    fn intra_ledger_payment_receipt_message() {
        let event = TransactionOccurred {
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
        let localized_message = event.to_localized_push_msg(&GaloyLocale::from("en".to_string()));
        assert_eq!(localized_message.title, "BTC Transaction");
        assert_eq!(localized_message.body, "+$0.04 | 1 sats");
    }
}
