import { memoSharingConfig } from "@/config"
import { WalletTransactionHistory } from "@/domain/wallets"

import { getNonEndUserWalletIds, LedgerService } from "@/services/ledger"

export const getTransactionsForWalletByPaymentHash = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<WalletTransaction[] | ApplicationError> => {
  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getTransactionsForWalletByPaymentHash({
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
