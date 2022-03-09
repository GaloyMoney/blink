type Payment = {
  senderWalletId: WalletId
  senderWalletCurrency: WalletCurrency
  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount
  unknownCurrencyPaymentAmount?: number
  hasInvalidBtcPaymentAmount?: boolean
  hasInvalidUsdPaymentAmount?: boolean
  paymentRequest?: EncodedPaymentRequest
  isIntraledger: boolean
  feeAmount: PaymentAmount<WalletCurrency>
  balanceAmount: PaymentAmount<WalletCurrency>
  hasEnoughBalance: boolean
}

type PaymentBuilder = {
  withPaymentRequest(paymentRequest: EncodedPaymentRequest): PaymentBuilder
  withBtcPaymentAmount(amount: BtcPaymentAmount): PaymentBuilder
  withAmountFromUnknownCurrencyAmount(amount: number): PaymentBuilder
  withSenderWallet(senderWallet: Wallet): PaymentBuilder
  withCheckedIfLocal(isLocal: boolean): PaymentBuilder
  withCheckedHasBalance(balance: CurrencyBaseAmount): PaymentBuilder
  payment(): Payment | ApplicationError
}
interface PaymentsRepository {
  persistNew(Payment): Promise<Payment | RepositoryError>
}
