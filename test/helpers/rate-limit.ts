import { getInvoiceCreateAttemptLimits } from "@config/app"
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
