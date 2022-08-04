import { BTC_NETWORK, ONCHAIN_MIN_CONFIRMATIONS, SECS_PER_10_MINS } from "@config"

import { CacheKeys } from "@domain/cache"
import { OnChainError, TxDecoder, TxFilter } from "@domain/bitcoin/onchain"

import { baseLogger } from "@services/logger"
import { RedisCacheService } from "@services/cache"
import { OnChainService } from "@services/lnd/onchain-service"
import { IncomingOnChainTxHandler } from "@domain/bitcoin/onchain/incoming-tx-handler"

const redisCache = RedisCacheService()

export const getPendingOnChainBalanceForWallet = async (
  wallets: Wallet[],
): Promise<{ [key: WalletId]: CurrencyBaseAmount } | ApplicationError> => {
  const onChain = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChain instanceof OnChainError) {
    baseLogger.warn({ onChain }, "impossible to create OnChainService")
    return onChain
  }

  // we are getting both the transactions in the mempool and the transaction that
  // have been mined by not yet credited because they haven't reached enough confirmations
  const onChainTxs = await redisCache.getOrSet({
    key: CacheKeys.LastOnChainTransactions,
    ttlSecs: SECS_PER_10_MINS,
    fn: () => onChain.listIncomingTransactions(ONCHAIN_MIN_CONFIRMATIONS),
  })
  if (onChainTxs instanceof Error) {
    baseLogger.warn({ onChainTxs }, "impossible to get listIncomingTransactions")
    return onChainTxs
  }

  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses: wallets.flatMap((wallet) => wallet.onChainAddresses()),
  })

  const pendingIncoming = filter.apply(onChainTxs)

  const balancesByWallet =
    IncomingOnChainTxHandler(pendingIncoming).balanceByWallet(wallets)
  if (balancesByWallet instanceof Error) return balancesByWallet

  const normalizedBalances = {} as { [key: WalletId]: CurrencyBaseAmount }
  for (const key of Object.keys(balancesByWallet)) {
    const walletId = key as WalletId
    const balance = Number(balancesByWallet[walletId]) as CurrencyBaseAmount
    normalizedBalances[walletId] = balance
  }
  return normalizedBalances
}
