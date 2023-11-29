import { MAX_PAGINATION_PAGE_SIZE, memoSharingConfig } from "@/config"
import { LedgerError } from "@/domain/ledger"
import { checkedToPaginatedQueryArgs } from "@/domain/primitives"
import { WalletTransactionHistory } from "@/domain/wallets"

import { getNonEndUserWalletIds, LedgerService } from "@/services/ledger"
import { WalletsRepository } from "@/services/mongoose"

export const getAccountTransactionsForContact = async ({
  account,
  contactUsername,
  rawPaginationArgs,
}: {
  account: Account
  contactUsername: Username
  rawPaginationArgs: RawPaginationArgs
}): Promise<PaginatedQueryResult<WalletTransaction> | ApplicationError> => {
  const paginationArgs = checkedToPaginatedQueryArgs({
    paginationArgs: rawPaginationArgs,
    maxPageSize: MAX_PAGINATION_PAGE_SIZE,
  })

  if (paginationArgs instanceof Error) return paginationArgs

  const ledger = LedgerService()

  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) return wallets

  const ledgerTxs = await ledger.getTransactionsByWalletIdAndContactUsername({
    walletIds: wallets.map((wallet) => wallet.id),
    contactUsername,
    paginationArgs,
  })
  if (ledgerTxs instanceof LedgerError) return ledgerTxs

  const nonEndUserWalletIds = Object.values(await getNonEndUserWalletIds())

  const txEdges = ledgerTxs.edges.map((edge) => {
    const transaction = WalletTransactionHistory.fromLedger({
      txn: edge.node,
      nonEndUserWalletIds,
      memoSharingConfig,
    })

    return {
      cursor: edge.cursor,
      node: transaction,
    }
  })

  return { ...ledgerTxs, edges: txEdges }
}
