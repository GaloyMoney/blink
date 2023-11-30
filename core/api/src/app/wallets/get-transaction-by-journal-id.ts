import { memoSharingConfig } from "@/config"
import { WalletTransactionHistory } from "@/domain/wallets"
import { getNonEndUserWalletIds, LedgerService } from "@/services/ledger"

export const getTransactionForWalletByJournalId = async ({
  walletId,
  journalId,
}: {
  walletId: WalletId
  journalId: LedgerJournalId
}): Promise<WalletTransaction | ApplicationError> => {
  const ledger = LedgerService()

  const ledgerTransaction = await ledger.getTransactionForWalletByJournalId({
    walletId,
    journalId,
  })
  if (ledgerTransaction instanceof Error) return ledgerTransaction

  return WalletTransactionHistory.fromLedger({
    txn: ledgerTransaction,
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
    memoSharingConfig,
  })
}
