type OnChainAddressIdentifier = {
  pubkey: Pubkey
  address: OnChainAddress
}

type Wallet = {
  onChainAddressIdentifiers: OnChainAddressIdentifier[]
  onChainAddresses: OnChainAddress[]
}

interface IWallets {
  findById(walletId: WalletId): Promise<Wallet | RepositoryError>
}
