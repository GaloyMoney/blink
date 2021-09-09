type OnChainAddressIdentifier = {
  readonly pubkey: Pubkey
  readonly address: OnChainAddress
}

interface IWalletOnChainAddressesRepository {
  persistNew(
    walletId: WalletId,
    onChainAddress: OnChainAddressIdentifier,
  ): Promise<OnChainAddressIdentifier | RepositoryError>
  findLastByWalletId(
    walletId: WalletId,
  ): Promise<OnChainAddressIdentifier | RepositoryError>
}
