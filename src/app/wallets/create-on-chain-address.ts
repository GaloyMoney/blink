import { OnChainService } from "@services/lnd/onchain-service"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { BTC_NETWORK, getOnChainAddressCreateAttemptLimits } from "@config/app"
import { WalletOnChainAddressesRepository, WalletsRepository } from "@services/mongoose"
import { RedisRateLimitService } from "@services/rate-limit"
import { RateLimitPrefix } from "@domain/rate-limit"
import {
  OnChainAddressCreateRateLimiterExceededError,
  RateLimiterExceededError,
} from "@domain/rate-limit/errors"

export const createOnChainAddress = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const limitOk = await checkOnChainAddressWalletIdLimits(walletId)
  if (limitOk instanceof Error) return limitOk

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const onChainAddress = await onChainService.createOnChainAddress()
  if (onChainAddress instanceof Error) return onChainAddress

  const onChainAddressesRepo = WalletOnChainAddressesRepository()
  const savedOnChainAddress = await onChainAddressesRepo.persistNew(
    walletId,
    onChainAddress,
  )
  if (savedOnChainAddress instanceof Error) return savedOnChainAddress

  return savedOnChainAddress.address
}

export const createOnChainAddressByWalletPublicId = async (
  walletPublicId: WalletPublicId,
): Promise<OnChainAddress | ApplicationError> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findByPublicId(walletPublicId)
  if (wallet instanceof Error) return wallet
  return createOnChainAddress(wallet.id)
}

const checkOnChainAddressWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimiterExceededError> => {
  const onChainAddressCreateAttempt = getOnChainAddressCreateAttemptLimits()
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.onChainAddressCreate,
    limitOptions: onChainAddressCreateAttempt,
  })
  const limitOk = await limiter.consume(walletId)
  if (limitOk instanceof RateLimiterExceededError)
    return new OnChainAddressCreateRateLimiterExceededError()
  return limitOk
}
