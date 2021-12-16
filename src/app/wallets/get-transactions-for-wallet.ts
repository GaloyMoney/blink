import { RepositoryError } from "@domain/errors"
import { OnChainError, TxFilter, TxDecoder } from "@domain/bitcoin/onchain"
import { WalletsRepository } from "@services/mongoose"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { toLiabilitiesAccountId, LedgerError } from "@domain/ledger"
import { ONCHAIN_SCAN_DEPTH, ONCHAIN_MIN_CONFIRMATIONS, BTC_NETWORK } from "@config/app"
import { WalletTransactionHistory } from "@domain/wallets"
import { PartialResult } from "@app/partial-result"
import { getCurrentPrice } from "@app/prices"

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
  const liabilitiesAccountId = toLiabilitiesAccountId(wallet.id)
  const ledgerTransactions = await ledger.getLiabilityTransactions(liabilitiesAccountId)
  if (ledgerTransactions instanceof LedgerError)
    return PartialResult.err(ledgerTransactions)

  const confirmedHistory = WalletTransactionHistory.fromLedger(ledgerTransactions)

  const onChain = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChain instanceof OnChainError) {
    return PartialResult.partial(confirmedHistory.transactions, onChain)
  }

  const onChainTxs = await onChain.listIncomingTransactions(ONCHAIN_SCAN_DEPTH)
  if (onChainTxs instanceof OnChainError) {
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
