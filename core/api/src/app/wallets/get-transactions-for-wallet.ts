import { MAX_PAGINATION_PAGE_SIZE, memoSharingConfig } from "@/config"

import { LedgerError } from "@/domain/ledger"
import { WalletTransactionHistory } from "@/domain/wallets"

import { getNonEndUserWalletIds, LedgerService } from "@/services/ledger"
import { checkedToPaginatedQueryArgs } from "@/domain/primitives"

export const getTransactionsForWallets = async ({
  wallets,
  rawPaginationArgs,
}: {
  wallets: Wallet[]
  rawPaginationArgs: RawPaginationArgs
}): Promise<PaginatedQueryResult<WalletTransaction> | ApplicationError> => {
  const paginationArgs = checkedToPaginatedQueryArgs({
    paginationArgs: rawPaginationArgs,
    maxPageSize: MAX_PAGINATION_PAGE_SIZE,
  })

  if (paginationArgs instanceof Error) return paginationArgs

  const walletIds = wallets.map((wallet) => wallet.id)

  const ledgerTxs = await LedgerService().getTransactionsByWalletIds({
    walletIds,
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
