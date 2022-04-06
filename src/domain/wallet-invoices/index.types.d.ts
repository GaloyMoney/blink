type WalletInvoice = {
  readonly paymentHash: PaymentHash
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

type WalletInvoiceAmounts = WalletInvoice & {
  usdToCreditReceiver: UsdPaymentAmount
  btcToCreditReceiver: BtcPaymentAmount
  usdBankFee: UsdPaymentAmount
  btcBankFee: BtcPaymentAmount
  receiverWalletDescriptor: WalletDescriptor<WalletCurrency>
}

type WalletInvoiceAmountsArgs = {
  walletInvoice: WalletInvoice
  receivedBtc: BtcPaymentAmount
  usdFromBtc(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>
  usdFromBtcMidPrice(
      amount: BtcPaymentAmount,
    ): Promise<UsdPaymentAmount | DealerPriceServiceError>
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
