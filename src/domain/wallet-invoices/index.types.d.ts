type WalletInvoice = {
  paymentHash: PaymentHash
  walletId: WalletId
  selfGenerated: boolean
  pubkey: Pubkey
  paid: boolean
}

interface IWalletInvoicesRepository {
  persistNew: (invoice: WalletInvoice) => Promise<WalletInvoice | RepositoryError>

  update: (invoice: WalletInvoice) => Promise<WalletInvoice | RepositoryError>

  findByPaymentHash: (
    paymentHash: PaymentHash,
  ) => Promise<WalletInvoice | RepositoryError>

  findPendingByWalletId: (
    walletId: WalletId,
  ) => AsyncGenerator<WalletInvoice> | RepositoryError

  listWalletsWithPendingInvoices: () => AsyncGenerator<WalletId> | RepositoryError

  deleteByPaymentHash: (paymentHash: PaymentHash) => Promise<boolean | RepositoryError>

  deleteUnpaidOlderThan: (before: Date) => Promise<number | RepositoryError>
}
