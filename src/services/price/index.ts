import { PriceServiceError } from "@domain/price"
import { getCurrentPrice } from "@services/realtime-price"

export const PriceService = (): IPriceService => {
  const fetchPrice = async () => {
    const price = await getCurrentPrice()
    if (typeof price !== "number") {
      return new PriceServiceError("Couldn't fetch price")
    }
    return price
  }
  return {
    getCurrentPrice: fetchPrice,
  }
}
