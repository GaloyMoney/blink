import { checkedCoordinates, checkedMapTitle, checkedToUsername } from "@/domain/accounts"
import { CouldNotFindMerchantFromUsernameError } from "@/domain/errors"
import { MerchantsRepository } from "@/services/mongoose"

export const updateBusinessMapInfo = async ({
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

  const merchants = await merchantsRepo.findByUsername(usernameChecked)

  if (merchants instanceof CouldNotFindMerchantFromUsernameError) {
    return merchantsRepo.create({
      username: usernameChecked,
      coordinates,
      title: titleChecked,
      validated: true,
    })
  } else if (merchants instanceof Error) {
    return merchants
  }

  // TODO: manage multiple merchants for a single username
  const merchant = merchants[0]

  merchant.coordinates = coordinates
  merchant.title = titleChecked

  return merchantsRepo.update(merchant)
}
