import { AccountLevel } from "@/domain/accounts"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"

export const upgradeAccountFromDeviceToPhone = async ({
  userId,
  phone,
  phoneMetadata,
}: {
  userId: UserId
  phone: PhoneNumber
  phoneMetadata?: PhoneMetadata
}): Promise<Account | RepositoryError> => {
  // TODO: ideally both 1. and 2. should be done in a transaction,
  // so that if one fails, the other is rolled back

  // Update user
  const userUpdated = await UsersRepository().findById(userId)
  if (userUpdated instanceof Error) return userUpdated
  userUpdated.phone = phone

  const res = await UsersRepository().update({ ...userUpdated, phoneMetadata })
  if (res instanceof Error) return res

  // Update account
  const accountDevice = await AccountsRepository().findByUserId(userUpdated.id)
  if (accountDevice instanceof Error) return accountDevice
  accountDevice.level = AccountLevel.One
  const accountUpdated = await AccountsRepository().update(accountDevice)
  if (accountUpdated instanceof Error) return accountUpdated

  return accountUpdated
}
