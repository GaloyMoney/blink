interface IPriceService {
  getCurrentPrice(): Promite<UsdPerSat | PriceServiceError>
}
