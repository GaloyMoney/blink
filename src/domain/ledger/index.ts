import { InvalidLedgerTransactionId } from "@domain/errors"

export * from "./errors"

export const liabilitiesMainAccount = "Liabilities"

export const toLiabilitiesAccountId = (walletId: WalletId): LiabilitiesAccountId =>
  `${liabilitiesMainAccount}:${walletId}` as LiabilitiesAccountId

export const LedgerTransactionType = {
  Invoice: "invoice",
  Payment: "payment",
  IntraLedger: "on_us",
  LnIntraLedger: "ln_on_us",
  LnFeeReimbursement: "fee_reimbursement", // lightning
  OnchainReceipt: "onchain_receipt",
  OnchainPayment: "onchain_payment",
  OnchainIntraLedger: "onchain_on_us",
  OnchainDepositFee: "deposit_fee", // onchain
  Fee: "fee",
  Escrow: "escrow",
  RoutingFee: "routing_fee", // channel-related
  ExchangeRebalance: "exchange_rebalance", // send/receive btc from the exchange
  UserRebalance: "user_rebalance", // buy/sell btc in the user wallet
  ToColdStorage: "to_cold_storage",
  ToHotWallet: "to_hot_wallet",
} as const

export const ExtendedLedgerTransactionType = {
  ...LedgerTransactionType,
  LnIntraLedger: "ln_on_us",
} as const

export const toWalletId = (accountId: LiabilitiesAccountId): WalletId | null => {
  const path = accountId.split(":")

  if (
    Array.isArray(path) &&
    path.length === 2 &&
    path[0] === liabilitiesMainAccount &&
    path[1]
  ) {
    return path[1] as WalletId
  }

  return null
}

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
