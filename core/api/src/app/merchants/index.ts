import { checkedToUsername } from "@/domain/accounts"
import { CouldNotFindMerchantFromUsernameError } from "@/domain/errors"
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

export const getMerchantsByUsername = async (username: string) => {
  const usernameValidated = checkedToUsername(username)
  if (usernameValidated instanceof Error) {
    return usernameValidated
  }

  const result = await merchants.findByUsername(usernameValidated)

  if (result instanceof CouldNotFindMerchantFromUsernameError) {
    return []
  }

  return result
}
