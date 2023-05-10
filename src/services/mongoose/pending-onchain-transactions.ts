export const PendingOnChainTransactionsRepository = () => {
  const persistNew = async ({
    userId,
    txHash,
    vout,
    amount,
  }: {
    userId: UserId
    txHash: OnChainTxHash
    vout: number
    amount: BtcPaymentAmount
  }) => {
    userId
    txHash
    vout
    amount

    return Error("Unimplemented")
  }

  const deletePendingTransaction = async ({
    txHash,
    vout,
  }: {
    txHash: OnChainTxHash
    vout: number
  }): Promise<boolean | RepositoryError> => {
    return true
  }

  return {
    persistNew,
    deletePendingTransaction,
  }
}
