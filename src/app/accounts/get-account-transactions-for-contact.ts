import { LedgerService } from "@services/ledger"
import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { WalletsRepository } from "@services/mongoose"

export const getAccountTransactionsForContact = async ({
  account,
  contactUsername,
}: {
  account: Account
  contactUsername: Username
}): Promise<WalletTransaction[] | ApplicationError> => {
  const ledger = LedgerService()
  let transactions: WalletTransaction[] = []

  const walletIds = await WalletsRepository().listWalletIdsByAccountId(account.id)
  if (walletIds instanceof Error) return walletIds

  for (const walletId of walletIds) {
    const ledgerTransactions = await ledger.getLiabilityTransactionsForContactUsername(
      walletId,
      contactUsername,
    )
    if (ledgerTransactions instanceof LedgerError) return ledgerTransactions

    const confirmedHistory = WalletTransactionHistory.fromLedger(ledgerTransactions)
    transactions = transactions.concat(confirmedHistory.transactions)
  }

  return transactions
}
