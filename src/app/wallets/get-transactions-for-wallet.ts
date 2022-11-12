import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import { getCurrentPrice } from "@app/prices"
import { PartialResult } from "@app/partial-result"

import { LedgerError } from "@domain/ledger"
import { RepositoryError } from "@domain/errors"
import { WalletTransactionHistory } from "@domain/wallets"
import { TxFilter } from "@domain/bitcoin/onchain"

import { baseLogger } from "@services/logger"
import { LedgerService } from "@services/ledger"
import { WalletsRepository } from "@services/mongoose"

import { getOnChainTxs } from "./private/get-on-chain-txs"

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

  const onChainTxs = await getOnChainTxs()
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
