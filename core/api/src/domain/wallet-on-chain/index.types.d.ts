type LndOnChainAddressIdentifier = {
  readonly pubkey: Pubkey
  readonly address: OnChainAddress
}

type OnChainAddressIdentifier = {
  readonly pubkey?: Pubkey
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
  isRecorded({
    walletId,
    onChainAddress,
  }: {
    walletId: WalletId
    onChainAddress: OnChainAddressIdentifier
  }): Promise<boolean | RepositoryError>
}

type ListWalletOnChainPendingReceiveArgs = {
  walletIds: WalletId[]
  paginationArgs?: PaginatedQueryArgs
}

type ListWalletOnChainPendingReceiveByAddressesArgs = {
  walletIds: WalletId[]
  addresses: OnChainAddress[]
  paginationArgs?: PaginatedQueryArgs
}

type PersistWalletOnChainPendingReceiveArgs = WalletOnChainPendingTransaction

type RemoveWalletOnChainPendingReceiveArgs = {
  walletId: WalletId
  transactionHash: OnChainTxHash
  vout: number
}

interface IWalletOnChainPendingReceiveRepository {
  listByWalletIds(
    args: ListWalletOnChainPendingReceiveArgs,
  ): Promise<WalletOnChainSettledTransaction[] | RepositoryError>
  listByWalletIdsAndAddresses(
    args: ListWalletOnChainPendingReceiveByAddressesArgs,
  ): Promise<WalletOnChainSettledTransaction[] | RepositoryError>
  persistNew(
    args: PersistWalletOnChainPendingReceiveArgs,
  ): Promise<WalletOnChainSettledTransaction | RepositoryError>
  remove(args: RemoveWalletOnChainPendingReceiveArgs): Promise<true | RepositoryError>
}
