type Payment = {
  senderWalletId: WalletId
  senderWalletCurrency: WalletCurrency
  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount
}

interface PaymentsRepository {
  persistNew(Payment): Promise<Payment | RepositoryError>
}
