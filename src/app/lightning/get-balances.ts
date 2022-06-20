import { BTC_NETWORK, SECS_PER_MIN } from "@config"

import { toSats } from "@domain/bitcoin"
import { CacheKeys } from "@domain/cache"
import { ErrorLevel } from "@domain/shared"
import { TxDecoder } from "@domain/bitcoin/onchain"

import { LndService } from "@services/lnd"
import { LocalCacheService } from "@services/cache"
import { OnChainService } from "@services/lnd/onchain-service"
import { recordExceptionInCurrentSpan } from "@services/tracing"

const cache = LocalCacheService()

export const getTotalBalance = async (): Promise<Satoshis | ApplicationError> => {
  const balances = await Promise.all([
    getOnChainBalance(),
    getOffChainBalance(),
    getOpeningChannelBalance(),
    getClosingChannelBalance(),
  ])

  const total = balances.reduce((total, b) => {
    if (b instanceof Error) {
      recordExceptionInCurrentSpan({ error: b, level: ErrorLevel.Critical })
      return total
    }
    return total + b
  }, 0)

  return toSats(total)
}

export const getOffChainBalance = async (): Promise<Satoshis | ApplicationError> =>
  cache.getOrSet({
    key: CacheKeys.OffChainBalance,
    ttlSecs: SECS_PER_MIN,
    fn: async () => {
      const offChainService = LndService()
      if (offChainService instanceof Error) return offChainService

      return offChainService.getBalance()
    },
  })

export const getOpeningChannelBalance = async (): Promise<Satoshis | ApplicationError> =>
  cache.getOrSet({
    key: CacheKeys.OpeningChannelBalance,
    ttlSecs: SECS_PER_MIN,
    fn: async () => {
      const offChainService = LndService()
      if (offChainService instanceof Error) return offChainService

      return offChainService.getOpeningChannelsBalance()
    },
  })

export const getClosingChannelBalance = async (): Promise<Satoshis | ApplicationError> =>
  cache.getOrSet({
    key: CacheKeys.ClosingChannelBalance,
    ttlSecs: SECS_PER_MIN,
    fn: async () => {
      const offChainService = LndService()
      if (offChainService instanceof Error) return offChainService

      return offChainService.getClosingChannelsBalance()
    },
  })

export const getOnChainBalance = async (): Promise<Satoshis | ApplicationError> =>
  cache.getOrSet({
    key: CacheKeys.OnChainBalance,
    ttlSecs: SECS_PER_MIN,
    fn: async () => {
      const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
      if (onChainService instanceof Error) return onChainService

      const onChain = await onChainService.getBalance()
      if (onChain instanceof Error) return onChain

      const onChainPending = await onChainService.getPendingBalance()
      if (onChainPending instanceof Error) return onChainPending

      return toSats(onChain + onChainPending)
    },
  })
