import { PartialResult } from "@app/partial-result"
import { getCurrentPrice } from "@app/prices"
import { BTC_NETWORK, ONCHAIN_MIN_CONFIRMATIONS } from "@config"
import { OnChainError, TxDecoder, TxFilter } from "@domain/bitcoin/onchain"
import { RepositoryError } from "@domain/errors"
import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { baseLogger } from "@services/logger"
import { WalletsRepository } from "@services/mongoose"
import { wrapToRunInSpan } from "@services/tracing"

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

export const getTransactionsForWalletIds = async (
  walletIds: WalletId[],
): Promise<PartialResult<WalletTransaction[]>> => {
  const walletsRepo = WalletsRepository()

  const wallets: Wallet[] = []
  for (const walletId of walletIds) {
    const wallet = await walletsRepo.findById(walletId)
    if (wallet instanceof RepositoryError) return PartialResult.err(wallet)

    wallets.push(wallet)
  }
  return getTransactionsForWallets(wallets)
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
  const onChainTxs = await onChain.listIncomingTransactions(ONCHAIN_MIN_CONFIRMATIONS)
  if (onChainTxs instanceof OnChainError) {
    baseLogger.warn({ onChainTxs }, "impossible to get listIncomingTransactions")
    return PartialResult.partial(confirmedHistory.transactions, onChainTxs)
  }

  const addresses: OnChainAddress[] = []
  const addressesByWalletId: { walletId: OnChainAddress[] } = {} as {
    walletId: OnChainAddress[]
  }
  for (const wallet of wallets) {
    const walletAddresses = wallet.onChainAddresses()
    addressesByWalletId[wallet.id] = walletAddresses
    addresses.push(...walletAddresses)
  }

  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses,
  })

  const pendingIncoming = wrapToRunInSpan({
    namespace: `domain.bitcoin`,
    fn: () => filter.apply(onChainTxs),
  })()

  let price = await getCurrentPrice()
  if (price instanceof Error) {
    price = NaN as DisplayCurrencyPerSat
  }

  return PartialResult.ok(
    confirmedHistory.addPendingIncoming({
      pendingIncoming,
      addressesByWalletId,
      displayCurrencyPerSat: price,
    }).transactions,
  )
}
