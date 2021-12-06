import { AccountsRepository } from "@services/mongoose/accounts"

export const updateBusinessMapInfo = async ({
  username,
  coordinates,
  title,
}: {
  username: string
  coordinates: { latitude: number; longitude: number }
  title: string
}): Promise<Account | Error> => {
  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findByUsername(username as Username)
  if (account instanceof Error) return account

  account.coordinates = coordinates as Coordinates
  account.title = title as BusinessMapTitle
  return accountsRepo.update(account)
}
