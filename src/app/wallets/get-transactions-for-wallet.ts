import { RepositoryError } from "@domain/errors"
import { OnChainError, MakeTxFilter, MakeTxDecoder } from "@domain/bitcoin/onchain"
import { MakeWalletsRepository } from "@services/mongoose"
import { MakeLedgerService } from "@services/ledger"
import { MakeOnChainService } from "@services/lnd/onchain-service"
import { toLiabilitiesAccountId, LedgerError } from "@domain/ledger"
import { LOOK_BACK } from "@core/utils"
import { ONCHAIN_MIN_CONFIRMATIONS } from "@config/app"
import { WalletTransactionHistory } from "@domain/wallets"

// TODO should be exposed via PriceSerivce / LiquidityProvider
import { getCurrentPrice } from "@services/realtime-price"

export const getTransactionsForWalletId = async ({
  walletId,
}: {
  walletId: WalletId
}): Promise<{
  transactions: WalletTransaction[]
  error?: ApplicationError
}> => {
  const wallets = MakeWalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof RepositoryError) return { transactions: [], error: wallet }
  return getTransactionsForWallet(wallet)
}

export const getTransactionsForWallet = async (
  wallet: Wallet,
): Promise<{
  transactions: WalletTransaction[]
  error?: ApplicationError
}> => {
  const ledger = MakeLedgerService()
  const liabilitiesAccountId = toLiabilitiesAccountId(wallet.id)
  const ledgerTransactions = await ledger.liabilityTransactions(liabilitiesAccountId)
  if (ledgerTransactions instanceof LedgerError)
    return { transactions: [], error: ledgerTransactions }

  const confirmedHistory = WalletTransactionHistory.fromLedger(ledgerTransactions)

  const onChain = MakeOnChainService(MakeTxDecoder(process.env.NETWORK as BtcNetwork))
  if (onChain instanceof OnChainError) {
    return { transactions: confirmedHistory.transactions, error: onChain }
  }

  const onChainTxs = await onChain.getIncomingTransactions(LOOK_BACK)
  if (onChainTxs instanceof OnChainError) {
    return { transactions: confirmedHistory.transactions, error: onChainTxs }
  }

  const filter = MakeTxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses: wallet.onChainAddresses,
  })
  const pendingTxs = filter.apply(onChainTxs)

  // TODO should be a service - not a function call
  let price = await getCurrentPrice()
  if (typeof price !== "number") {
    price = NaN
  }

  return {
    transactions: confirmedHistory.addPendingIncoming(
      pendingTxs,
      wallet.onChainAddresses,
      price,
    ).transactions,
  }
}
