interface IPaymentNotification {
  amount: number
  type: string
  user: User
  logger: Logger
  paymentHash?: PaymentHash
  txHash?: OnChainTxHash
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}
