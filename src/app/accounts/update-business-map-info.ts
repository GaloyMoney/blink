import { checkedCoordinates, checkedMapTitle } from "@domain/accounts"
import { AccountsRepository } from "@services/mongoose/accounts"

export const updateBusinessMapInfo = async ({
  username,
  coordinates: { latitude, longitude },
  title,
}: {
  username: string
  coordinates: { latitude: number; longitude: number }
  title: string
}): Promise<Account | Error> => {
  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findByUsername(username as Username)
  if (account instanceof Error) return account

  const coordinates = checkedCoordinates({ latitude, longitude })
  if (coordinates instanceof Error) return coordinates

  const titleChecked = checkedMapTitle(title)
  if (titleChecked instanceof Error) return titleChecked

  account.coordinates = coordinates
  account.title = titleChecked
  return accountsRepo.update(account)
}
