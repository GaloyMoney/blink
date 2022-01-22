import { BTC_NETWORK } from "@config"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { OnChainService } from "@services/lnd/onchain-service"
import { WalletOnChainAddressesRepository, WalletsRepository } from "@services/mongoose"
import { consumeLimiter } from "@services/rate-limit"

export const createOnChainAddress = async (
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

const checkOnChainAddressAccountIdLimits = async (
  accountId: AccountId,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.onChainAddressCreate,
    keyToConsume: accountId,
  })
