import { WalletsRepository } from "@services/mongoose"
import { WalletCurrency } from "@domain/shared"

import { mapAndParseErrorForGqlResponse } from "./error-map"

const QueryDoesNotMatchWalletCurrencyError = "QueryDoesNotMatchWalletCurrencyError"
const MutationDoesNotMatchWalletCurrencyError = "MutationDoesNotMatchWalletCurrencyError"

export const validateIsBtcWalletForMutation = async (
  walletId: WalletId,
): Promise<true | { errors: [{ message: string }] }> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return { errors: [mapAndParseErrorForGqlResponse(wallet)] }

  if (wallet.currency === WalletCurrency.Usd) {
    return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
  }
  return true
}

export const validateIsUsdWalletForMutation = async (
  walletId: WalletId,
): Promise<true | { errors: [{ message: string }] }> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return { errors: [mapAndParseErrorForGqlResponse(wallet)] }

  if (wallet.currency === WalletCurrency.Btc) {
    return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
  }
  return true
}

export const notBtcWalletForQueryError: { errors: [{ message: string }] } = {
  errors: [{ message: QueryDoesNotMatchWalletCurrencyError }],
}
