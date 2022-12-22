type PriceServiceError = import("./errors").PriceServiceError

type PriceRange =
  typeof import("./index").PriceRange[keyof typeof import("./index").PriceRange]
type PriceInterval =
  typeof import("./index").PriceInterval[keyof typeof import("./index").PriceInterval]

type Tick = {
  readonly date: Date
  readonly price: DisplayCurrencyPerSat
}

type PriceCurrency = {
  readonly code: string // currency iso code. E.g. USD
  readonly symbol: string // currency symbol. E.g. $
  readonly name: string // currency name. E.g. US Dollar
  readonly flag: string // currency country flag (emoji). E.g. 🇺🇸
}

type ListHistoryArgs = {
  range: PriceRange
  interval: PriceInterval
}

interface IPriceService {
  listCurrencies(): Promise<PriceCurrency[] | PriceServiceError>
  getRealTimePrice(): Promise<DisplayCurrencyPerSat | PriceServiceError>
  listHistory(args: ListHistoryArgs): Promise<Tick[] | PriceServiceError>
}
