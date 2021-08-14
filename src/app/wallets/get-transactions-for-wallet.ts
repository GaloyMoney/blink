import { RepositoryError } from "@domain/errors"
import { OnChainError, MakeTxFilter, MakeTxDecoder } from "@domain/bitcoin/onchain"
import { MakeWalletsRepository } from "@services/mongoose/wallets"
import { MakeLedgerService } from "@services/ledger"
import { MakeOnChainService } from "@services/lnd/onchain-service"
import { toLiabilitiesAccountId, LedgerError } from "@domain/ledger"
import { LOOK_BACK } from "@core/utils"
import { ONCHAIN_MIN_CONFIRMATIONS } from "@config/app"
import { WalletTransactionHistory } from "@domain/wallets"

export const getTransactionsForWallet = async ({
  walletId,
}: {
  walletId: WalletId
}): Promise<WalletTransaction[] | CoreError> => {
  const wallets = MakeWalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof RepositoryError) return wallet

  const ledger = MakeLedgerService()
  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const ledgerTransactions = await ledger.liabilityTransactions(liabilitiesAccountId)
  if (ledgerTransactions instanceof LedgerError) return ledgerTransactions

  const confirmedHistory = WalletTransactionHistory.confirmed(ledgerTransactions)

  const onChain = MakeOnChainService(MakeTxDecoder(process.env.NETWORK as BtcNetwork))
  if (onChain instanceof OnChainError) return onChain
  const onChainTxs = await onChain.getIncomingTransactions(LOOK_BACK)
  if (onChainTxs instanceof OnChainError) return onChain

  const filter = MakeTxFilter({
    confsLT: ONCHAIN_MIN_CONFIRMATIONS,
    addresses: wallet.onChainAddresses,
  })
  const pendingTxs = filter.apply(onChainTxs)

  return confirmedHistory.addPendingIncoming(pendingTxs, wallet.onChainAddresses)
    .transactions
}
