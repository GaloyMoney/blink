import { memoSharingConfig } from "@/config"
import { CouldNotFindTransactionError } from "@/domain/ledger"
import { WalletTransactionHistory } from "@/domain/wallets"

import { getNonEndUserWalletIds, LedgerService } from "@/services/ledger"

export const getTransactionForWalletByHash = async ({
  walletId,
  hash,
}: {
  walletId: WalletId
  hash: PaymentHash | OnChainTxHash
}): Promise<WalletTransaction | ApplicationError> => {
  const transactions = await getTransactionsByHash(hash)
  if (transactions instanceof Error) return transactions
  const transaction = transactions.find(
    (transaction) => transaction.walletId === walletId,
  )

  if (!transaction) return new CouldNotFindTransactionError()

  return transaction
}

export const getTransactionsByHash = async (
  hash: PaymentHash | OnChainTxHash,
): Promise<WalletTransaction[] | ApplicationError> => {
  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getTransactionsByHash(hash)
  if (ledgerTransactions instanceof Error) return ledgerTransactions
  return WalletTransactionHistory.fromLedger({
    ledgerTransactions,
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
    memoSharingConfig,
  }).transactions
}
