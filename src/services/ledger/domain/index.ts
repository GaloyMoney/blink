export * from "./entry-builder"
export * from "./accounts"

export const liabilitiesMainAccount = "Liabilities"
export const toLedgerAccountId = (walletId: WalletId): LedgerAccountId =>
  `${liabilitiesMainAccount}:${walletId}` as LedgerAccountId
