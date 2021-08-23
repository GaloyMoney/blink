interface IPriceService {
  getCurrentPrice(): Promise<UsdPerSat | PriceServiceError>
}
