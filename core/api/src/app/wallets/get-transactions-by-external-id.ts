import { MAX_PAGINATION_PAGE_SIZE, memoSharingConfig } from "@/config"
import { checkedToPartialLedgerExternalId } from "@/domain/ledger"
import { checkedToPaginatedQueryArgs } from "@/domain/primitives"
import { WalletTransactionHistory } from "@/domain/wallets"
import { getNonEndUserWalletIds } from "@/services/ledger"

import * as LedgerFacade from "@/services/ledger/facade"

export const getTransactionsForWalletsByExternalId = async ({
  walletIds,
  uncheckedExternalIdPattern,
  rawPaginationArgs,
}: {
  walletIds: WalletId[]
  uncheckedExternalIdPattern: string
  rawPaginationArgs: RawPaginationArgs
}): Promise<PaginatedQueryResult<WalletTransaction> | ApplicationError> => {
  const paginationArgs = checkedToPaginatedQueryArgs({
    paginationArgs: rawPaginationArgs,
    maxPageSize: MAX_PAGINATION_PAGE_SIZE,
  })
  if (paginationArgs instanceof Error) return paginationArgs

  const externalIdPattern = checkedToPartialLedgerExternalId(uncheckedExternalIdPattern)
  if (externalIdPattern instanceof Error) return externalIdPattern

  const ledgerTxs = await LedgerFacade.getTransactionsForWalletsByExternalIdPattern({
    walletIds,
    externalIdPattern,
    paginationArgs,
  })
  if (ledgerTxs instanceof Error) return ledgerTxs

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
