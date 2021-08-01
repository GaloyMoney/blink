interface IDataNotification {
  type: TransactionType
  amount: number
  hash?: string
  txid?: string // FIXME in mongodb, there is no differenciation between hash and txid?
}

interface INotification {
  user: UserType
  title: string
  data?: IDataNotification
  body?: string
  logger: Logger
}
