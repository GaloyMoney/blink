import { MerchantsRepository } from "@/services/mongoose"

export * from "./suggest-merchant-map"
export * from "./delete-merchant-map"
export * from "./approve-merchant-map"

const merchants = MerchantsRepository()

export const getMerchantsMapMarkers = async () => {
  return merchants.listForMap()
}

export const getMerchantsPendingApproval = async () => {
  return merchants.listPendingApproval()
}
