import { checkedToUsername } from "@/domain/accounts"
import { MerchantsRepository } from "@/services/mongoose"

export const deleteBusinessMapInfo = async ({
  id,
}: {
  id: MerchantId
}): Promise<void | ApplicationError> => {
  const merchantsRepo = MerchantsRepository()

  const result = await merchantsRepo.remove(id)
  if (result instanceof Error) return result

  return
}

export const deleteMerchantByUsername = async ({
  username,
}: {
  username: string
}): Promise<void | ApplicationError> => {
  const merchantsRepo = MerchantsRepository()

  const usernameChecked = checkedToUsername(username)
  if (usernameChecked instanceof Error) return usernameChecked

  const merchants = await merchantsRepo.findByUsername(usernameChecked)
  if (merchants instanceof Error) return merchants

  if (merchants.length === 0) return

  for (const merchant of merchants) {
    const result = await merchantsRepo.remove(merchant.id)
    if (result instanceof Error) return result
  }

  return
}
