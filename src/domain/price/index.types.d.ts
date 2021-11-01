type PriceServiceError = import("./errors").PriceServiceError

type PriceRange =
  typeof import("./index").PriceRange[keyof typeof import("./index").PriceRange]
type PriceInterval =
  typeof import("./index").PriceInterval[keyof typeof import("./index").PriceInterval]

type Tick = {
  readonly date: Date
  readonly price: UsdPerSat
}

interface IPriceService {
  getCurrentPrice(): Promise<UsdPerSat | PriceServiceError>
  listHistory(
    range: PriceRange,
    interval: PriceInterval,
  ): Promise<Tick[] | PriceServiceError>
}
