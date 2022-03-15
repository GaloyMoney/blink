type WalletInvoice = {
  readonly paymentHash: PaymentHash
  readonly secret: SecretPreImage
  readonly walletId: WalletId
  readonly selfGenerated: boolean
  readonly pubkey: Pubkey
  readonly cents: UsdCents | undefined
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

  yieldPending: () => AsyncGenerator<WalletInvoice> | RepositoryError

  deleteByPaymentHash: (paymentHash: PaymentHash) => Promise<boolean | RepositoryError>

  deleteUnpaidOlderThan: (before: Date) => Promise<number | RepositoryError>
}
