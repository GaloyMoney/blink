import { NotificationType } from "@/domain/notifications"
import { WalletCurrency } from "@/domain/shared"
import { UsdDisplayCurrency } from "@/domain/fiat"

const usdDisplayPaymentAmount = {
  amountInMinor: 500n,
  currency: UsdDisplayCurrency,
  displayInMajor: "5.00",
}

const neUsdDisplayPaymentAmount = {
  amountInMinor: -500n,
  currency: UsdDisplayCurrency,
  displayInMajor: "-5.00",
}

const crcDisplayPaymentAmount = {
  amountInMinor: 350050n,
  currency: "CRC" as DisplayCurrency,
  displayInMajor: "3500.50",
}

const neCrcDisplayPaymentAmount = {
  amountInMinor: -350050n,
  currency: "CRC" as DisplayCurrency,
  displayInMajor: "-3500.50",
}

export const btcTransactions = [
  {
    type: NotificationType.IntraLedgerReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    body: "+1,000 sats",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.IntraLedgerPayment,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    body: "Sent payment of 1,000 sats",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.OnchainReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    body: "+1,000 sats",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.OnchainReceiptPending,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    body: "pending +1,000 sats",
    title: "BTC Transaction | Pending",
  },
  {
    type: NotificationType.OnchainPayment,
    paymentAmount: { amount: -1000n, currency: WalletCurrency.Btc },
    body: "Sent onchain payment of -1,000 sats confirmed",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.LigtningReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    body: "+1,000 sats",
    title: "BTC Transaction",
  },
]

export const btcTransactionsWithDisplayCurrency = [
  {
    type: NotificationType.IntraLedgerReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "+$5 | 1,000 sats",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.IntraLedgerPayment,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "Sent payment of $5 | 1,000 sats",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.OnchainReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "+$5 | 1,000 sats",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.OnchainReceiptPending,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "pending +$5 | 1,000 sats",
    title: "BTC Transaction | Pending",
  },
  {
    type: NotificationType.OnchainPayment,
    paymentAmount: { amount: -1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: neUsdDisplayPaymentAmount,
    body: "Sent onchain payment of -$5 | -1,000 sats confirmed",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.LigtningReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "+$5 | 1,000 sats",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.IntraLedgerReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "+₡3,500.50 | 1,000 sats",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.IntraLedgerPayment,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "Sent payment of ₡3,500.50 | 1,000 sats",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.OnchainReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "+₡3,500.50 | 1,000 sats",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.OnchainReceiptPending,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "pending +₡3,500.50 | 1,000 sats",
    title: "BTC Transaction | Pending",
  },
  {
    type: NotificationType.OnchainPayment,
    paymentAmount: { amount: -1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: neCrcDisplayPaymentAmount,
    body: "Sent onchain payment of -₡3,500.50 | -1,000 sats confirmed",
    title: "BTC Transaction",
  },
  {
    type: NotificationType.LigtningReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "+₡3,500.50 | 1,000 sats",
    title: "BTC Transaction",
  },
]

export const usdTransactions = [
  {
    type: NotificationType.IntraLedgerReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Usd },
    body: "+$10",
    title: "USD Transaction",
  },
  {
    type: NotificationType.IntraLedgerPayment,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Usd },
    body: "Sent payment of $10",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Usd },
    body: "+$10",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceiptPending,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Usd },
    body: "pending +$10",
    title: "USD Transaction | Pending",
  },
  {
    type: NotificationType.OnchainPayment,
    paymentAmount: { amount: -1000n, currency: WalletCurrency.Usd },
    body: "Sent onchain payment of -$10 confirmed",
    title: "USD Transaction",
  },
  {
    type: NotificationType.LigtningReceipt,
    paymentAmount: { amount: 1000n, currency: WalletCurrency.Usd },
    body: "+$10",
    title: "USD Transaction",
  },
  {
    type: NotificationType.IntraLedgerReceipt,
    paymentAmount: { amount: 1030n, currency: WalletCurrency.Usd },
    body: "+$10.30",
    title: "USD Transaction",
  },
  {
    type: NotificationType.IntraLedgerPayment,
    paymentAmount: { amount: 1030n, currency: WalletCurrency.Usd },
    body: "Sent payment of $10.30",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceipt,
    paymentAmount: { amount: 1030n, currency: WalletCurrency.Usd },
    body: "+$10.30",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceiptPending,
    paymentAmount: { amount: 1030n, currency: WalletCurrency.Usd },
    body: "pending +$10.30",
    title: "USD Transaction | Pending",
  },
  {
    type: NotificationType.OnchainPayment,
    paymentAmount: { amount: -1030n, currency: WalletCurrency.Usd },
    body: "Sent onchain payment of -$10.30 confirmed",
    title: "USD Transaction",
  },
  {
    type: NotificationType.LigtningReceipt,
    paymentAmount: { amount: 1030n, currency: WalletCurrency.Usd },
    body: "+$10.30",
    title: "USD Transaction",
  },
]

