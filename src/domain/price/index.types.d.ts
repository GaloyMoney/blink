type PriceServiceError = import("./errors").PriceServiceError

interface IPriceService {
  getCurrentPrice(): Promise<UsdPerSat | PriceServiceError>
}
