type Payment = {
  senderWalletId: WalletId
  senderWalletCurrency: WalletCurrency
  settlementMethod: SettlementMethod
  paymentInitiationMethod: PaymentInitiationMethod

  btcFeeAmount?: BtcPaymentAmount
  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount
  paymentRequest?: EncodedPaymentRequest
}

type LightningPaymentBuilder = {
  withSenderWallet<T extends WalletCurrency>(
    senderWallet: WalletDescriptor<T>,
  ): LightningPaymentBuilder
  withInvoice(invoice: LnInvoice): LightningPaymentBuilder
  withUncheckedAmount(amount: number): LightningPaymentBuilder
  payment(): Payment | ValidationError
}

type LightningPaymentBuilderState = {
  localNodeIds: Pubkey[]
  validationError?: ValidationError
  senderWalletId?: WalletId
  senderWalletCurrency?: WalletCurrency
  settlementMethod?: SettlementMethod
  btcFeeAmount?: BtcPaymentAmount
  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount
  invoice?: LnInvoice
  uncheckedAmount?: number
}

interface IPaymentsRepository {
  persistNew(Payment): Promise<Payment | RepositoryError>
}
