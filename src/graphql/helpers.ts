import { WalletCurrency } from "@domain/shared"

import { WalletsRepository } from "@services/mongoose"
import { baseLogger } from "@services/logger"

import { mapAndParseErrorForGqlResponse, mapError } from "./error-map"
import { ValidationInternalError } from "./error"

const QueryDoesNotMatchWalletCurrencyErrorMessage = "QueryDoesNotMatchWalletCurrencyError"
const QueryDoesNotMatchWalletCurrencyError = new ValidationInternalError({
  message: QueryDoesNotMatchWalletCurrencyErrorMessage,
  logger: baseLogger,
})

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
  errors: [{ message: QueryDoesNotMatchWalletCurrencyErrorMessage }],
}

export const validateIsBtcWalletForQuery = async (
  walletId: WalletId,
): Promise<true | CustomApolloError> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return mapError(wallet)

  if (wallet.currency !== WalletCurrency.Btc) {
    return QueryDoesNotMatchWalletCurrencyError
  }
  return true
}

export const validateIsUsdWalletForQuery = async (
  walletId: WalletId,
): Promise<true | CustomApolloError> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return mapError(wallet)

  if (wallet.currency !== WalletCurrency.Usd) {
    return QueryDoesNotMatchWalletCurrencyError
  }
  return true
}
