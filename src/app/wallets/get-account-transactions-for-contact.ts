import { LedgerService } from "@services/ledger"
import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"

export const getAccountTransactionsForContact = async ({
  account,
  contactUsername,
}: {
  account: Account
  contactUsername: Username
}): Promise<WalletTransaction[] | ApplicationError> => {
  const ledger = LedgerService()
  let transactions: WalletTransaction[] = []

  for (const walletId of account.walletIds) {
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
