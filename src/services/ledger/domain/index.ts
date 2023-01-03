export * from "./entry-builder"
export * from "./accounts"

export const liabilitiesMainAccount = "Liabilities"
export const toLedgerAccountId = (walletId: WalletId): LedgerAccountId =>
  `${liabilitiesMainAccount}:${walletId}` as LedgerAccountId

export const toLedgerAccountDescriptor = <T extends WalletCurrency>(
  walletDescriptor: WalletDescriptor<T>,
): LedgerAccountDescriptor<T> => {
  return {
    id: toLedgerAccountId(walletDescriptor.id),
    currency: walletDescriptor.currency,
  } as LedgerAccountDescriptor<T>
}
