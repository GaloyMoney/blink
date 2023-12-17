import {
  AccountValidator,
  checkedCoordinates,
  checkedMapTitle,
  checkedToUsername,
} from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose/accounts"

export const updateBusinessMapInfo = async ({
  username,
  coordinates: { latitude, longitude },
  title,
}: {
  username: string
  coordinates: { latitude: number; longitude: number }
  title: string
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const usernameChecked = checkedToUsername(username)
  if (usernameChecked instanceof Error) return usernameChecked

  const account = await accountsRepo.findByUsername(usernameChecked)
  if (account instanceof Error) return account
  const accountValidator = AccountValidator(account)
  if (accountValidator instanceof Error) return accountValidator

  const coordinates = checkedCoordinates({ latitude, longitude })
  if (coordinates instanceof Error) return coordinates

  const titleChecked = checkedMapTitle(title)
  if (titleChecked instanceof Error) return titleChecked

  account.coordinates = coordinates
  account.title = titleChecked
  return accountsRepo.update(account)
}
