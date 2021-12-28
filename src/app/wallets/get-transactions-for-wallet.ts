import { PartialResult } from "@app/partial-result"
import { getCurrentPrice } from "@app/prices"
import { BTC_NETWORK, ONCHAIN_MIN_CONFIRMATIONS, ONCHAIN_SCAN_DEPTH } from "@config/app"
import { OnChainError, TxDecoder, TxFilter } from "@domain/bitcoin/onchain"
import { RepositoryError } from "@domain/errors"
import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { baseLogger } from "@services/logger"
import { WalletsRepository } from "@services/mongoose"

export const getTransactionsForWalletId = async ({
  walletId,
}: {
  walletId: WalletId
}): Promise<PartialResult<WalletTransaction[]>> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof RepositoryError) return PartialResult.err(wallet)
  return getTransactionsForWallet(wallet)
}

export const getTransactionsForWallet = async (
  wallet: Wallet,
): Promise<PartialResult<WalletTransaction[]>> => {
  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getLiabilityTransactions(wallet.id)
  if (ledgerTransactions instanceof LedgerError)
    return PartialResult.err(ledgerTransactions)

  const confirmedHistory = WalletTransactionHistory.fromLedger(ledgerTransactions)

  const onChain = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChain instanceof OnChainError) {
    baseLogger.warn({ onChain }, "impossible to create OnChainService")
    return PartialResult.partial(confirmedHistory.transactions, onChain)
  }

  const onChainTxs = await onChain.listIncomingTransactions(ONCHAIN_SCAN_DEPTH)
  if (onChainTxs instanceof OnChainError) {
    baseLogger.warn({ onChainTxs }, "impossible to get listIncomingTransactions")
    return PartialResult.partial(confirmedHistory.transactions, onChainTxs)
  }

  const addresses = wallet.onChainAddresses()
  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses,
  })
  const pendingTxs = filter.apply(onChainTxs)

  let price = await getCurrentPrice()
  if (price instanceof Error) {
    price = NaN as UsdPerSat
  }

  return PartialResult.ok(
    confirmedHistory.addPendingIncoming(wallet.id, pendingTxs, addresses, price)
      .transactions,
  )
}
