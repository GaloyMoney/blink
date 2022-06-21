import { BTC_NETWORK, ONCHAIN_MIN_CONFIRMATIONS, SECS_PER_10_MINS } from "@config"

import { getCurrentPrice } from "@app/prices"
import { PartialResult } from "@app/partial-result"

import { CacheKeys } from "@domain/cache"
import { LedgerError } from "@domain/ledger"
import { RepositoryError } from "@domain/errors"
import { WalletTransactionHistory } from "@domain/wallets"
import { OnChainError, TxDecoder, TxFilter } from "@domain/bitcoin/onchain"

import { baseLogger } from "@services/logger"
import { LedgerService } from "@services/ledger"
import { RedisCacheService } from "@services/cache"
import { WalletsRepository } from "@services/mongoose"
import { OnChainService } from "@services/lnd/onchain-service"

const redisCache = RedisCacheService()

// FIXME(nicolas): remove only used in tests
export const getTransactionsForWalletId = async ({
  walletId,
}: {
  walletId: WalletId
}): Promise<PartialResult<WalletTransaction[]>> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof RepositoryError) return PartialResult.err(wallet)
  return getTransactionsForWallets([wallet])
}

export const getTransactionsForWallets = async (
  wallets: Wallet[],
): Promise<PartialResult<WalletTransaction[]>> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getTransactionsByWalletIds(walletIds)
  if (ledgerTransactions instanceof LedgerError)
    return PartialResult.err(ledgerTransactions)

  const confirmedHistory = WalletTransactionHistory.fromLedger(ledgerTransactions)

  const onChain = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChain instanceof OnChainError) {
    baseLogger.warn({ onChain }, "impossible to create OnChainService")
    return PartialResult.partial(confirmedHistory.transactions, onChain)
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
    return PartialResult.partial(confirmedHistory.transactions, onChainTxs)
  }

  const addresses: OnChainAddress[] = []
  const addressesByWalletId: { [walletid: string]: OnChainAddress[] } = {}
  const walletDetailsByWalletId: { [walletid: string]: { currency: WalletCurrency } } = {}

  for (const wallet of wallets) {
    const walletAddresses = wallet.onChainAddresses()
    addressesByWalletId[wallet.id] = walletAddresses
    addresses.push(...walletAddresses)

    walletDetailsByWalletId[wallet.id] = { currency: wallet.currency }
  }

  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses,
  })

  const pendingIncoming = filter.apply(onChainTxs)

  let price = await getCurrentPrice()
  if (price instanceof Error) {
    price = NaN as DisplayCurrencyPerSat
  }

  return PartialResult.ok(
    confirmedHistory.addPendingIncoming({
      pendingIncoming,
      addressesByWalletId,
      walletDetailsByWalletId,
      displayCurrencyPerSat: price,
    }).transactions,
  )
}
