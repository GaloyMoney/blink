import { InvalidWalletId } from "@domain/errors"
import { WalletsRepository } from "@services/mongoose"

export * from "./deposit-fee-calculator"
export { WalletTransactionHistory } from "./tx-history"
export * from "./tx-methods"
export * from "./tx-status"
export * from "./withdrawal-fee-calculator"

export const WalletIdRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const checkedToWalletId = (walletId: string): WalletId | ValidationError => {
  if (!walletId.match(WalletIdRegex)) {
    return new InvalidWalletId(walletId)
  }
  return walletId as WalletId
}

export const WalletType = {
  CheckingBTC: "checkingbtc",
  CheckingUSD: "checkingusd",
} as const

export const listWalletIdsByAccountId = async (
  accountId: AccountId,
): Promise<WalletId[] | RepositoryError> => {
  const wallets = await WalletsRepository().listByAccountId(accountId)
  if (wallets instanceof Error) return wallets
  return wallets.map((wallet) => wallet.id)
}
