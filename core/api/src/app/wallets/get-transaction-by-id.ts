import { memoSharingConfig } from "@/config"
import { WalletTransactionHistory } from "@/domain/wallets"
import {
  checkedToLedgerTransactionId,
  CouldNotFindTransactionError,
} from "@/domain/ledger"

import { getNonEndUserWalletIds, LedgerService } from "@/services/ledger"

export const getTransactionForWalletById = async ({
  walletId,
  transactionId: uncheckedTransactionId,
}: {
  walletId: WalletId
  transactionId: string
}): Promise<WalletTransaction | ApplicationError> => {
  const transaction = await getTransactionById(uncheckedTransactionId)
  if (transaction instanceof Error) return transaction
  if (transaction.walletId !== walletId) return new CouldNotFindTransactionError()
  return transaction
}

export const getTransactionById = async (
  id: string,
): Promise<WalletTransaction | ApplicationError> => {
  const ledger = LedgerService()

  const ledgerTxId = checkedToLedgerTransactionId(id)
  if (ledgerTxId instanceof Error) return ledgerTxId

  const ledgerTransaction = await ledger.getTransactionById(ledgerTxId)
  if (ledgerTransaction instanceof Error) return ledgerTransaction

  return WalletTransactionHistory.fromLedger({
    ledgerTransactions: [ledgerTransaction],
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
    memoSharingConfig,
  }).transactions[0]
}
