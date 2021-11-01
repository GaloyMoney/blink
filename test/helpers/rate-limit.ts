import {
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
  getOnChainAddressCreateAttemptLimits,
} from "@config/app"
import { RateLimitPrefix } from "@domain/rate-limit"
import { RedisRateLimitService } from "@services/rate-limit"

export const resetSelfWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> => {
  const invoiceCreateAttemptLimits = getInvoiceCreateAttemptLimits()
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.invoiceCreate,
    limitOptions: invoiceCreateAttemptLimits,
  })
  return limiter.reset(walletId)
}

export const resetRecipientWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> => {
  const invoiceCreateForRecipientAttemptLimits =
    getInvoiceCreateForRecipientAttemptLimits()
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.invoiceCreateForRecipient,
    limitOptions: invoiceCreateForRecipientAttemptLimits,
  })
  return limiter.reset(walletId)
}

export const resetOnChainAddressWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> => {
  const onChainAddressCreateAttempt = getOnChainAddressCreateAttemptLimits()
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.onChainAddressCreate,
    limitOptions: onChainAddressCreateAttempt,
  })
  return limiter.reset(walletId)
}
