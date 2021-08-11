type AddressIdentifier = {
  pubkey: Pubkey
  address: OnchainAddress
}

interface IWallets {
  getOnchainAddressesFor(
    walletId: WalletId,
  ): Promise<AddressIdentifier[] | RepositoryError>
  getConfirmedTransactionsFor(
    walletId: WalletId,
  ): Promise<OnChainTransaction[] | OnChainServiceError>
  getUnconfirmedTransactionsFor(
    walletId: WalletId,
  ): Promise<OnChainTransaction[] | OnChainServiceError>
}
