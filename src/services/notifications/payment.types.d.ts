interface IPaymentBitcoinNotification {
  sats: Satoshis
  type: string
  user: User
  logger: Logger
  paymentHash?: PaymentHash
  txHash?: OnChainTxHash
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

interface IPaymentUsdNotification {
  cents: UsdCents
  type: string
  user: User
  logger: Logger
  paymentHash?: PaymentHash
  txHash?: OnChainTxHash
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}
