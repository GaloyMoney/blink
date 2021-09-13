interface IPaymentNotification {
  amount: number
  type: string
  user: UserType
  logger: Logger
  hash?: string
  txid?: string
}

type GetTitleFunction = (args0: { usd: string; amount: number }) => string

type GetTitleNoUsdFunction = (args0: { amount: number }) => string
