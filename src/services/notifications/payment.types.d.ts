interface IPaymentNotification {
  amount: number
  type: string
  user: UserType
  logger: Logger
  paymentHash?: PaymentHash
  txHash?: OnChainTxHash
  usdPerSat?: UsdPerSat
}