export const usdTransactionsWithDisplayCurrency = [
  {
    type: NotificationType.IntraLedgerReceipt,
    paymentAmount: { amount: 500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "+$5",
    title: "USD Transaction",
  },
  {
    type: NotificationType.IntraLedgerPayment,
    paymentAmount: { amount: 500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "Sent payment of $5",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceipt,
    paymentAmount: { amount: 500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "+$5",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceiptPending,
    paymentAmount: { amount: 500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "pending +$5",
    title: "USD Transaction | Pending",
  },
  {
    type: NotificationType.OnchainPayment,
    paymentAmount: { amount: -500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: neUsdDisplayPaymentAmount,
    body: "Sent onchain payment of -$5 confirmed",
    title: "USD Transaction",
  },
  {
    type: NotificationType.LigtningReceipt,
    paymentAmount: { amount: 500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "+$5",
    title: "USD Transaction",
  },
  {
    type: NotificationType.IntraLedgerReceipt,
    paymentAmount: { amount: 500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "+₡3,500.50 | $5",
    title: "USD Transaction",
  },
  {
    type: NotificationType.IntraLedgerPayment,
    paymentAmount: { amount: 500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "Sent payment of ₡3,500.50 | $5",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceipt,
    paymentAmount: { amount: 500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "+₡3,500.50 | $5",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceiptPending,
    paymentAmount: { amount: 500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "pending +₡3,500.50 | $5",
    title: "USD Transaction | Pending",
  },
  {
    type: NotificationType.OnchainPayment,
    paymentAmount: { amount: -500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: neCrcDisplayPaymentAmount,
    body: "Sent onchain payment of -₡3,500.50 | -$5 confirmed",
    title: "USD Transaction",
  },
  {
    type: NotificationType.LigtningReceipt,
    paymentAmount: { amount: 500n, currency: WalletCurrency.Usd },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "+₡3,500.50 | $5",
    title: "USD Transaction",
  },
  {
    type: NotificationType.IntraLedgerReceipt,
    paymentAmount: { amount: 507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "+$5.07",
    title: "USD Transaction",
  },
  {
    type: NotificationType.IntraLedgerPayment,
    paymentAmount: { amount: 507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "Sent payment of $5.07",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceipt,
    paymentAmount: { amount: 507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "+$5.07",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceiptPending,
    paymentAmount: { amount: 507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "pending +$5.07",
    title: "USD Transaction | Pending",
  },
  {
    type: NotificationType.OnchainPayment,
    paymentAmount: { amount: -507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: neUsdDisplayPaymentAmount,
    body: "Sent onchain payment of -$5.07 confirmed",
    title: "USD Transaction",
  },
  {
    type: NotificationType.LigtningReceipt,
    paymentAmount: { amount: 507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: usdDisplayPaymentAmount,
    body: "+$5.07",
    title: "USD Transaction",
  },
  {
    type: NotificationType.IntraLedgerReceipt,
    paymentAmount: { amount: 507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "+₡3,500.50 | $5.07",
    title: "USD Transaction",
  },
  {
    type: NotificationType.IntraLedgerPayment,
    paymentAmount: { amount: 507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "Sent payment of ₡3,500.50 | $5.07",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceipt,
    paymentAmount: { amount: 507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "+₡3,500.50 | $5.07",
    title: "USD Transaction",
  },
  {
    type: NotificationType.OnchainReceiptPending,
    paymentAmount: { amount: 507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "pending +₡3,500.50 | $5.07",
    title: "USD Transaction | Pending",
  },
  {
    type: NotificationType.OnchainPayment,
    paymentAmount: { amount: -507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: neCrcDisplayPaymentAmount,
    body: "Sent onchain payment of -₡3,500.50 | -$5.07 confirmed",
    title: "USD Transaction",
  },
  {
    type: NotificationType.LigtningReceipt,
    paymentAmount: { amount: 507n, currency: WalletCurrency.Usd },
    displayPaymentAmount: crcDisplayPaymentAmount,
    body: "+₡3,500.50 | $5.07",
    title: "USD Transaction",
  },
]
