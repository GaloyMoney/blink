type WalletInvoice = {
  paymentHash: PaymentHash
  walletId: WalletId
  selfGenerated: boolean
  pubkey: Pubkey
  paid: boolean
}

interface IWalletInvoicesRepository {
  persist: (invoice: WalletInvoice) => Promise<WalletInvoice | RepositoryError>
  findByPaymentHash: (
    paymentHash: PaymentHash,
  ) => Promise<WalletInvoice | RepositoryError>
}
