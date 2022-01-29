import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
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

  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) return wallets

  for (const wallet of wallets) {
    const ledgerTransactions = await ledger.getTransactionsByWalletIdAndContactUsername(
      wallet.id,
      contactUsername,
    )
    if (ledgerTransactions instanceof LedgerError) return ledgerTransactions

    const confirmedHistory = WalletTransactionHistory.fromLedger(ledgerTransactions)
    transactions = transactions.concat(confirmedHistory.transactions)
  }

  return transactions
}
