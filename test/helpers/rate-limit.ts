import { RateLimitConfig } from "@domain/rate-limit"
import { resetLimiter } from "@services/rate-limit"

export const resetSelfWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({ rateLimitConfig: RateLimitConfig.invoiceCreate, keyToConsume: walletId })

export const resetRecipientWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreateForRecipient,
    keyToConsume: walletId,
  })

export const resetOnChainAddressWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.onChainAddressCreate,
    keyToConsume: walletId,
  })
