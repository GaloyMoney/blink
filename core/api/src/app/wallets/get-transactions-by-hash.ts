import { memoSharingConfig } from "@/config"
import { WalletTransactionHistory } from "@/domain/wallets"

import { getNonEndUserWalletIds, LedgerService } from "@/services/ledger"
import * as LedgerFacade from "@/services/ledger/facade"

export const getTransactionsForWalletByPaymentHash = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<WalletTransaction[] | ApplicationError> => {
  const ledgerTransactions = await LedgerFacade.getTransactionsForWalletByPaymentHash({
    walletId,
    paymentHash,
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

export const getTransactionsByHash = async (
  hash: PaymentHash | OnChainTxHash,
): Promise<WalletTransaction[] | ApplicationError> => {
  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getTransactionsByHash(hash)
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
