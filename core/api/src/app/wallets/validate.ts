import { WalletCurrency } from "@/domain/shared"
import { MismatchedCurrencyForWalletError } from "@/domain/errors"

import { WalletsRepository } from "@/services/mongoose"

export const validateIsBtcWallet = async (
  walletId: WalletId,
): Promise<true | ApplicationError> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet

  if (wallet.currency === WalletCurrency.Usd) {
    return new MismatchedCurrencyForWalletError()
  }
  return true
}

export const validateIsUsdWallet = async (
  walletId: WalletId,
): Promise<true | ApplicationError> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet

  if (wallet.currency === WalletCurrency.Btc) {
    return new MismatchedCurrencyForWalletError()
  }
  return true
}
