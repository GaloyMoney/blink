import { BTC_NETWORK, getOnChainAddressCreateAttemptLimits } from "@config/app"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { RateLimitPrefix } from "@domain/rate-limit"
import {
  OnChainAddressCreateRateLimiterExceededError,
  RateLimiterExceededError,
} from "@domain/rate-limit/errors"
import { OnChainService } from "@services/lnd/onchain-service"
import { WalletOnChainAddressesRepository } from "@services/mongoose"
import { RedisRateLimitService } from "@services/rate-limit"

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

const checkOnChainAddressWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimiterExceededError> => {
  const onChainAddressCreateAttempt = getOnChainAddressCreateAttemptLimits()
  const limiterOnChainAddressCreateAttempt = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.onChainAddressCreate,
    limitOptions: onChainAddressCreateAttempt,
  })
  const limitOk = await limiterOnChainAddressCreateAttempt.consume(walletId)
  if (limitOk instanceof RateLimiterExceededError)
    return new OnChainAddressCreateRateLimiterExceededError()
  return limitOk
}
