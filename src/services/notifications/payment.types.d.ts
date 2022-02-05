interface IPaymentNotification {
  amount: Satoshis
  type: string
  user: User
  logger: Logger
  paymentHash?: PaymentHash
  txHash?: OnChainTxHash
  usdPerSat?: UsdPerSat
}
