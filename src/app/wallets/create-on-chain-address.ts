import { BTC_NETWORK } from "@config"

import { OnChainAddressNotFoundError, TxDecoder } from "@domain/bitcoin/onchain"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { WalletCurrency } from "@domain/shared"

import { NewOnChainService } from "@services/bria"
import { WalletOnChainAddressesRepository, WalletsRepository } from "@services/mongoose"
import { OnChainService } from "@services/lnd/onchain-service"
import { consumeLimiter } from "@services/rate-limit"

import { validateIsBtcWallet, validateIsUsdWallet } from "./validate"

export const lndCreateOnChainAddress = async (
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

const createOnChainAddress = async ({
  walletId,
  requestId,
}: {
  walletId: WalletId
  requestId?: OnChainAddressRequestId
}) => {
  const onChain = NewOnChainService()

  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet

  let onChainAddress: OnChainAddressIdentifier | undefined = undefined
  if (requestId) {
    const foundAddress = await onChain.findAddressByRequestId(requestId)
    if (
      foundAddress instanceof Error &&
      !(foundAddress instanceof OnChainAddressNotFoundError)
    ) {
      return foundAddress
    }

    if (!(foundAddress instanceof OnChainAddressNotFoundError)) {
      onChainAddress = foundAddress
    }
  }

  if (onChainAddress === undefined) {
    const limitOk = await checkOnChainAddressAccountIdLimits(wallet.accountId)
    if (limitOk instanceof Error) return limitOk

    const newOnChainAddress = await onChain.createOnChainAddress({ walletId, requestId })
    if (newOnChainAddress instanceof Error) return newOnChainAddress
    onChainAddress = newOnChainAddress
  }

  const onChainAddressesRepo = WalletOnChainAddressesRepository()

  const addressRecorded = await onChainAddressesRepo.isRecorded({
    walletId,
    onChainAddress,
  })
  if (addressRecorded instanceof Error) return addressRecorded

  if (!addressRecorded) {
    const savedOnChainAddress = await onChainAddressesRepo.persistNew({
      walletId,
      onChainAddress,
    })
    if (savedOnChainAddress instanceof Error) return savedOnChainAddress
  }

  return onChainAddress.address
}

export const createOnChainAddressByWallet = async ({
  wallet,
  requestId,
}: {
  wallet: WalletDescriptor<WalletCurrency>
  requestId?: OnChainAddressRequestId
}): Promise<OnChainAddress | ApplicationError> => {
  if (wallet.currency === WalletCurrency.Btc) {
    return createOnChainAddressForBtcWallet({ walletId: wallet.id, requestId })
  }

  return createOnChainAddressForUsdWallet({ walletId: wallet.id, requestId })
}

export const createOnChainAddressForBtcWallet = async ({
  walletId,
  requestId,
}: {
  walletId: WalletId
  requestId?: OnChainAddressRequestId
}): Promise<OnChainAddress | ApplicationError> => {
  const validated = await validateIsBtcWallet(walletId)
  return validated instanceof Error
    ? validated
    : createOnChainAddress({ walletId, requestId })
}

export const createOnChainAddressForUsdWallet = async ({
  walletId,
  requestId,
}: {
  walletId: WalletId
  requestId?: OnChainAddressRequestId
}): Promise<OnChainAddress | ApplicationError> => {
  const validated = await validateIsUsdWallet(walletId)
  return validated instanceof Error
    ? validated
    : createOnChainAddress({ walletId, requestId })
}

const checkOnChainAddressAccountIdLimits = async (
  accountId: AccountId,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.onChainAddressCreate,
    keyToConsume: accountId,
  })
