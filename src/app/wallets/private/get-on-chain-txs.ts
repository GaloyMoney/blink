import { BTC_NETWORK, ONCHAIN_MIN_CONFIRMATIONS, SECS_PER_10_MINS } from "@config"

import { OnChainError, TxDecoder, uniqueAddressesForTxn } from "@domain/bitcoin/onchain"
import { CacheKeys } from "@domain/cache"

import { RedisCacheService } from "@services/cache"
import { OnChainService } from "@services/lnd/onchain-service"
import { baseLogger } from "@services/logger"

// we are getting both the transactions in the mempool and the transaction that
// have been mined by not yet credited because they haven't reached enough confirmations
export const getOnChainTxs = async (): Promise<
  IncomingOnChainTransaction[] | OnChainServiceError
> =>
  RedisCacheService().getOrSet({
    key: CacheKeys.LastOnChainTransactions,
    ttlSecs: SECS_PER_10_MINS,
    getForCaching: async () => {
      const onChain = OnChainService(TxDecoder(BTC_NETWORK))
      if (onChain instanceof OnChainError) {
        baseLogger.warn({ onChain }, "impossible to create OnChainService")
        return onChain
      }
      return onChain.listIncomingTransactions(ONCHAIN_MIN_CONFIRMATIONS)
    },
    inflate: async (txnsPromise: Promise<IncomingOnChainTransactionFromCache[]>) => {
      const txns = await txnsPromise
      if (txns instanceof Error) return txns

      return txns.map(inflateIncomingOnChainTxFromCache)
    },
  })

const inflateIncomingOnChainTxFromCache = (
  txn: IncomingOnChainTransactionFromCache | IncomingOnChainTransaction,
): IncomingOnChainTransaction => ({
  ...txn,
  createdAt: new Date(txn.createdAt),
  uniqueAddresses: () => uniqueAddressesForTxn(txn.rawTx),
})
