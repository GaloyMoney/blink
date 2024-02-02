import { MerchantsRepository } from "@/services/mongoose"

export * from "./update-business-map-info"
export * from "./delete-business-map-info"

const merchants = MerchantsRepository()

export const getMerchantsMapMarkers = async () => {
  return merchants.listForMap()
}
