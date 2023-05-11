export const PendingOnChainTransactionsRepository = () => {
  const persistNew = async (
    pendingTransaction: NewWalletOnChainSettledTransaction,
  ): Promise<NewWalletOnChainSettledTransaction | RepositoryError> => {
    pendingTransaction

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
