import { getTransactionForWalletByJournalId } from "../wallets"

import { NotificationsService } from "@/services/notifications"

export const sendPaymentNotification = async ({
  walletId,
  userId,
  accountId,
  level,
  journalId,
}: {
  walletId: WalletId
  userId: UserId
  accountId: AccountId
  level: AccountLevel
  journalId: LedgerJournalId
}): Promise<WalletTransaction | ApplicationError> => {
  const walletTransaction = await getTransactionForWalletByJournalId({
    walletId,
    journalId,
  })
  if (walletTransaction instanceof Error) return walletTransaction

  NotificationsService().sendTransaction({
    recipient: {
      accountId,
      walletId,
      userId,
      level,
    },
    transaction: walletTransaction,
  })

  return walletTransaction
}
