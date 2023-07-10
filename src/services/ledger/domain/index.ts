import { InvalidLedgerAccountId } from "@domain/errors"
import { checkedToWalletId } from "@domain/wallets"

export * from "./entry-builder"
export * from "./accounts"

export const liabilitiesMainAccount = "Liabilities"
export const toLedgerAccountId = (walletId: WalletId): LedgerAccountId =>
  `${liabilitiesMainAccount}:${walletId}` as LedgerAccountId

export const fromLedgerAccountId = (
  ledgerAccountId: LedgerAccountId,
): WalletId | ValidationError => {
  const [liabilitiesAccount, walletId] = ledgerAccountId.split(":")
  if (!(liabilitiesAccount === liabilitiesMainAccount)) {
    return new InvalidLedgerAccountId(`Invalid account prefix: ${liabilitiesAccount}`)
  }

  const checkedWalletId = checkedToWalletId(walletId)
  if (checkedWalletId instanceof Error) {
    return new InvalidLedgerAccountId(`Invalid walletId suffix: ${walletId}`)
  }

  return checkedWalletId
}

export const toLedgerAccountDescriptor = <T extends WalletCurrency>(
  walletDescriptor: WalletDescriptor<T>,
): LedgerAccountDescriptor<T> => {
  return {
    id: toLedgerAccountId(walletDescriptor.id),
    currency: walletDescriptor.currency,
  } as LedgerAccountDescriptor<T>
}
