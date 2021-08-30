import { PriceServiceError, UnknownPriceServiceError } from "@domain/price"
import { getCurrentPrice } from "@services/realtime-price"

export const PriceService = (): IPriceService => {
  const fetchPrice = async () => {
    try {
      const price = await getCurrentPrice()
      if (typeof price !== "number") {
        return new PriceServiceError("Couldn't fetch price")
      }
      return price as UsdPerSat
    } catch (err) {
      return new UnknownPriceServiceError(err)
    }
  }
  return {
    getCurrentPrice: fetchPrice,
  }
}
