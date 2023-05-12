type OnChainAddressIdentifier = {
  readonly pubkey: Pubkey
  readonly address: OnChainAddress
}

interface IWalletOnChainAddressesRepository {
  persistNew({
    walletId,
    onChainAddress,
  }: {
    walletId: WalletId
    onChainAddress: OnChainAddressIdentifier
  }): Promise<OnChainAddressIdentifier | RepositoryError>
  findLastByWalletId(
    walletId: WalletId,
  ): Promise<OnChainAddressIdentifier | RepositoryError>
}

type ListWalletOnChainPendingReceiveArgs = {
  walletId: WalletId
}

type PersistWalletOnChainPendingReceiveArgs = Omit<
  WalletOnChainSettledTransaction,
  "id" | "status" | "memo"
>

type RemoveWalletOnChainPendingReceiveArgs = {
  walletId: WalletId
  txHash: OnChainTxHash
}

interface IWalletOnChainPendingReceiveRepository {
  listByWalletId(
    args: ListWalletOnChainPendingReceiveArgs,
  ): Promise<WalletOnChainSettledTransaction[] | RepositoryError>
  persistNew(
    args: PersistWalletOnChainPendingReceiveArgs,
  ): Promise<WalletOnChainSettledTransaction | RepositoryError>
  remove(args: RemoveWalletOnChainPendingReceiveArgs): Promise<true | RepositoryError>
}
