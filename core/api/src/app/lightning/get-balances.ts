import { SECS_PER_MIN } from "@/config"

import { toSats } from "@/domain/bitcoin"
import { CacheKeys } from "@/domain/cache"
import { ErrorLevel } from "@/domain/shared"

import { LndService } from "@/services/lnd"
import { RedisCacheService } from "@/services/cache"
import { recordExceptionInCurrentSpan } from "@/services/tracing"

const cache = RedisCacheService()

export const getTotalBalance = async (): Promise<Satoshis | ApplicationError> => {
  const balances = await Promise.all([
    getOnChainBalance(),
    getOffChainBalance(),
    getOpeningChannelBalance(),
    getClosingChannelBalance(),
  ])

  return sumBalances(balances)
}

export const getInboundBalance = async (): Promise<Satoshis | ApplicationError> => {
  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService

  const inboundOutboundBalance = await Promise.all(
    offChainService
      .listActivePubkeys()
      .map((pubkey) => offChainService.getInboundOutboundBalance(pubkey)),
  )

  const inbound = inboundOutboundBalance.map((balance) => {
    if (balance instanceof Error) return toSats(0)
    return balance.inbound
  })

  return sumBalances(inbound)
}

export const getOutboundBalance = async (): Promise<Satoshis | ApplicationError> => {
  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService

  const inboundOutboundBalance = await Promise.all(
    offChainService
      .listActivePubkeys()
      .map((pubkey) => offChainService.getInboundOutboundBalance(pubkey)),
  )

  const outbound = inboundOutboundBalance.map((balance) => {
    if (balance instanceof Error) return toSats(0)
    return balance.outbound
  })

  return sumBalances(outbound)
}

export const getOffChainBalance = async (): Promise<Satoshis | ApplicationError> =>
  cache.getOrSet({
    key: CacheKeys.OffChainBalance,
    ttlSecs: SECS_PER_MIN,
    getForCaching: async () => {
      const offChainService = LndService()
      if (offChainService instanceof Error) return offChainService

      const balances = await Promise.all(
        offChainService
          .listActivePubkeys()
          .map((pubkey) => offChainService.getBalance(pubkey)),
      )

      return sumBalances(balances)
    },
  })

export const getOpeningChannelBalance = async (): Promise<Satoshis | ApplicationError> =>
  cache.getOrSet({
    key: CacheKeys.OpeningChannelBalance,
    ttlSecs: SECS_PER_MIN,
    getForCaching: async () => {
      const offChainService = LndService()
      if (offChainService instanceof Error) return offChainService

      const balances = await Promise.all(
        offChainService
          .listActivePubkeys()
          .map((pubkey) => offChainService.getOpeningChannelsBalance(pubkey)),
      )

      return sumBalances(balances)
    },
  })

export const getClosingChannelBalance = async (): Promise<Satoshis | ApplicationError> =>
  cache.getOrSet({
    key: CacheKeys.ClosingChannelBalance,
    ttlSecs: SECS_PER_MIN,
    getForCaching: async () => {
      const offChainService = LndService()
      if (offChainService instanceof Error) return offChainService

      const balances = await Promise.all(
        offChainService
          .listActivePubkeys()
          .map((pubkey) => offChainService.getClosingChannelsBalance(pubkey)),
      )

      return sumBalances(balances)
    },
  })

export const getOnChainBalance = async (): Promise<Satoshis | ApplicationError> =>
  cache.getOrSet({
    key: CacheKeys.OnChainBalance,
    ttlSecs: SECS_PER_MIN,
    getForCaching: async () => {
      const offChainService = LndService()
      if (offChainService instanceof Error) return offChainService

      const onChainBalances = await Promise.all(
        offChainService
          .listActivePubkeys()
          .map((pubkey) => offChainService.getOnChainBalance(pubkey)),
      )
      const onChain = sumBalances(onChainBalances)

      const onChainPendingBalances = await Promise.all(
        offChainService
          .listActivePubkeys()
          .map((pubkey) => offChainService.getPendingOnChainBalance(pubkey)),
      )
      const onChainPending = sumBalances(onChainPendingBalances)

      return toSats(onChain + onChainPending)
    },
  })

const sumBalances = (balances: (Satoshis | Error)[]): Satoshis => {
  const total = balances.reduce((total, b) => {
    if (b instanceof Error) {
      recordExceptionInCurrentSpan({ error: b, level: ErrorLevel.Critical })
      return total
    }
    return total + b
  }, 0)

  return toSats(total)
}
