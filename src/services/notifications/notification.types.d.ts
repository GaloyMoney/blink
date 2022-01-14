interface IDataNotification {
  type: TransactionType
  amount: number
  hash?: string
  txid?: string // FIXME in mongodb, there is no differentiation between hash and txid?
}

interface INotification {
  user: User
  title: string
  data?: IDataNotification
  body?: string
  logger: Logger
}
