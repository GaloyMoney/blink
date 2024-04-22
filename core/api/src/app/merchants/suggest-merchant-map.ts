import { checkedCoordinates, checkedMapTitle, checkedToUsername } from "@/domain/accounts"
import { AccountsRepository, MerchantsRepository } from "@/services/mongoose"

export const suggestMerchantMap = async ({
  username,
  coordinates: { latitude, longitude },
  title,
}: {
  username: string
  coordinates: { latitude: number; longitude: number }
  title: string
}): Promise<BusinessMapMarker | ApplicationError> => {
  const merchantsRepo = MerchantsRepository()

  const usernameChecked = checkedToUsername(username)
  if (usernameChecked instanceof Error) return usernameChecked

  const coordinates = checkedCoordinates({ latitude, longitude })
  if (coordinates instanceof Error) return coordinates

  const titleChecked = checkedMapTitle(title)
  if (titleChecked instanceof Error) return titleChecked

  const accountRepository = AccountsRepository()
  const account = await accountRepository.findByUsername(usernameChecked)
  if (account instanceof Error) {
    return account
  }

  return merchantsRepo.create({
    username: usernameChecked,
    coordinates,
    title: titleChecked,
    validated: false,
  })
}
