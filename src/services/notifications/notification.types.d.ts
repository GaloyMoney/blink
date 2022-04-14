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
  fiatSymbol: string
  fiatAmount: string
  satsAmount: string
}

type GetTitleBitcoinNoDisplayCurrencyArgs = {
  type: string
  locale: string
  satsAmount: string
}

type getTitleUsdArgs = {
  displayCurrency: DisplayCurrencyBaseAmount
  cents: UsdCents
}
