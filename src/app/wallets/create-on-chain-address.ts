import { BTC_NETWORK } from "@config"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { WalletCurrency } from "@domain/shared"
import { OnChainService } from "@services/lnd/onchain-service"
import { WalletOnChainAddressesRepository, WalletsRepository } from "@services/mongoose"
import { consumeLimiter } from "@services/rate-limit"

import { validateIsBtcWallet, validateIsUsdWallet } from "./validate"

const createOnChainAddress = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet

  const limitOk = await checkOnChainAddressAccountIdLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const onChainAddress = await onChainService.createOnChainAddress()
  if (onChainAddress instanceof Error) return onChainAddress

  const onChainAddressesRepo = WalletOnChainAddressesRepository()
  const savedOnChainAddress = await onChainAddressesRepo.persistNew({
    walletId,
    onChainAddress,
  })
  if (savedOnChainAddress instanceof Error) return savedOnChainAddress

  return savedOnChainAddress.address
}

export const createOnChainAddressByWallet = async (
  wallet: Wallet,
): Promise<OnChainAddress | ApplicationError> => {
  if (wallet.currency === WalletCurrency.Btc) {
    return createOnChainAddressForBtcWallet(wallet.id)
  }

  return createOnChainAddressForUsdWallet(wallet.id)
}

export const createOnChainAddressForBtcWallet = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const validated = await validateIsBtcWallet(walletId)
  return validated instanceof Error ? validated : createOnChainAddress(walletId)
}

export const createOnChainAddressForUsdWallet = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const validated = await validateIsUsdWallet(walletId)
  return validated instanceof Error ? validated : createOnChainAddress(walletId)
}

const checkOnChainAddressAccountIdLimits = async (
  accountId: AccountId,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.onChainAddressCreate,
    keyToConsume: accountId,
  })
