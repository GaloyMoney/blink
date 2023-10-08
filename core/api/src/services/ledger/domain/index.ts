export * from "./entry-builder"
export * from "./accounts"

export const liabilitiesMainAccount = "Liabilities"
export const toLedgerAccountUuid = (walletId: WalletId): LedgerAccountUuid =>
  `${liabilitiesMainAccount}:${walletId}` as LedgerAccountUuid

export const toLedgerAccountDescriptor = <T extends WalletCurrency>(
  walletDescriptor: WalletDescriptor<T>,
): LedgerAccountDescriptor<T> => {
  return {
    id: toLedgerAccountUuid(walletDescriptor.id),
    currency: walletDescriptor.currency,
  } as LedgerAccountDescriptor<T>
}
