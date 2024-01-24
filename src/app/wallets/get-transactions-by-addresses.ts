import { memoSharingConfig } from "@config"
import { PartialResult } from "@app/partial-result"

import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { CouldNotFindError } from "@domain/errors"

import { getNonEndUserWalletIds, LedgerService } from "@services/ledger"
import { WalletOnChainPendingReceiveRepository } from "@services/mongoose"

export const getTransactionsForWalletsByAddresses = async ({
  wallets,
  addresses,
  paginationArgs,
}: {
  wallets: Wallet[]
  addresses: OnChainAddress[]
  paginationArgs?: PaginationArgs
}): Promise<PartialResult<PaginatedArray<BaseWalletTransaction>>> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  let pendingHistory =
    await WalletOnChainPendingReceiveRepository().listByWalletIdsAndAddresses({
      walletIds,
      addresses,
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
  const ledgerTransactions = confirmedLedgerTxns.slice.filter(
    (tx) => tx.address && addresses.includes(tx.address),
  )

  const confirmedHistory = WalletTransactionHistory.fromLedger({
    ledgerTransactions,
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
    memoSharingConfig,
  })

  const transactions = [...pendingHistory, ...confirmedHistory.transactions]

  return PartialResult.ok({
    slice: transactions,
    total: transactions.length,
  })
}
