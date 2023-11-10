import { MAX_PAGINATION_PAGE_SIZE, memoSharingConfig } from "@/config"

import { LedgerError } from "@/domain/ledger"
import { WalletTransactionHistory } from "@/domain/wallets"

import { getNonEndUserWalletIds, LedgerService } from "@/services/ledger"
import { checkedToPaginatedQueryArgs } from "@/domain/primitives"

export const getTransactionsForWalletsByAddresses = async ({
  wallets,
  addresses,
  rawPaginationArgs,
}: {
  wallets: Wallet[]
  addresses: OnChainAddress[]
  rawPaginationArgs: {
    first?: number | null
    last?: number | null
    before?: string | null
    after?: string | null
  }
}): Promise<PaginatedQueryResult<WalletTransaction> | ApplicationError> => {
  const paginationArgs = checkedToPaginatedQueryArgs({
    paginationArgs: rawPaginationArgs,
    maxPageSize: MAX_PAGINATION_PAGE_SIZE,
  })

  if (paginationArgs instanceof Error) {
    return paginationArgs
  }

  const walletIds = wallets.map((wallet) => wallet.id)

  const ledgerTxs = await LedgerService().getTransactionsByWalletIdsAndAddresses({
    walletIds,
    paginationArgs,
    addresses,
  })

  if (ledgerTxs instanceof LedgerError) {
    return ledgerTxs
  }

  const nonEndUserWalletIds = Object.values(await getNonEndUserWalletIds())

  const txEdges = ledgerTxs.edges.map((edge) => {
    const { transactions } = WalletTransactionHistory.fromLedger({
      ledgerTransactions: [edge.node],
      nonEndUserWalletIds,
      memoSharingConfig,
    })

    return {
      cursor: edge.cursor,
      node: transactions[0],
    }
  })

  return { ...ledgerTxs, edges: txEdges }
}
