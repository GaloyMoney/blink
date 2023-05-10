export const PendingOnChainTransactionsRepository = () => {
  const persistNew = async ({
    address,
    txHash,
    vout,
    amount,
  }: {
    address: OnChainAddress
    txHash: OnChainTxHash
    vout: number
    amount: BtcPaymentAmount
  }) => {
    address
    txHash
    vout
    amount

    return Error("Unimplemented")
  }

  const remove = async ({
    txHash,
    vout,
  }: {
    txHash: OnChainTxHash
    vout: number
  }): Promise<boolean | RepositoryError> => {
    txHash
    vout

    return true
  }

  return {
    persistNew,
    remove,
  }
}
