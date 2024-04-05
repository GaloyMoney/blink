type PriceServiceError = import("./errors").PriceServiceError

type PriceRange =
  (typeof import("./index").PriceRange)[keyof typeof import("./index").PriceRange]
type PriceInterval =
  (typeof import("./index").PriceInterval)[keyof typeof import("./index").PriceInterval]

type Tick = {
  readonly date: Date
  readonly price: DisplayCurrencyPerSat
}

type RealTimePrice<T extends DisplayCurrency> = {
  timestamp: Date
  currency: T
  price: number
}

type PriceCurrency = {
  readonly code: DisplayCurrency // currency iso code. E.g. USD
  readonly symbol: string // currency symbol. E.g. $
  readonly name: string // currency name. E.g. US Dollar
  readonly flag: string // currency country flag (emoji). E.g. 🇺🇸
  readonly fractionDigits: number // fraction digits . E.g. 2
}

type GetRealTimePriceArgs = {
  walletCurrency: WalletCurrency
  displayCurrency: DisplayCurrency
}

type GetSatRealTimePriceArgs = Omit<GetRealTimePriceArgs, "walletCurrency">
type GetUsdCentRealTimePriceArgs = Omit<GetRealTimePriceArgs, "walletCurrency">

type ListHistoryArgs = {
  range: PriceRange
  interval: PriceInterval
}

interface IPriceService {
  listCurrencies(): Promise<PriceCurrency[] | PriceServiceError>
  getSatRealTimePrice(
    args: GetSatRealTimePriceArgs,
  ): Promise<RealTimePrice<DisplayCurrency> | PriceServiceError>
  getUsdCentRealTimePrice(
    args: GetUsdCentRealTimePriceArgs,
  ): Promise<RealTimePrice<DisplayCurrency> | PriceServiceError>
  listHistory(args: ListHistoryArgs): Promise<Tick[] | PriceServiceError>
}
