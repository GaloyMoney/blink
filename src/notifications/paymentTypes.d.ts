interface IPaymentNotification {
  amount: number
  type: string
  user: UserType
  logger: Logger
  hash?: string
  txid?: string
}
