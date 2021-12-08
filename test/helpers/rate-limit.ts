import {
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
  getOnChainAddressCreateAttemptLimits,
} from "@config/app"
import { RateLimitPrefix } from "@domain/rate-limit"
import { RedisRateLimitService } from "@services/rate-limit"

const invoiceCreateAttemptLimits = getInvoiceCreateAttemptLimits()
const limiterInvoiceCreateAttemptLimits = RedisRateLimitService({
  keyPrefix: RateLimitPrefix.invoiceCreate,
  limitOptions: invoiceCreateAttemptLimits,
})

export const resetSelfWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> => {
  return limiterInvoiceCreateAttemptLimits.reset(walletId)
}

const invoiceCreateForRecipientAttemptLimits = getInvoiceCreateForRecipientAttemptLimits()
const limiterInvoiceCreateForRecipientAttemptLimits = RedisRateLimitService({
  keyPrefix: RateLimitPrefix.invoiceCreateForRecipient,
  limitOptions: invoiceCreateForRecipientAttemptLimits,
})

export const resetRecipientWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> => {
  return limiterInvoiceCreateForRecipientAttemptLimits.reset(walletId)
}

const onChainAddressCreateAttempt = getOnChainAddressCreateAttemptLimits()
const limiterOnChainAddressCreateAttempt = RedisRateLimitService({
  keyPrefix: RateLimitPrefix.onChainAddressCreate,
  limitOptions: onChainAddressCreateAttempt,
})

export const resetOnChainAddressWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> => {
  return limiterOnChainAddressCreateAttempt.reset(walletId)
}
