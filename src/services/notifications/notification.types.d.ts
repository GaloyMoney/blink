interface IDataNotification {
  type: LedgerTransactionType
  amount?: Satoshis // FIXME: is this consumed by the mobile app?
  cents?: UsdCents // FIXME: is this consumed by the mobile app?
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

type GetTitleBitcoinArgs = {
  type: string
  locale: string
  symbol: string
  displayCurrency: string
  sats: string
}

type GetTitleBitcoinNoDisplayCurrencyArgs = {
  type: string
  locale: string
  sats: string
}

type getTitleUsdArgs = {
  displayCurrency: DisplayCurrencyBaseAmount
  cents: UsdCents
}
