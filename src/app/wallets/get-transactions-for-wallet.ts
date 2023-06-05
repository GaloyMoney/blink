import { PartialResult } from "@app/partial-result"

import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { CouldNotFindError } from "@domain/errors"

import { getNonEndUserWalletIds, LedgerService } from "@services/ledger"
import { WalletOnChainPendingReceiveRepository } from "@services/mongoose"

export const getTransactionsForWallets = async ({
  wallets,
  paginationArgs,
}: {
  wallets: Wallet[]
  paginationArgs?: PaginationArgs
}): Promise<PartialResult<PaginatedArray<WalletTransaction>>> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  let pendingHistory = await WalletOnChainPendingReceiveRepository().listByWalletIds({
    walletIds,
  })
  if (pendingHistory instanceof Error) {
    if (pendingHistory instanceof CouldNotFindError) {
      pendingHistory = []
    } else {
      return PartialResult.err(pendingHistory)
    }
  }

  const confirmedLedgerTxns = await LedgerService().getTransactionsByWalletIds({
    walletIds,
    paginationArgs,
  })

  if (confirmedLedgerTxns instanceof LedgerError) {
    return PartialResult.partial(
      { slice: pendingHistory, total: pendingHistory.length },
      confirmedLedgerTxns,
    )
  }

  const confirmedHistory = WalletTransactionHistory.fromLedger({
    ledgerTransactions: confirmedLedgerTxns.slice,
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
  })

  const transactions = [...pendingHistory, ...confirmedHistory.transactions]

  return PartialResult.ok({
    slice: transactions,
    total: confirmedLedgerTxns.total + pendingHistory.length,
  })
}
