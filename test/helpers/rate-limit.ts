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
  const limiterInvoiceCreateAttemptLimits = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.invoiceCreate,
    limitOptions: invoiceCreateAttemptLimits,
  })
  return limiterInvoiceCreateAttemptLimits.reset(walletId)
}

export const resetRecipientWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> => {
  const invoiceCreateForRecipientAttemptLimits =
    getInvoiceCreateForRecipientAttemptLimits()
  const limiterInvoiceCreateForRecipientAttemptLimits = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.invoiceCreateForRecipient,
    limitOptions: invoiceCreateForRecipientAttemptLimits,
  })
  return limiterInvoiceCreateForRecipientAttemptLimits.reset(walletId)
}

export const resetOnChainAddressWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> => {
  const onChainAddressCreateAttempt = getOnChainAddressCreateAttemptLimits()
  const limiterOnChainAddressCreateAttempt = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.onChainAddressCreate,
    limitOptions: onChainAddressCreateAttempt,
  })
  return limiterOnChainAddressCreateAttempt.reset(walletId)
}
