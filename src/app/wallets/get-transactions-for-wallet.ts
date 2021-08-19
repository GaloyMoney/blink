import { RepositoryError } from "@domain/errors"
import { OnChainError, TxFilter, TxDecoder } from "@domain/bitcoin/onchain"
import { WalletsRepository } from "@services/mongoose"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { toLiabilitiesAccountId, LedgerError } from "@domain/ledger"
import { LOOK_BACK } from "@core/utils"
import { ONCHAIN_MIN_CONFIRMATIONS, BTC_NETWORK } from "@config/app"
import { WalletTransactionHistory } from "@domain/wallets"
import { PartialResult } from "@app/partial-result"

// TODO should be exposed via PriceSerivce / LiquidityProvider
import { getCurrentPrice } from "@services/realtime-price"

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

  const onChainTxs = await onChain.getIncomingTransactions(LOOK_BACK)
  if (onChainTxs instanceof OnChainError) {
    return PartialResult.partial(confirmedHistory.transactions, onChainTxs)
  }

  const addresses = wallet.onChainAddresses()
  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses,
  })
  const pendingTxs = filter.apply(onChainTxs)

  // TODO should be a service - not a function call
  let price = await getCurrentPrice()
  if (typeof price !== "number") {
    price = NaN
  }

  return PartialResult.ok(
    confirmedHistory.addPendingIncoming(pendingTxs, addresses, price).transactions,
  )
}
