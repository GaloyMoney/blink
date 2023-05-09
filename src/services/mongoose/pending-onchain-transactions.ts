export const PendingOnChainTransactionsRepository = () => {
  const persist = async ({
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

  return {
    persist,
  }
}
