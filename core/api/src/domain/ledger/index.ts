import {
  InvalidLedgerTransactionId,
  InvalidLedgerTransactionStateError,
} from "@/domain/errors"
import { WalletCurrency } from "@/domain/shared"
import { safeBigInt } from "@/domain/shared/safe"

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

const ExternalLedgerTransactionType = {
  Invoice: "invoice",
  Payment: "payment",
  LnFeeReimbursement: "fee_reimbursement", // lightning
  OnchainReceipt: "onchain_receipt",
  OnchainPayment: "onchain_payment",
} as const

const InternalLedgerTransactionType = {
  IntraLedger: "on_us",
  LnIntraLedger: "ln_on_us",
  OnchainIntraLedger: "onchain_on_us",
  WalletIdTradeIntraAccount: "self_trade",
  LnTradeIntraAccount: "ln_self_trade",
  OnChainTradeIntraAccount: "onchain_self_trade",
} as const

export const AdminLedgerTransactionType = {
  Fee: "fee",
  ToColdStorage: "to_cold_storage",
  ToHotWallet: "to_hot_wallet",
  Escrow: "escrow",
  // TODO: rename. should be routing_revenue
  RoutingRevenue: "routing_fee", // channel-related
  Reconciliation: "reconciliation",
} as const

export const LedgerTransactionType = {
  ...ExternalLedgerTransactionType,
  ...InternalLedgerTransactionType,
  ...AdminLedgerTransactionType,
} as const

export const isOnChainTransaction = (type: LedgerTransactionType): boolean =>
  type === LedgerTransactionType.OnchainIntraLedger ||
  type === LedgerTransactionType.OnChainTradeIntraAccount ||
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
