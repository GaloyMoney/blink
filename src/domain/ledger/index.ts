import {
  InvalidLedgerTransactionId,
  InvalidLedgerTransactionStateError,
} from "@domain/errors"
import { WalletCurrency } from "@domain/shared"
import { safeBigInt } from "@domain/shared/safe"

export * from "./errors"
export * from "./activity-checker"

export const liabilitiesMainAccount = "Liabilities"

export const toLiabilitiesWalletId = (walletId: WalletId): LiabilitiesWalletId =>
  `${liabilitiesMainAccount}:${walletId}` as LiabilitiesWalletId

export const toWalletId = (walletIdPath: LiabilitiesWalletId): WalletId | undefined => {
  const path = walletIdPath.split(":")

  if (
    Array.isArray(path) &&
    path.length === 2 &&
    path[0] === liabilitiesMainAccount &&
    path[1]
  ) {
    return path[1] as WalletId
  }

  return undefined
}

export const LedgerTransactionType = {
  Invoice: "invoice",
  Payment: "payment",
  IntraLedger: "on_us",
  LnIntraLedger: "ln_on_us",
  LnFeeReimbursement: "fee_reimbursement", // lightning
  OnchainReceipt: "onchain_receipt",
  OnchainPayment: "onchain_payment",
  OnchainIntraLedger: "onchain_on_us",

  Fee: "fee",
  Escrow: "escrow",

  // TODO: rename. should be routing_revenue
  RoutingRevenue: "routing_fee", // channel-related
  ToColdStorage: "to_cold_storage",
  ToHotWallet: "to_hot_wallet",
} as const

export const isOnChainTransaction = (type: LedgerTransactionType): boolean =>
  type === LedgerTransactionType.OnchainIntraLedger ||
  type === LedgerTransactionType.OnchainReceipt ||
  type === LedgerTransactionType.OnchainPayment

export const LedgerTransactionIdRegex = /^[0-9a-fA-F]{24}$/i

export const checkedToLedgerTransactionId = (
  ledgerTransactionId: string,
): LedgerTransactionId | ValidationError => {
  if (ledgerTransactionId && ledgerTransactionId.match(LedgerTransactionIdRegex)) {
    return ledgerTransactionId as LedgerTransactionId
  }
  return new InvalidLedgerTransactionId(ledgerTransactionId)
}

export const inputAmountFromLedgerTransaction = (
  txn: LedgerTransaction<WalletCurrency>,
) => {
  const fee = txn.currency === WalletCurrency.Usd ? txn.centsFee : txn.satsFee
  if (fee === undefined) return new InvalidLedgerTransactionStateError()
  return safeBigInt(txn.debit - fee)
}
