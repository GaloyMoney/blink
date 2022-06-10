type WalletInvoice = {
  readonly paymentHash: PaymentHash
  readonly walletId: WalletId
  readonly selfGenerated: boolean
  readonly pubkey: Pubkey
  readonly cents: UsdCents | undefined
  readonly currency: WalletCurrency
  paid: boolean
  callback?: Callback
}

type WalletInvoiceValidator = {
  validateToSend(fromWalletId: WalletId): true | ValidationError
}

type WalletFactoryConfig = {
  walletId: WalletId
  currency: WalletCurrency
  callback?: Callback
}

interface IWalletInvoicesRepository {
  persistNew: (invoice: WalletInvoice) => Promise<WalletInvoice | RepositoryError>

  markAsPaid: (paymentHash: PaymentHash) => Promise<WalletInvoice | RepositoryError>

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
