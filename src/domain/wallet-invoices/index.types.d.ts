type WalletInvoice = {
  readonly paymentHash: PaymentHash
  readonly walletId: WalletId
  readonly selfGenerated: boolean
  readonly pubkey: Pubkey
  readonly fiatAmount: FiatAmount | undefined
  readonly currency: WalletCurrency
  paid: boolean
}

type WalletInvoiceValidator = {
  validateToSend(fromWalletId: WalletId): true | ValidationError
}

type WalletFactoryConfig = {
  walletId: WalletId
  currency: WalletCurrency
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
