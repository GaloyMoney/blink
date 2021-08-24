export const SettlementMethod = {
  IntraLedger: "intraledger",
  OnChain: "onchain",
  Lightning: "lightning",
} as const

export const PaymentInitiationMethod = {
  WalletName: "username",
  OnChain: "onchain",
  Lightning: "lightning",
} as const
