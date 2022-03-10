type PaymentState<S extends WalletCurrency> = {
  senderWalletId: WalletId
  senderWalletCurrency: S
  settlementMethod: SettlementMethod
  paymentInitiationMethod: PaymentInitiationMethod
  paymentRequest: EncodedPaymentRequest

  btcProtocolFee: BtcPaymentAmount
  usdProtocolFee?: UsdPaymentAmount

  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount
}

type Payment<S extends WalletCurrency> = {
  senderWalletId: WalletId
  senderWalletCurrency: S
  settlementMethod: SettlementMethod
  paymentInitiationMethod: PaymentInitiationMethod

  btcProtocolFee?: BtcPaymentAmount
  usdProtocolFee?: UsdPaymentAmount

  protocolFeeInSenderWalletCurrency(): PaymentAmount<S>

  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount
  paymentRequest?: EncodedPaymentRequest
}

type LightningPaymentBuilder<S extends WalletCurrency> = {
  withSenderWallet(senderWallet: WalletDescriptor<S>): LightningPaymentBuilder<S>
  withInvoice(invoice: LnInvoice): LightningPaymentBuilder<S>
  withUncheckedAmount(amount: number): LightningPaymentBuilder<S>
  needsProtocolFee(): boolean
  payment(): Payment<S> | ValidationError
}

type LightningPaymentBuilderState<S extends WalletCurrency> = {
  localNodeIds: Pubkey[]
  validationError?: ValidationError
  senderWalletId?: WalletId
  senderWalletCurrency?: S
  settlementMethod?: SettlementMethod
  btcProtocolFee?: BtcPaymentAmount
  usdProtocolFee?: UsdPaymentAmount
  protocolFeeInSenderWalletCurrency?: PaymentAmount<S>
  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount
  invoice?: LnInvoice
  uncheckedAmount?: number
}

interface IPaymentsRepository {
  persistNew<S extends WalletCurrency>(
    payment: Payment<S>,
  ): Promise<Payment<S> | RepositoryError>
}
