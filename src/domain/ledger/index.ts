export * from "./errors"

export const liabilitiesMainAccount = "Liabilities"

export const toLiabilitiesAccountId = (walletId: WalletId): LiabilitiesAccountId =>
  `${liabilitiesMainAccount}:${walletId}` as LiabilitiesAccountId

export const LedgerTransactionType = {
  Invoice: "invoice",
  Payment: "payment",
  IntraLedger: "on_us",
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
