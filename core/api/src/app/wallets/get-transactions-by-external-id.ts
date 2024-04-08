import { memoSharingConfig } from "@/config"
import { checkedToPartialLedgerExternalId } from "@/domain/ledger"
import { WalletTransactionHistory } from "@/domain/wallets"
import { getNonEndUserWalletIds } from "@/services/ledger"

import * as LedgerFacade from "@/services/ledger/facade"

export const getTransactionsForWalletsByExternalId = async ({
  walletIds,
  uncheckedExternalIdPattern,
}: {
  walletIds: WalletId[]
  uncheckedExternalIdPattern: string
}): Promise<WalletTransaction[] | ApplicationError> => {
  const externalIdPattern = checkedToPartialLedgerExternalId(uncheckedExternalIdPattern)
  if (externalIdPattern instanceof Error) return externalIdPattern

  const ledgerTransactions =
    await LedgerFacade.getTransactionsForWalletsByExternalIdPattern({
      walletIds,
      externalIdPattern,
    })
  if (ledgerTransactions instanceof Error) return ledgerTransactions

  const nonEndUserWalletIds = Object.values(await getNonEndUserWalletIds())

  return ledgerTransactions.map((txn) =>
    WalletTransactionHistory.fromLedger({
      txn,
      nonEndUserWalletIds,
      memoSharingConfig,
    }),
  )
}
