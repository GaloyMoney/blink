import { memoSharingConfig } from "@config"
import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"

import { getNonEndUserWalletIds, LedgerService } from "@services/ledger"
import { WalletsRepository } from "@services/mongoose"

export const getAccountTransactionsForContact = async ({
  account,
  contactUsername,
  paginationArgs,
}: {
  account: Account
  contactUsername: Username
  paginationArgs?: PaginationArgs
}): Promise<PaginatedArray<WalletTransaction> | ApplicationError> => {
  const ledger = LedgerService()

  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) return wallets

  const resp = await ledger.getTransactionsByWalletIdAndContactUsername({
    walletIds: wallets.map((wallet) => wallet.id),
    contactUsername,
    paginationArgs,
  })
  if (resp instanceof LedgerError) return resp

  const confirmedHistory = WalletTransactionHistory.fromLedger({
    ledgerTransactions: resp.slice,
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
    memoSharingConfig,
  })

  return { slice: confirmedHistory.transactions, total: resp.total }
}
