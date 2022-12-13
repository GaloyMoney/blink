import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { WalletsRepository } from "@services/mongoose"

export const getAccountTransactionsForContact = async ({
  account,
  contactUsername,
  paginationArgs,
}: {
  account: Account
  contactUsername: Username
  paginationArgs?: PaginationArgs
}): Promise<WalletTransaction[] | ApplicationError> => {
  const ledger = LedgerService()

  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) return wallets

  const ledgerTransactions = await ledger.getTransactionsByWalletIdAndContactUsername({
    walletIds: wallets.map((wallet) => wallet.id),
    contactUsername,
    paginationArgs,
  })
  if (ledgerTransactions instanceof LedgerError) return ledgerTransactions

  const confirmedHistory = WalletTransactionHistory.fromLedger(ledgerTransactions)

  return confirmedHistory.transactions
}
