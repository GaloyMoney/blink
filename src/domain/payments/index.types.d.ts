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

type PaymentBuilder = {
  withSenderWallet(senderWallet: Wallet): PaymentBuilder
  withPaymentRequest(paymentRequest: EncodedPaymentRequest): PaymentBuilder
  withBtcPaymentAmount(amount: BtcPaymentAmount): PaymentBuilder
  withUncheckedAmount(amount: number): PaymentBuilder
  withSettlementMethod(SettlementMethod): PaymentBuilder
  withPaymentInitiationMethod(PaymentInitiationMethod): PaymentBuilder
  withIsLocal(boolean): PaymentBuilder
  payment(): Payment | ValidationError
}

interface IPaymentsRepository {
  persistNew(Payment): Promise<Payment | RepositoryError>
}
