type AddressIdentifier = {
  pubkey: Pubkey
  address: OnchainAddress
}

interface IWallets {
  getOnchainAddressesFor(
    walletId: WalletId,
  ): Promise<AddressIdentifier[] | RepositoryError>
}
