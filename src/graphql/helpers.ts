import { WalletsRepository } from "@services/mongoose"
import { WalletCurrency } from "@domain/shared"

import { mapError } from "./error-map"

export const validateIsBtcWalletForMutation = async (
  walletId,
): Promise<true | { errors: [{ message: string }] }> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return { errors: [{ message: mapError(wallet).message }] }

  const MutationDoesNotMatchWalletCurrencyError =
    "MutationDoesNotMatchWalletCurrencyError"
  if (wallet.currency === WalletCurrency.Usd) {
    return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
  }
  return true
}

export const validateIsUsdWalletForMutation = async (
  walletId,
): Promise<true | { errors: [{ message: string }] }> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return { errors: [{ message: mapError(wallet).message }] }

  const MutationDoesNotMatchWalletCurrencyError =
    "MutationDoesNotMatchWalletCurrencyError"
  if (wallet.currency === WalletCurrency.Btc) {
    return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
  }
  return true
}
