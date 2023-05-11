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

  const listByWalletIds = async ({
    walletIds,
    paginationArgs,
  }: {
    walletIds: WalletId[]
    paginationArgs?: PaginationArgs
  }): Promise<WalletOnChainSettledTransaction[] | RepositoryError> => {
    walletIds
    paginationArgs

    return undefined as unknown as WalletOnChainSettledTransaction[]
  }

  return {
    persistNew,
    listByWalletIds,
    remove,
  }
}
