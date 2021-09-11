type WalletInvoice = {
  readonly paymentHash: PaymentHash
  readonly walletId: WalletId
  readonly selfGenerated: boolean
  readonly pubkey: Pubkey
  paid: boolean
}

type WalletInvoiceValidator = {
  validateToSend({ fromWalletId: WalletId }): void | Error
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

  listWalletIdsWithPendingInvoices: () => AsyncGenerator<WalletId> | RepositoryError

  deleteByPaymentHash: (paymentHash: PaymentHash) => Promise<boolean | RepositoryError>

  deleteUnpaidOlderThan: (before: Date) => Promise<number | RepositoryError>
}
