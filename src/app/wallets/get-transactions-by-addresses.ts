import { BTC_NETWORK, ONCHAIN_MIN_CONFIRMATIONS, SECS_PER_10_MINS } from "@config"

import { getCurrentPrice } from "@app/prices"
import { PartialResult } from "@app/partial-result"

import { CacheKeys } from "@domain/cache"
import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { OnChainError, TxDecoder, TxFilter } from "@domain/bitcoin/onchain"

import { baseLogger } from "@services/logger"
import { LedgerService } from "@services/ledger"
import { RedisCacheService } from "@services/cache"
import { OnChainService } from "@services/lnd/onchain-service"

const redisCache = RedisCacheService()

export const getTransactionsForWalletsByAddresses = async ({
  wallets,
  addresses,
}: {
  wallets: Wallet[]
  addresses: OnChainAddress[]
}): Promise<PartialResult<WalletTransaction[]>> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  const ledger = LedgerService()
  const ledgerTransactionsForWallets = await ledger.getTransactionsByWalletIds(walletIds)
  if (ledgerTransactionsForWallets instanceof LedgerError)
    return PartialResult.err(ledgerTransactionsForWallets)
  const ledgerTransactions = ledgerTransactionsForWallets.filter(
    (tx) => tx.address && addresses.includes(tx.address),
  )

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
  redisCache.set({
    key: CacheKeys.LastOnChainTransactions,
    value: onChainTxs,
    ttlSecs: SECS_PER_10_MINS,
  })

  const allAddresses: OnChainAddress[] = []
  const addressesByWalletId: { [walletid: string]: OnChainAddress[] } = {}
  const walletDetailsByWalletId: { [walletid: string]: { currency: WalletCurrency } } = {}

  for (const wallet of wallets) {
    const walletAddresses = wallet.onChainAddresses()
    addressesByWalletId[wallet.id] = walletAddresses
    allAddresses.push(...walletAddresses)

    walletDetailsByWalletId[wallet.id] = { currency: wallet.currency }
  }
  const addressesForWallets = addresses.filter((address) =>
    allAddresses.includes(address),
  )

  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses: addressesForWallets,
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
