import { PendingOnChainTransactionsRepository } from "@services/mongoose/pending-onchain-transactions"

export const addPendingTransaction = async ({
  walletId,
  address,
  txHash,
  vout,
  amount,
}: {
  walletId?: WalletId
  address: OnChainAddress
  txHash: OnChainTxHash
  vout: number
  amount: BtcPaymentAmount
}) => {
  // SECTION: Repo add transaction
  const pendingTxn = PendingOnChainTransactionsRepository().persistNew({
    address,
    txHash,
    vout,
    amount,
  })
  if (pendingTxn instanceof Error) {
    return pendingTxn
  }
}
